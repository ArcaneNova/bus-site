/**
 * demandPrediction.job.js
 * Hourly demand prediction via Python AI service.
 * Called by scheduler.service.js cron every hour.
 */
const axios  = require('axios');
const PassengerDemand = require('../models/PassengerDemand');
const Route           = require('../models/Route');

const AI_URL = process.env.AI_SERVICE_URL || process.env.PYTHON_AI_URL || 'http://localhost:8000';

/**
 * runDemandPrediction
 * Fetches the last 7 days of demand data for each active route,
 * sends it to the AI service, and stores predictions back in MongoDB.
 */
async function runDemandPrediction() {
  try {
    const routes = await Route.find({ isActive: true }).select('_id route_name');

    const now  = new Date();
    const hour = now.getHours();

    for (const route of routes) {
      // Build historical load data for the last 7 days (same hour)
      const history = await PassengerDemand.find({
        route: route._id,
        hour,
      })
        .sort({ forDate: -1 })
        .limit(7)
        .select('actualCount predictedCount forDate');

      const historicalLoad = history.map((h) => h.actualCount ?? h.predictedCount ?? 0);
      if (historicalLoad.length === 0) continue;

      // Call Python AI service
      let predicted = null;
      try {
        const { data } = await axios.post(`${AI_URL}/predict/demand`, {
          route_id:        route._id.toString(),
          hour,
          day_of_week:     now.getDay(),
          historical_load: historicalLoad,
          weather_score:   0.8,
        }, { timeout: 10000 });

        predicted = data.predicted_demand;
      } catch (aiErr) {
        console.warn(`[DemandJob] AI call failed for route ${route._id}: ${aiErr.message}`);
        continue;
      }

      // Upsert the prediction for today
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      await PassengerDemand.findOneAndUpdate(
        { route: route._id, forDate: today, hour },
        { $set: { predictedCount: Math.round(predicted), predictedAt: now } },
        { upsert: true, new: true }
      );
    }

    console.log(`[DemandJob] Predictions updated for ${routes.length} routes at hour ${hour}`);
  } catch (err) {
    console.error('[DemandJob] Fatal error:', err.message);
  }
}

module.exports = { runDemandPrediction };
