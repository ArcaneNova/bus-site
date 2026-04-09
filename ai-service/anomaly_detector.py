"""
anomaly_detector.py — Isolation Forest based anomaly detection
Detects abnormal bus behaviour from speed + delay patterns.
"""

import logging
import numpy as np
from typing import List, Optional
import joblib
import os

logger = logging.getLogger(__name__)

# Paths
MODEL_DIR      = os.getenv("MODEL_DIR", "models/saved")
ANOMALY_MODEL  = os.path.join(MODEL_DIR, "anomaly_detector.pkl")
ANOMALY_SCALER = os.path.join(MODEL_DIR, "anomaly_scaler.pkl")

# In-memory holders
_anomaly_model  = None
_anomaly_scaler = None


def load_anomaly_model():
    global _anomaly_model, _anomaly_scaler
    try:
        if os.path.exists(ANOMALY_MODEL) and os.path.exists(ANOMALY_SCALER):
            _anomaly_model  = joblib.load(ANOMALY_MODEL)
            _anomaly_scaler = joblib.load(ANOMALY_SCALER)
            logger.info("✅  Anomaly detector loaded from disk")
        else:
            _build_and_save_default_model()
    except Exception as e:
        logger.warning(f"Anomaly model load failed: {e} — building default")
        _build_and_save_default_model()


def _build_and_save_default_model():
    """Train a basic Isolation Forest on synthetic normal bus data."""
    global _anomaly_model, _anomaly_scaler
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler

    # Synthetic training data: speed 20-80 km/h, delay 0-10 min (normal)
    np.random.seed(42)
    n = 2000
    speeds = np.random.uniform(20, 80, n)
    delays = np.random.exponential(3, n).clip(0, 10)
    loads  = np.random.uniform(30, 90, n)
    X = np.column_stack([speeds, delays, loads])

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,     # ~5% anomaly rate
        max_samples='auto',
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_scaled)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model,  ANOMALY_MODEL)
    joblib.dump(scaler, ANOMALY_SCALER)
    _anomaly_model  = model
    _anomaly_scaler = scaler
    logger.info("✅  Default anomaly detector built and saved")


def detect_anomaly(
    speed_kmh:      float,
    delay_minutes:  float,
    passenger_load: float = 60.0,
) -> dict:
    """
    Returns:
        {
            is_anomaly: bool,
            score: float,       # lower = more anomalous (-1 to 0)
            confidence: float,  # 0-1 (how confident the model is)
            reason: str,
        }
    """
    global _anomaly_model, _anomaly_scaler

    if _anomaly_model is None:
        load_anomaly_model()

    features = np.array([[speed_kmh, delay_minutes, passenger_load]])

    try:
        X_scaled = _anomaly_scaler.transform(features)
        raw_score   = _anomaly_model.score_samples(X_scaled)[0]   # more negative = more anomalous
        prediction  = _anomaly_model.predict(X_scaled)[0]          # -1 = anomaly, 1 = normal
        is_anomaly  = int(prediction) == -1

        # Normalise score to 0-1 confidence (0 = certain normal, 1 = certain anomaly)
        confidence  = float(np.clip((-raw_score - 0.1) / 0.4, 0, 1))

        # Build human-readable reason
        reasons = []
        if speed_kmh < 5:
            reasons.append("bus appears stationary")
        elif speed_kmh > 90:
            reasons.append(f"unusually high speed ({speed_kmh:.0f} km/h)")
        if delay_minutes > 20:
            reasons.append(f"severe delay ({delay_minutes:.0f} min)")
        if passenger_load > 120:
            reasons.append("overcrowded")
        reason = "; ".join(reasons) if reasons else ("pattern anomaly detected" if is_anomaly else "within normal parameters")

        return {
            "is_anomaly":  is_anomaly,
            "score":       round(float(raw_score), 4),
            "confidence":  round(confidence, 3),
            "reason":      reason,
        }

    except Exception as e:
        logger.error(f"Anomaly detection error: {e}")
        # Rule-based fallback
        is_anomaly = speed_kmh > 100 or delay_minutes > 30 or speed_kmh < 0
        return {
            "is_anomaly":  is_anomaly,
            "score":       -1.0 if is_anomaly else 0.0,
            "confidence":  0.9 if is_anomaly else 0.1,
            "reason":      "rule-based fallback",
        }
