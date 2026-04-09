const PassengerDemand = require('../models/PassengerDemand');
const axios           = require('axios');

const AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

// GET /api/v1/demand?routeId=&date=&hour=
exports.getDemand = async (req, res) => {
  try {
    const { routeId, date, hour } = req.query;
    const filter = {};
    if (routeId) filter.route = routeId;
    if (hour !== undefined) filter.hour = Number(hour);
    if (date) {
      const d = new Date(date);
      filter.forDate = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }

    const demands = await PassengerDemand.find(filter)
      .populate('route', 'route_name')
      .sort({ forDate: -1, hour: 1 })
      .limit(200);

    res.json({ success: true, demands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/demand/predict  — call Python AI and save
exports.predictDemand = async (req, res) => {
  try {
    const payload = req.body; // { route_id, date, hour, ... features }
    const aiRes   = await axios.post(`${AI_URL}/predict/demand`, payload);
    const aiData  = aiRes.data;
    const predicted_count = aiData.predicted_count ?? aiData.prediction?.predicted_count ?? 0;
    const crowd_level     = aiData.crowd_level     ?? aiData.prediction?.crowd_level     ?? 'low';

    // Save to DB (non-blocking for speed)
    PassengerDemand.create({
      route:          payload.route_id,
      forDate:        new Date(payload.date),
      hour:           payload.hour,
      predictedCount: predicted_count,
      crowdLevel:     crowd_level,
      weather:        payload.weather || 'clear',
      isWeekend:      payload.is_weekend || false,
      isHoliday:      payload.is_holiday || false,
    }).catch(() => {}); // fire-and-forget

    res.status(201).json({
      success: true,
      prediction: {
        predicted_count,
        crowd_level,
        confidence: aiData.confidence,
        model:      aiData.model || 'lstm',
        features:   aiData.input_features ?? null,
      },
    });
  } catch (err) {
    // If AI service is down, return a realistic synthetic prediction
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      const hour  = Number(payload?.hour ?? req.body.hour ?? 12);
      const profile = [2,1,1,1,2,5,9,12,10,7,6,5,6,5,6,7,10,12,9,6,4,3,2,1];
      const base  = profile[hour] * 12;
      const pred  = Math.max(5, base + Math.floor(Math.random() * 20 - 10));
      const level = pred > 120 ? 'very_high' : pred > 80 ? 'high' : pred > 40 ? 'medium' : 'low';
      return res.status(200).json({
        success: true,
        prediction: { predicted_count: pred, crowd_level: level, confidence: 0.72, model: 'fallback' },
        warning: 'AI service unavailable — using fallback model',
      });
    }
    if (err.response) {
      return res.status(502).json({ success: false, message: 'AI service error.', detail: err.response.data });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};


// GET /api/v1/demand/heatmap?date=&hour=
// Returns aggregated lat/lng/intensity points for the demand heatmap overlay
exports.getHeatmap = async (req, res) => {
  try {
    const { date, hour } = req.query;
    const filter = {};
    if (hour !== undefined) filter.hour = Number(hour);
    if (date) {
      const d = new Date(date);
      filter.forDate = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }

    // Join with stages to get geo coordinates
    const Stage          = require('../models/Stage');
    const PassengerDemand = require('../models/PassengerDemand');

    const demands = await PassengerDemand.find(filter)
      .populate('route', 'route_name')
      .limit(500)
      .lean();

    // Fetch all stage coordinates and index by route
    const allStages = await Stage.find({}).select('route lat lng stage_name').lean();
    const stageMap  = {};
    for (const s of allStages) {
      const key = String(s.route);
      if (!stageMap[key]) stageMap[key] = [];
      if (s.lat && s.lng) stageMap[key].push({ lat: s.lat, lng: s.lng });
    }

    // Build heatmap points — one point per demand record anchored to first stage of route
    const points = [];
    for (const d of demands) {
      const routeId   = String(d.route?._id || d.route || '');
      const stages    = stageMap[routeId] || [];
      const intensity = d.predictedCount || 0;
      if (intensity <= 0) continue;

      if (stages.length > 0) {
        // Spread intensity across ALL stages of that route for complete coverage
        const spread = stages;
        for (const st of spread) {
          points.push({ lat: st.lat, lng: st.lng, intensity: Math.round(intensity / spread.length) });
        }
      }
    }

    res.json({ success: true, points });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/demand/:id/actual  — record actual count after trip
exports.updateActual = async (req, res) => {
  try {
    const { actualCount } = req.body;
    const demand = await PassengerDemand.findByIdAndUpdate(
      req.params.id,
      { actualCount },
      { new: true }
    );
    if (!demand) return res.status(404).json({ success: false, message: 'Demand record not found.' });
    res.json({ success: true, demand });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
