"""
model_loader.py
Loads trained ML models once at startup and exposes them as singletons.
Falls back to rule-based predictions if model files are not found.
"""

import os
import logging
import joblib
import numpy as np

logger = logging.getLogger(__name__)

MODEL_DIR = os.getenv("MODEL_DIR", "models/saved")

# Globals
demand_model   = None   # Keras LSTM (TFSMLayer / SavedModel)
demand_scaler  = None   # sklearn StandardScaler
delay_model    = None   # XGBoost Booster / sklearn wrapper
delay_scaler   = None
delay_clf      = None   # XGBoost classifier (is_delayed)


def load_models():
    global demand_model, demand_scaler, delay_model, delay_scaler, delay_clf

    # ── Demand LSTM ────────────────────────────────────────────────────────
    demand_path  = os.path.join(MODEL_DIR, "demand_lstm")
    scaler_path  = os.path.join(MODEL_DIR, "demand_scaler.pkl")

    if os.path.exists(demand_path):
        try:
            import tensorflow as tf
            demand_model  = tf.saved_model.load(demand_path)
            logger.info("✅  LSTM demand model loaded")
        except Exception as e:
            logger.warning(f"⚠️  LSTM load failed: {e} — using rule-based fallback")
    else:
        logger.warning("⚠️  LSTM model not found — using rule-based fallback")

    if os.path.exists(scaler_path):
        demand_scaler = joblib.load(scaler_path)
        logger.info("✅  Demand scaler loaded")

    # ── Delay XGBoost ──────────────────────────────────────────────────────
    delay_reg_path = os.path.join(MODEL_DIR, "delay_regressor.pkl")
    delay_clf_path = os.path.join(MODEL_DIR, "delay_classifier.pkl")
    delay_scl_path = os.path.join(MODEL_DIR, "delay_scaler.pkl")

    if os.path.exists(delay_reg_path):
        try:
            delay_model = joblib.load(delay_reg_path)
            logger.info("✅  XGBoost delay regressor loaded")
        except Exception as e:
            logger.warning(f"⚠️  XGBoost delay load failed: {e} — using rule-based fallback")
    else:
        logger.warning("⚠️  XGBoost regressor not found — using rule-based fallback")

    if os.path.exists(delay_clf_path):
        try:
            delay_clf = joblib.load(delay_clf_path)
        except Exception as e:
            logger.warning(f"⚠️  XGBoost classifier load failed: {e}")

    if os.path.exists(delay_scl_path):
        try:
            delay_scaler = joblib.load(delay_scl_path)
        except Exception as e:
            logger.warning(f"⚠️  Delay scaler load failed: {e}")
