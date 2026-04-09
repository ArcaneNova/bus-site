"""
predictors.py
Core prediction logic — uses loaded ML models or falls back to
rule-based heuristics when models are not trained yet.
"""

import math
import numpy as np
from model_loader import (
    demand_model, demand_scaler,
    delay_model,  delay_scaler, delay_clf,
)


# ── helpers ────────────────────────────────────────────────────────────────

WEATHER_FACTOR = {"clear": 1.0, "rain": 0.85, "fog": 0.90, "heatwave": 0.80}
HOUR_BASE_DEMAND = {
    6: 40, 7: 80, 8: 120, 9: 100, 10: 60, 11: 50,
    12: 70, 13: 65, 14: 55, 15: 60, 16: 75, 17: 110,
    18: 130, 19: 100, 20: 70, 21: 50, 22: 35, 23: 20,
}

def _crowd_level(count: int) -> str:
    if count < 30:  return "low"
    if count < 60:  return "medium"
    if count < 90:  return "high"
    return "critical"


# ── Demand Prediction ──────────────────────────────────────────────────────

def predict_demand(route_id: str, date: str, hour: int,
                   is_weekend: bool, is_holiday: bool,
                   weather: str, avg_temp_c: float,
                   special_event: bool) -> dict:

    # Try ML model first
    if demand_model is not None and demand_scaler is not None:
        try:
            features = np.array([[
                hour, int(is_weekend), int(is_holiday),
                WEATHER_FACTOR.get(weather, 1.0), avg_temp_c, int(special_event),
            ]], dtype=np.float32)
            features_scaled = demand_scaler.transform(features)
            # Reshape for LSTM: (batch, timesteps, features)
            lstm_input = features_scaled.reshape(1, 1, features_scaled.shape[1])
            pred = float(demand_model(lstm_input, training=False).numpy()[0][0])
            pred = max(0, int(round(pred)))
            return {
                "route_id": route_id, "date": date, "hour": hour,
                "predicted_count": pred,
                "crowd_level": _crowd_level(pred),
                "confidence": 0.87,
            }
        except Exception:
            pass  # fall through to rule-based

    # Rule-based fallback
    base   = HOUR_BASE_DEMAND.get(hour, 30)
    factor = WEATHER_FACTOR.get(weather, 1.0)
    if is_weekend: factor *= 0.75
    if is_holiday: factor *= 0.60
    if special_event: factor *= 1.40
    pred = max(0, int(round(base * factor)))

    return {
        "route_id": route_id, "date": date, "hour": hour,
        "predicted_count": pred,
        "crowd_level": _crowd_level(pred),
        "confidence": 0.65,
    }


# ── Delay Prediction ───────────────────────────────────────────────────────

def predict_delay(route_id: str, hour: int, day_of_week: int,
                  is_weekend: bool, is_holiday: bool,
                  weather: str, avg_temp_c: float,
                  passenger_load_pct: float, scheduled_duration_min: float,
                  distance_km: float, total_stops: int) -> dict:

    features = np.array([[
        hour, day_of_week, int(is_weekend), int(is_holiday),
        WEATHER_FACTOR.get(weather, 1.0), avg_temp_c,
        passenger_load_pct, scheduled_duration_min, distance_km, total_stops,
    ]], dtype=np.float32)

    # Try ML models
    if delay_model is not None:
        try:
            X = delay_scaler.transform(features) if delay_scaler else features
            delay_min   = float(delay_model.predict(X)[0])
            delay_min   = max(0.0, round(delay_min, 1))
            delay_prob  = float(delay_clf.predict_proba(X)[0][1]) if delay_clf else (0.9 if delay_min > 5 else 0.1)
            return {
                "route_id": route_id,
                "predicted_delay_minutes": delay_min,
                "is_delayed": delay_min > 5,
                "delay_probability": round(delay_prob, 3),
            }
        except Exception:
            pass

    # Rule-based fallback
    delay = 0.0
    if hour in (8, 9, 17, 18, 19): delay += 8
    if weather == "rain":           delay += 5
    if weather == "fog":            delay += 4
    if passenger_load_pct > 80:     delay += 3
    if not is_weekend:              delay += 2

    delay = max(0.0, round(delay + (distance_km * 0.1), 1))

    return {
        "route_id": route_id,
        "predicted_delay_minutes": delay,
        "is_delayed": delay > 5,
        "delay_probability": round(min(delay / 15.0, 1.0), 3),
    }


# ── Schedule Generation ────────────────────────────────────────────────────

def generate_schedule(route_id: str, date: str, total_buses: int) -> dict:
    """
    Generate optimised schedule slots for a route on a given date.
    Uses demand predictions to determine frequency.
    """
    slots = []
    for hour in range(5, 24):
        pred = predict_demand(route_id, date, hour, False, False, "clear", 25.0, False)
        count = pred["predicted_count"]

        if count < 20:
            freq, buses = 30, max(1, total_buses // 4)
            trip_type   = "regular"
        elif count < 60:
            freq, buses = 20, max(2, total_buses // 3)
            trip_type   = "regular"
        elif count < 100:
            freq, buses = 12, max(3, total_buses // 2)
            trip_type   = "peak"
        else:
            freq, buses = 8, total_buses
            trip_type   = "peak"

        minutes_in_hour = range(0, 60, freq)
        for m in minutes_in_hour:
            slots.append({
                "hour":               hour,
                "minute":             m,
                "frequency_minutes":  freq,
                "bus_count":          buses,
                "type":               trip_type,
            })

    return {
        "route_id":    route_id,
        "date":        date,
        "slots":       slots,
        "total_trips": len(slots),
        "ai_generated":True,
    }
