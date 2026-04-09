const BusPosition = require('../models/BusPosition');
const Bus         = require('../models/Bus');

// GET /api/v1/tracking/live  — all buses with recent position
exports.getLiveBuses = async (req, res) => {
  try {
    // Get latest position per bus using aggregation
    const positions = await BusPosition.aggregate([
      { $match: { isSimulated: { $ne: true } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$bus', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $lookup: { from: 'buses', localField: 'bus', foreignField: '_id', as: 'busInfo' } },
      { $unwind: { path: '$busInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'routes', localField: 'route', foreignField: '_id', as: 'routeInfo' } },
      { $unwind: { path: '$routeInfo', preserveNullAndEmptyArrays: true } },
    ]);

    res.json({ success: true, count: positions.length, positions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/tracking/bus/:busId  — latest position for one bus
exports.getBusPosition = async (req, res) => {
  try {
    const pos = await BusPosition.findOne({ bus: req.params.busId })
      .where('isSimulated').ne(true)
      .sort({ timestamp: -1 })
      .populate('route', 'route_name')
      .populate('nextStage', 'stage_name location');

    if (!pos) return res.status(404).json({ success: false, message: 'No position data found.' });
    res.json({ success: true, position: pos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/tracking/route/:routeId  — all buses on a route
exports.getBusesByRoute = async (req, res) => {
  try {
    const { Types } = require('mongoose');
    const positions = await BusPosition.aggregate([
      { $match: { route: new Types.ObjectId(req.params.routeId) } },
      { $match: { isSimulated: { $ne: true } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$bus', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);

    res.json({ success: true, count: positions.length, positions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/tracking/nearby?lat=&lng=&radius=1000
exports.getNearbyBuses = async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required.' });

    // Get all recent positions and filter by distance using MongoDB $geoNear
    const positions = await BusPosition.aggregate([
      {
        $geoNear: {
          near:          { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: 'distance',
          maxDistance:   Number(radius),
          spherical:     true,
          query:         { isSimulated: { $ne: true } },
        },
      },
      { $sort: { bus: 1, timestamp: -1 } },
      { $group: { _id: '$bus', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { distance: 1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, count: positions.length, positions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
