/**
 * mobile.routes.js
 * Routes for Driver & Passenger mobile apps (grouped under /api/v1/mobile)
 */

const express    = require('express');
const router     = express.Router();
const Schedule   = require('../models/Schedule');
const TripHistory= require('../models/TripHistory');
const BusPosition= require('../models/BusPosition');
const Favourite  = require('../models/Favourite');
const PushToken  = require('../models/PushToken');
const Driver     = require('../models/Driver');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ── DRIVER ROUTES ─────────────────────────────────────────────────────────

// GET /api/v1/mobile/driver/dashboard
router.get('/driver/dashboard', authorize('driver'), async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id })
      .populate('assignedBus');
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found.' });

    const today = new Date(); today.setHours(0,0,0,0);
    const tmrw  = new Date(today.getTime() + 86400000);

    const todayTrips = await Schedule.countDocuments({ driver: driver._id, date: { $gte: today, $lt: tmrw } });
    const completedTrips = await Schedule.countDocuments({ driver: driver._id, date: { $gte: today, $lt: tmrw }, status: 'completed' });

    res.json({ success: true, driver, assignedBus: driver.assignedBus || null, todayTrips, completedTrips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/mobile/driver/profile
router.get('/driver/profile', authorize('driver'), async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id }).populate('assignedBus', 'busNumber model');
    res.json({ success: true, driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/mobile/driver/status
router.patch('/driver/status', authorize('driver'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['on-duty', 'off-duty', 'on-leave'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const driver = await Driver.findOneAndUpdate({ userId: req.user._id }, { status }, { new: true });
    res.json({ success: true, driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/mobile/driver/schedule/today
router.get('/driver/schedule/today', authorize('driver'), async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });

    const today = new Date(); today.setHours(0,0,0,0);
    const tmrw  = new Date(today.getTime() + 86400000);

    const schedules = await Schedule.find({ driver: driver._id, date: { $gte: today, $lt: tmrw } })
      .populate('route', 'route_name start_stage end_stage')
      .populate('bus', 'busNumber')
      .sort({ departureTime: 1 });

    const current = schedules.find(s => s.status === 'in-progress') ||
                    schedules.find(s => s.status === 'scheduled') || null;

    res.json({ success: true, schedules, current });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/mobile/driver/schedule/active
router.get('/driver/schedule/active', authorize('driver'), async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });

    const schedule = await Schedule.findOne({ driver: driver._id, status: 'in-progress' })
      .populate('route', '_id route_name')
      .populate('bus', '_id busNumber');

    res.json({ success: true, schedule: schedule || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/mobile/driver/schedule  — all schedules for logged-in driver
router.get('/driver/schedule', authorize('driver'), async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found.' });

    const today = new Date(); today.setHours(0,0,0,0);
    const tmrw  = new Date(today.getTime() + 86400000);

    const schedules = await Schedule.find({
      driver: driver._id,
      date:   { $gte: today, $lt: tmrw },
    }).populate('route', 'route_name start_stage end_stage')
      .populate('bus',   'busNumber model type')
      .sort({ departureTime: 1 });

    res.json({ success: true, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/mobile/driver/trip/start
router.post('/driver/trip/start', authorize('driver'), async (req, res) => {
  try {
    const { scheduleId } = req.body;
    const schedule = await Schedule.findByIdAndUpdate(scheduleId, { status: 'in-progress' }, { new: true });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });

    const trip = await TripHistory.create({
      driver:    (await Driver.findOne({ userId: req.user._id }))._id,
      bus:       schedule.bus,
      route:     schedule.route,
      schedule:  schedule._id,
      startTime: new Date(),
      totalStops:0,
    });

    res.status(201).json({ success: true, trip, schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/mobile/driver/trip/end
router.post('/driver/trip/end', authorize('driver'), async (req, res) => {
  try {
    const { tripId, stopsCompleted, distanceCovered, avgSpeed, incidents } = req.body;
    const trip = await TripHistory.findByIdAndUpdate(tripId, {
      endTime: new Date(),
      status:  'completed',
      stopsCompleted: stopsCompleted || 0,
      distanceCovered: distanceCovered || 0,
      avgSpeed:  avgSpeed || 0,
      incidents: incidents || [],
    }, { new: true });

    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    await Schedule.findByIdAndUpdate(trip.schedule, { status: 'completed' });
    res.json({ success: true, trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── SHARED FAVOURITES (used by mobile app) ────────────────────────────────

// GET /api/v1/mobile/favourites
router.get('/favourites', async (req, res) => {
  try {
    const favs = await Favourite.find({ user: req.user._id }).populate('refId').sort({ createdAt: -1 });
    res.json({ success: true, data: favs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/mobile/favourites
router.post('/favourites', async (req, res) => {
  try {
    const { refId, refModel } = req.body;
    if (!refId || !refModel) return res.status(400).json({ success: false, message: 'refId and refModel required' });
    const existing = await Favourite.findOne({ user: req.user._id, refId });
    if (existing) return res.json({ success: true, data: existing, message: 'Already in favourites' });
    const fav = await Favourite.create({ user: req.user._id, refId, refModel });
    res.status(201).json({ success: true, data: fav });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/mobile/favourites/:refId
router.delete('/favourites/:refId', async (req, res) => {
  try {
    await Favourite.findOneAndDelete({ user: req.user._id, refId: req.params.refId });
    res.json({ success: true, message: 'Removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PASSENGER ROUTES ──────────────────────────────────────────────────────

// GET /api/v1/mobile/passenger/stats
router.get('/passenger/stats', async (req, res) => {
  try {
    const favouritesCount = await Favourite.countDocuments({ user: req.user._id });
    res.json({ success: true, favouritesCount, tripsCount: 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/mobile/passenger/favourites
router.get('/passenger/favourites', async (req, res) => {
  try {
    const favs = await Favourite.find({ user: req.user._id });
    res.json({ success: true, favourites: favs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/mobile/passenger/favourites
router.post('/passenger/favourites', async (req, res) => {
  try {
    const { type, refId, label } = req.body;
    const refModel = type === 'route' ? 'Route' : 'Stage';
    const fav = await Favourite.create({ user: req.user._id, type, refId, refModel, label });
    res.status(201).json({ success: true, favourite: fav });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/mobile/passenger/favourites/:id
router.delete('/passenger/favourites/:id', async (req, res) => {
  try {
    await Favourite.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── TRIP RATING ───────────────────────────────────────────────────────────

// POST /api/v1/mobile/trips/:tripId/rating
router.post('/trips/:tripId/rating', async (req, res) => {
  try {
    const { overallRating, driverRating, comfortRating, tags, comment } = req.body;

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ success: false, message: 'overallRating (1-5) is required.' });
    }

    const trip = await TripHistory.findByIdAndUpdate(
      req.params.tripId,
      {
        $set: {
          rating: {
            overall:  overallRating,
            driver:   driverRating  || null,
            comfort:  comfortRating || null,
            tags:     tags          || [],
            comment:  comment       || '',
            ratedBy:  req.user._id,
            ratedAt:  new Date(),
          },
        },
      },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    // Update driver's average rating
    if (trip.driver && driverRating) {
      const Driver2 = require('../models/Driver');
      const allRatings = await TripHistory.find(
        { driver: trip.driver, 'rating.driver': { $exists: true, $ne: null } },
        { 'rating.driver': 1 }
      );
      const avg = allRatings.reduce((s, t) => s + (t.rating?.driver || 0), 0) / (allRatings.length || 1);
      await Driver2.findByIdAndUpdate(trip.driver, { rating: Math.round(avg * 10) / 10 });
    }

    res.json({ success: true, trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/mobile/trips/:tripId — get trip detail for rating screen
router.get('/trips/:tripId', async (req, res) => {
  try {
    const trip = await TripHistory.findById(req.params.tripId)
      .populate('route', 'route_name')
      .populate('bus',   'busNumber')
      .populate('driver');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    res.json({ success: true, trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── SHARED — PUSH TOKEN ───────────────────────────────────────────────────

// POST /api/v1/mobile/push-token
router.post('/push-token', async (req, res) => {
  try {
    const { expoPushToken, platform } = req.body;
    const token = await PushToken.findOneAndUpdate(
      { expoPushToken },
      { user: req.user._id, expoPushToken, platform, isActive: true },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
