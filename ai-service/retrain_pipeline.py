"""
retrain_pipeline.py — Automated model retraining pipeline.
Can be triggered via POST /admin/retrain or run as a cron job.
"""

import logging
import os
import shutil
import time
from datetime import datetime, timedelta
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

MODEL_DIR = os.getenv("MODEL_DIR", "models/saved")
BACKUP_DIR = os.path.join(MODEL_DIR, "backups")


def _backup_models():
    """Backup current models before retraining."""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, timestamp)
    os.makedirs(backup_path, exist_ok=True)

    model_files = [
        "demand_lstm", "demand_scaler.pkl",
        "delay_regressor.pkl", "delay_classifier.pkl", "delay_scaler.pkl",
        "anomaly_detector.pkl", "anomaly_scaler.pkl",
        "eta_regressor.pkl", "eta_scaler.pkl",
    ]
    backed = []
    for f in model_files:
        src = os.path.join(MODEL_DIR, f)
        if os.path.exists(src):
            dst = os.path.join(backup_path, f)
            if os.path.isdir(src):
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)
            backed.append(f)

    logger.info(f"Backed up {len(backed)} model files to {backup_path}")
    return backup_path


def _retrain_xgboost(data_path: Optional[str] = None) -> dict:
    """Retrain XGBoost delay models on fresh data."""
    import joblib
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.preprocessing import StandardScaler
    import pandas as pd

    logger.info("Retraining XGBoost delay models…")
    start = time.time()

    if data_path and os.path.exists(data_path):
        df = pd.read_csv(data_path)
        feature_cols = [
            'hour', 'day_of_week', 'is_weekend', 'is_holiday',
            'weather', 'avg_temp_c', 'passenger_load_pct',
            'scheduled_duration_min', 'distance_km', 'total_stops',
        ]
        X = df[feature_cols].values
        y = df['delay_minutes'].values
    else:
        # Fallback: synthetic data
        np.random.seed(int(time.time()) % 1000)
        n = 3000
        X = np.column_stack([
            np.random.randint(0, 24, n),
            np.random.randint(0, 7, n),
            np.random.randint(0, 2, n),
            np.random.randint(0, 2, n),
            np.random.randint(0, 4, n),
            np.random.uniform(15, 40, n),
            np.random.uniform(20, 100, n),
            np.random.uniform(30, 90, n),
            np.random.uniform(5, 30, n),
            np.random.randint(5, 40, n),
        ])
        y = (X[:, 4] * 3 + X[:, 6] / 20 + np.random.exponential(5, n)).clip(0, 60)

    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)

    from xgboost import XGBRegressor, XGBClassifier
    reg = XGBRegressor(n_estimators=400, max_depth=5, learning_rate=0.05, random_state=42, n_jobs=-1)
    reg.fit(X_s, y)

    clf = XGBClassifier(n_estimators=300, max_depth=4, learning_rate=0.05,
                        use_label_encoder=False, eval_metric='logloss', random_state=42, n_jobs=-1)
    clf.fit(X_s, (y > 5).astype(int))

    # Atomic save
    tmp_reg    = os.path.join(MODEL_DIR, "_tmp_delay_regressor.pkl")
    tmp_clf    = os.path.join(MODEL_DIR, "_tmp_delay_classifier.pkl")
    tmp_scaler = os.path.join(MODEL_DIR, "_tmp_delay_scaler.pkl")
    joblib.dump(reg,    tmp_reg)
    joblib.dump(clf,    tmp_clf)
    joblib.dump(scaler, tmp_scaler)
    os.replace(tmp_reg,    os.path.join(MODEL_DIR, "delay_regressor.pkl"))
    os.replace(tmp_clf,    os.path.join(MODEL_DIR, "delay_classifier.pkl"))
    os.replace(tmp_scaler, os.path.join(MODEL_DIR, "delay_scaler.pkl"))

    elapsed = time.time() - start
    logger.info(f"XGBoost retrained in {elapsed:.1f}s")
    return {"model": "xgboost_delay", "elapsed_sec": round(elapsed, 1), "samples": len(X)}


def _retrain_anomaly(data_path: Optional[str] = None) -> dict:
    """Retrain Isolation Forest anomaly detector."""
    import joblib
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler

    logger.info("Retraining anomaly detector…")
    start = time.time()

    np.random.seed(int(time.time()) % 1000)
    n = 4000
    speeds = np.random.uniform(5, 85, n)
    delays = np.random.exponential(4, n).clip(0, 30)
    loads  = np.random.uniform(10, 110, n)
    X = np.column_stack([speeds, delays, loads])

    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)
    model = IsolationForest(n_estimators=200, contamination=0.05, random_state=42, n_jobs=-1)
    model.fit(X_s)

    tmp_model  = os.path.join(MODEL_DIR, "_tmp_anomaly_detector.pkl")
    tmp_scaler = os.path.join(MODEL_DIR, "_tmp_anomaly_scaler.pkl")
    joblib.dump(model,  tmp_model)
    joblib.dump(scaler, tmp_scaler)
    os.replace(tmp_model,  os.path.join(MODEL_DIR, "anomaly_detector.pkl"))
    os.replace(tmp_scaler, os.path.join(MODEL_DIR, "anomaly_scaler.pkl"))

    elapsed = time.time() - start
    return {"model": "isolation_forest_anomaly", "elapsed_sec": round(elapsed, 1), "samples": n}


def run_retrain_pipeline(
    retrain_xgboost:  bool = True,
    retrain_lstm:     bool = False,     # LSTM is slow; only on explicit request
    retrain_anomaly:  bool = True,
    data_dir:         Optional[str] = None,
) -> dict:
    """
    Main entry point. Returns a report dict with results for each model.
    """
    logger.info("=== Model Retraining Pipeline Started ===")
    start_total = time.time()
    results     = []
    errors      = []

    # 1. Backup existing models
    backup_path = _backup_models()

    # 2. Retrain XGBoost
    if retrain_xgboost:
        try:
            delay_data = os.path.join(data_dir, "delay_dataset.csv") if data_dir else None
            r = _retrain_xgboost(delay_data)
            results.append(r)
        except Exception as e:
            logger.error(f"XGBoost retrain failed: {e}")
            errors.append({"model": "xgboost", "error": str(e)})

    # 3. Retrain Anomaly Detector
    if retrain_anomaly:
        try:
            r = _retrain_anomaly()
            results.append(r)
        except Exception as e:
            logger.error(f"Anomaly retrain failed: {e}")
            errors.append({"model": "anomaly", "error": str(e)})

    # 4. Reload models into memory
    try:
        import model_loader
        model_loader.load_models()

        from anomaly_detector import load_anomaly_model
        load_anomaly_model()

        from eta_predictor import load_eta_model
        load_eta_model()
        results.append({"model": "reload", "status": "success"})
    except Exception as e:
        logger.error(f"Model reload failed: {e}")
        errors.append({"model": "reload", "error": str(e)})

    total_elapsed = round(time.time() - start_total, 1)
    logger.info(f"=== Pipeline done in {total_elapsed}s ===")

    return {
        "status":          "completed" if not errors else "partial",
        "started_at":      datetime.now().isoformat(),
        "total_elapsed_sec": total_elapsed,
        "models_retrained": results,
        "errors":          errors,
        "backup_path":     backup_path,
    }
