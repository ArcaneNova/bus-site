"""
train_demand_models.py
Trains multiple models for passenger demand prediction and compares them.

Models trained:
1. LSTM (TensorFlow/Keras) - Temporal neural network
2. GRU (TensorFlow/Keras) - Faster RNN variant
3. Transformer - Attention-based architecture
4. XGBoost - Gradient boosted trees
5. LightGBM - Faster gradient boosting
6. Random Forest - Ensemble baseline

Output: Individual model files + comparison metrics JSON

Usage: python training/train_demand_models.py
"""

import os
import json
import logging
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error
from sklearn.ensemble import RandomForestRegressor
import xgboost as xgb

import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import LSTM, GRU, Dense, Dropout, BatchNormalization, Input, MultiHeadAttention, GlobalAveragePooling1D
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.optimizers import Adam

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────
# Configuration

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/demand_dataset.csv")
SAVE_DIR = os.path.join(os.path.dirname(__file__), "../models/saved")
os.makedirs(SAVE_DIR, exist_ok=True)

FEATURES = [
    "hour", "day_of_week", "is_weekend", "is_holiday", "is_major_event",
    "weather_encoded", "avg_temp_c", "special_event", "month", "quarter",
    "distance_km", "total_stops",
]
WEATHER_MAP = {"clear": 0, "light_rain": 1, "heavy_rain": 2, "fog": 3, "heatwave": 4, "extreme": 5}

TARGET = "passenger_count"
TEST_SIZE = 0.20
SEED = 42
tf.random.set_seed(SEED)
np.random.seed(SEED)

# ─────────────────────────────────────────────────────────────────────────
# Data Loading & Preprocessing

logger.info("🔄 Loading demand dataset...")
df = pd.read_csv(DATA_PATH)
logger.info(f"   Loaded {len(df):,} records")

# Encode weather
df["weather_encoded"] = df["weather"].map(WEATHER_MAP).fillna(0).astype(int)

X = df[FEATURES].values.astype(np.float32)
y = df[TARGET].values.astype(np.float32)

logger.info(f"   Features: {len(FEATURES)}, Target range: {y.min():.0f}-{y.max():.0f}")

# Train/val/test split (temporal - no shuffle)
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=TEST_SIZE, shuffle=False, random_state=SEED
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, shuffle=False, random_state=SEED
)

logger.info(f"   Train: {len(X_train):,}  Val: {len(X_val):,}  Test: {len(X_test):,}")

# Scale features
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_val_s = scaler.transform(X_val)
X_test_s = scaler.transform(X_test)

# ─────────────────────────────────────────────────────────────────────────
# Model Definitions & Training

def evaluate_model(y_true, y_pred, model_name):
    """Calculate metrics for a model."""
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mape = mean_absolute_percentage_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    
    logger.info(f"   {model_name}: MAE={mae:.2f}, RMSE={rmse:.2f}, MAPE={mape:.2%}, R²={r2:.4f}")
    
    return {"mae": mae, "rmse": rmse, "mape": mape, "r2": r2}

# ──────────────────────────────────────────────────────────────────
# 1. LSTM Model
# ──────────────────────────────────────────────────────────────────

logger.info("\n🔨 Building LSTM model...")
X_train_lstm = X_train_s.reshape(-1, 1, len(FEATURES))
X_val_lstm = X_val_s.reshape(-1, 1, len(FEATURES))
X_test_lstm = X_test_s.reshape(-1, 1, len(FEATURES))

lstm_model = Sequential([
    LSTM(128, input_shape=(1, len(FEATURES)), return_sequences=True),
    Dropout(0.2),
    BatchNormalization(),
    LSTM(64, return_sequences=False),
    Dropout(0.2),
    BatchNormalization(),
    Dense(32, activation="relu"),
    Dense(16, activation="relu"),
    Dense(1, activation="relu"),
])

lstm_model.compile(optimizer=Adam(learning_rate=0.001), loss="mse", metrics=["mae"])

early_stop = EarlyStopping(monitor="val_loss", patience=20, restore_best_weights=True)
reduce_lr = ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=10, min_lr=1e-6)

logger.info("   Training LSTM...")
lstm_model.fit(
    X_train_lstm, y_train,
    validation_data=(X_val_lstm, y_val),
    epochs=150,
    batch_size=256,
    callbacks=[early_stop, reduce_lr],
    verbose=0,
)

y_pred_lstm = lstm_model(X_test_lstm, training=False).numpy().flatten()
metrics_lstm = evaluate_model(y_test, y_pred_lstm, "LSTM")
lstm_model.save(os.path.join(SAVE_DIR, "demand_lstm_multimodel"))
logger.info("   ✅ Saved to demand_lstm_multimodel/")

# ──────────────────────────────────────────────────────────────────
# 2. GRU Model
# ──────────────────────────────────────────────────────────────────

logger.info("\n🔨 Building GRU model...")
gru_model = Sequential([
    GRU(128, input_shape=(1, len(FEATURES)), return_sequences=True),
    Dropout(0.2),
    BatchNormalization(),
    GRU(64, return_sequences=False),
    Dropout(0.2),
    BatchNormalization(),
    Dense(32, activation="relu"),
    Dense(16, activation="relu"),
    Dense(1, activation="relu"),
])

gru_model.compile(optimizer=Adam(learning_rate=0.001), loss="mse", metrics=["mae"])

logger.info("   Training GRU...")
gru_model.fit(
    X_train_lstm, y_train,
    validation_data=(X_val_lstm, y_val),
    epochs=150,
    batch_size=256,
    callbacks=[early_stop, reduce_lr],
    verbose=0,
)

y_pred_gru = gru_model(X_test_lstm, training=False).numpy().flatten()
metrics_gru = evaluate_model(y_test, y_pred_gru, "GRU")
gru_model.save(os.path.join(SAVE_DIR, "demand_gru_multimodel"))
logger.info("   ✅ Saved to demand_gru_multimodel/")

# ──────────────────────────────────────────────────────────────────
# 3. Transformer Model
# ──────────────────────────────────────────────────────────────────

logger.info("\n🔨 Building Transformer model...")

inputs = Input(shape=(1, len(FEATURES)))
x = Dense(64, activation="relu")(inputs)
x = MultiHeadAttention(num_heads=4, key_dim=16)(x, x)
x = Dense(64, activation="relu")(x)
x = GlobalAveragePooling1D()(x)
x = Dense(32, activation="relu")(x)
x = Dropout(0.2)(x)
x = Dense(16, activation="relu")(x)
outputs = Dense(1, activation="relu")(x)

transformer_model = Model(inputs=inputs, outputs=outputs)
transformer_model.compile(optimizer=Adam(learning_rate=0.001), loss="mse", metrics=["mae"])

logger.info("   Training Transformer...")
transformer_model.fit(
    X_train_lstm, y_train,
    validation_data=(X_val_lstm, y_val),
    epochs=150,
    batch_size=256,
    callbacks=[early_stop, reduce_lr],
    verbose=0,
)

y_pred_transformer = transformer_model(X_test_lstm, training=False).numpy().flatten()
metrics_transformer = evaluate_model(y_test, y_pred_transformer, "Transformer")
transformer_model.save(os.path.join(SAVE_DIR, "demand_transformer_multimodel"))
logger.info("   ✅ Saved to demand_transformer_multimodel/")

# ──────────────────────────────────────────────────────────────────
# 4. XGBoost Model
# ──────────────────────────────────────────────────────────────────

logger.info("\n🔨 Building XGBoost model...")
xgb_model = xgb.XGBRegressor(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.1,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=SEED,
    n_jobs=-1,
    early_stopping_rounds=30,
    eval_metric="mae",
)

logger.info("   Training XGBoost...")
xgb_model.fit(
    X_train_s, y_train,
    eval_set=[(X_val_s, y_val)],
    verbose=0,
)

y_pred_xgb = xgb_model.predict(X_test_s)
metrics_xgb = evaluate_model(y_test, y_pred_xgb, "XGBoost")
joblib.dump(xgb_model, os.path.join(SAVE_DIR, "demand_xgboost_multimodel.pkl"))
logger.info("   ✅ Saved to demand_xgboost_multimodel.pkl")

# ──────────────────────────────────────────────────────────────────
# 5. LightGBM Model
# ──────────────────────────────────────────────────────────────────

try:
    import lightgbm as lgb
    
    logger.info("\n🔨 Building LightGBM model...")
    lgb_model = lgb.LGBMRegressor(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        num_leaves=31,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=SEED,
        n_jobs=-1,
        verbose=-1,
    )
    
    logger.info("   Training LightGBM...")
    lgb_model.fit(
        X_train_s, y_train,
        eval_set=[(X_val_s, y_val)],
        callbacks=[lgb.early_stopping(30)],
    )
    
    y_pred_lgb = lgb_model.predict(X_test_s)
    metrics_lgb = evaluate_model(y_test, y_pred_lgb, "LightGBM")
    joblib.dump(lgb_model, os.path.join(SAVE_DIR, "demand_lightgbm_multimodel.pkl"))
    logger.info("   ✅ Saved to demand_lightgbm_multimodel.pkl")
    
except ImportError:
    logger.warning("   ⚠️  LightGBM not installed, skipping")
    metrics_lgb = None

# ──────────────────────────────────────────────────────────────────
# 6. Random Forest Model
# ──────────────────────────────────────────────────────────────────

logger.info("\n🔨 Building Random Forest model...")
rf_model = RandomForestRegressor(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features="sqrt",
    random_state=SEED,
    n_jobs=-1,
    verbose=0,
)

logger.info("   Training Random Forest...")
rf_model.fit(X_train_s, y_train)

y_pred_rf = rf_model.predict(X_test_s)
metrics_rf = evaluate_model(y_test, y_pred_rf, "Random Forest")
joblib.dump(rf_model, os.path.join(SAVE_DIR, "demand_rf_multimodel.pkl"))
logger.info("   ✅ Saved to demand_rf_multimodel.pkl")

# ─────────────────────────────────────────────────────────────────────────
# Save Scaler

joblib.dump(scaler, os.path.join(SAVE_DIR, "demand_scaler_multimodel.pkl"))

# ─────────────────────────────────────────────────────────────────────────
# Comparison Report

logger.info("\n" + "="*70)
logger.info("📊 DEMAND PREDICTION - MODEL COMPARISON REPORT")
logger.info("="*70)

comparison = {
    "timestamp": datetime.now().isoformat(),
    "test_set_size": len(y_test),
    "models": {
        "LSTM": metrics_lstm,
        "GRU": metrics_gru,
        "Transformer": metrics_transformer,
        "XGBoost": metrics_xgb,
        "LightGBM": metrics_lgb if metrics_lgb else "Not installed",
        "Random Forest": metrics_rf,
    }
}

# Find best model
valid_models = {k: v for k, v in comparison["models"].items() if isinstance(v, dict)}
best_model = min(valid_models.items(), key=lambda x: x[1]["mae"])

logger.info(f"\n🏆 Best Model (by MAE): {best_model[0]}")
logger.info(f"   MAE: {best_model[1]['mae']:.2f}")
logger.info(f"   RMSE: {best_model[1]['rmse']:.2f}")
logger.info(f"   MAPE: {best_model[1]['mape']:.2%}")
logger.info(f"   R²: {best_model[1]['r2']:.4f}")

# Save comparison
report_path = os.path.join(SAVE_DIR, "demand_comparison_report.json")
with open(report_path, "w") as f:
    json.dump(comparison, f, indent=2)

logger.info(f"\n📄 Full report saved to: {report_path}")
logger.info("\n✨ Demand model training complete!")
