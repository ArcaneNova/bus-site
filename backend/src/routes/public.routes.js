/**
 * public.routes.js
 * No auth required — for passenger-facing website/app queries.
 */

const express = require('express');
const router  = express.Router();
const Route   = require('../models/Route');
const Stage   = require('../models/Stage');
const Schedule= require('../models/Schedule');
const BusPosition = require('../models/BusPosition');

// GET /api/v1/public/search?from=&to=
router.get('/search', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from) return res.status(400).json({ success: false, message: '`from` stage name required.' });

    // Find routes that contain both `from` and `to` stages
    const fromStages = await Stage.find({ stage_name: { $regex: from, $options: 'i' } }).distinct('url_route_id');
    let filter = { url_route_id: { $in: fromStages }, isActive: true };

    if (to) {
      const toStages = await Stage.find({ stage_name: { $regex: to, $options: 'i' } }).distinct('url_route_id');
      filter.url_route_id.$in = fromStages.filter((id) => toStages.includes(id));
    }

    const routes = await Route.find(filter).limit(20);
    res.json({ success: true, routes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/public/route/:routeId/schedule?date=
router.get('/route/:routeId/schedule', async (req, res) => {
  try {
    const { date } = req.query;
    const d = date ? new Date(date) : new Date();
    d.setHours(0,0,0,0);

    const schedules = await Schedule.find({
      route:  req.params.routeId,
      date:   { $gte: d, $lt: new Date(d.getTime() + 86400000) },
      status: { $in: ['scheduled', 'in-progress'] },
    }).select('departureTime estimatedArrivalTime type status bus')
      .populate('bus', 'busNumber type')
      .sort({ departureTime: 1 });

    res.json({ success: true, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/public/bus/:busId/live
router.get('/bus/:busId/live', async (req, res) => {
  try {
    const pos = await BusPosition.findOne({ bus: req.params.busId })
      .sort({ timestamp: -1 })
      .populate('nextStage', 'stage_name');
    res.json({ success: true, position: pos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/public/fare?fromStage=&toStage=&busType=AC|non-AC|electric
router.get('/fare', async (req, res) => {
  try {
    const { fromStage, toStage, busType = 'non-AC', routeId } = req.query;

    // DTC fare slabs (approx, based on distance km)
    const slabs = [
      { maxKm: 2,   nonAC: 10, AC: 15, electric: 10 },
      { maxKm: 5,   nonAC: 15, AC: 20, electric: 15 },
      { maxKm: 10,  nonAC: 20, AC: 30, electric: 20 },
      { maxKm: 15,  nonAC: 25, AC: 40, electric: 25 },
      { maxKm: 20,  nonAC: 30, AC: 50, electric: 30 },
      { maxKm: 25,  nonAC: 35, AC: 60, electric: 35 },
      { maxKm: 30,  nonAC: 40, AC: 70, electric: 40 },
      { maxKm: 40,  nonAC: 50, AC: 85, electric: 50 },
      { maxKm: 999, nonAC: 60, AC: 100, electric: 60 },
    ];

    let distanceKm = 0;
    let fromName = fromStage || '';
    let toName = toStage || '';

    // If routeId given, get route distance
    if (routeId) {
      const route = await Route.findById(routeId, 'distance_km route_name start_stage end_stage');
      if (route) {
        distanceKm = route.distance_km || 0;
        fromName = fromName || route.start_stage;
        toName = toName || route.end_stage;
      }
    } else if (fromStage && toStage) {
      // Try to find matching route that has both stops
      const fromStages = await Stage.find({ stage_name: { $regex: fromStage, $options: 'i' } }).limit(5);
      const toStages   = await Stage.find({ stage_name: { $regex: toStage,   $options: 'i' } }).limit(5);

      if (fromStages.length && toStages.length) {
        // Estimate distance from seq difference
        const fromSeq = fromStages[0].seq || 1;
        const toSeq   = toStages[0].seq   || 10;
        const seqDiff = Math.abs(toSeq - fromSeq);
        distanceKm = Math.max(1, seqDiff * 1.5); // ~1.5 km per stop
        fromName = fromStages[0].stage_name;
        toName   = toStages[0].stage_name;
      }
    }

    // Look up fare slab
    const typeKey = busType === 'AC' ? 'AC' : busType === 'electric' ? 'electric' : 'nonAC';
    const slab = slabs.find(s => distanceKm <= s.maxKm) || slabs[slabs.length - 1];
    const fare = slab[typeKey];

    res.json({
      success: true,
      fare: {
        amount: fare,
        currency: 'INR',
        busType,
        distanceKm: Math.round(distanceKm * 10) / 10,
        from: fromName,
        to: toName,
        slabInfo: `Up to ${slab.maxKm} km`,
        concessionsAvailable: ['Senior Citizens (50%)', 'Students (25%)', 'Differently-abled (Free)'],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/public/stats — public stats for home page hero
router.get('/stats', async (req, res) => {
  try {
    const [totalRoutes, totalBuses, totalDrivers] = await Promise.all([
      Route.countDocuments({ isActive: true }),
      require('../models/Bus').countDocuments({ status: { $in: ['active', 'in-service'] } }),
      require('../models/Driver').countDocuments({ status: 'on-duty' }),
    ]);
    res.json({
      success: true,
      stats: {
        activeRoutes: totalRoutes,
        activeBuses: totalBuses,
        activeDrivers: totalDrivers,
        coverage: 'Delhi NCR',
        dailyPassengers: '3.5 Million+',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

