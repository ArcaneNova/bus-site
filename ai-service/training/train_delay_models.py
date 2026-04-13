"""
Train Delay Prediction Models (Regression + Classification)

Models:
- Regression: XGBoost, LightGBM, CatBoost, SVR, MLP, Ensemble
- Classification: Predict is_delayed (>5 min threshold)
"""

import os
import sys
import json
import warnings
import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
from datetime import datetime
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.svm import SVR
import xgboost as xgb
import lightgbm as lgb
try:
    from catboost import CatBoostRegressor
except:
    pass

warnings.filterwarnings('ignore')
tf.get_logger().setLevel('ERROR')

# ════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

DATA_PATH = None
for path in [
    os.path.join(PROJECT_ROOT, "data", "delay_dataset.csv"),
    "/content/bus-site/ai-service/data/delay_dataset.csv",
]:
    if os.path.exists(path):
        DATA_PATH = os.path.abspath(path)
        break

SAVE_DIR = os.path.join(PROJECT_ROOT, "models", "saved")
os.makedirs(SAVE_DIR, exist_ok=True)

print(f"\n╔{'═'*75}╗")
print(f"║{'DELAY PREDICTION - 6 REGRESSION MODELS':^75}║")
print(f"╚{'═'*75}╝\n")

if DATA_PATH is None or not os.path.exists(DATA_PATH):
    print(f"❌ Dataset not found. Run: python enhanced_generate_dataset.py")
    sys.exit(1)

# LOAD & PREPARE
print(f"🔄 Loading delay dataset...")
df = pd.read_csv(DATA_PATH)
print(f"   ✅ Loaded {len(df):,} records")

feature_cols = [col for col in df.columns if col not in ['delay_minutes', 'is_delayed']]
X = df[feature_cols].copy()
y_reg = df['delay_minutes'].values

print(f"   Initial shape: {X.shape}")
print(f"   Initial columns: {X.columns.tolist()}")
print(f"   Dtypes:\n{X.dtypes}")

# Categorical encoding
cat_cols = X.select_dtypes(include=['object']).columns.tolist()
print(f"   🔍 Detected categorical columns: {cat_cols}")

if cat_cols:
    print(f"   🔄 Encoding {len(cat_cols)} categorical columns...")
    for col in cat_cols:
        print(f"      • {col}: {X[col].unique()[:5].tolist()}")
    
    X = pd.get_dummies(X, columns=cat_cols, drop_first=True, dtype=float)
    print(f"   ✅ After encoding: {X.shape[1]} features")

# Convert to numpy and ensure float type
print(f"   🔄 Converting to numpy (float32)...")
X = X.values.astype(np.float32)
print(f"   ✅ Array dtype: {X.dtype}, shape: {X.shape}")

# Handle any NaN values
X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

print(f"   🔄 Scaling features with StandardScaler...")
scaler = StandardScaler()
X = scaler.fit_transform(X)
print(f"   ✅ Scaling complete")

X_train, X_test, y_train, y_test = train_test_split(
    X, y_reg, test_size=0.2, random_state=42, shuffle=False
)

results = {"task": "delay_prediction", "timestamp": datetime.now().isoformat(), "models": {}}

print(f"   Train: {len(X_train):,}  Test: {len(X_test):,}\n")

# ════════════════════════════════════════════════════════════════════════════

print(f"🔨 [1/6] XGBoost Regressor")
xgb_model = xgb.XGBRegressor(n_estimators=300, max_depth=6, learning_rate=0.05, random_state=42, verbosity=0)
xgb_model.fit(X_train, y_train, eval_set=[(X_test, y_test)])
y_pred = xgb_model.predict(X_test)
mae = np.mean(np.abs(y_pred - y_test))
rmse = np.sqrt(np.mean((y_pred - y_test) ** 2))
r2 = 1 - np.sum((y_test - y_pred)**2) / np.sum((y_test - np.mean(y_test))**2)
joblib.dump(xgb_model, os.path.join(SAVE_DIR, "delay_xgboost_multimodel.pkl"))
results["models"]["xgboost"] = {"mae": float(mae), "rmse": float(rmse), "r2": float(r2)}
print(f"   ✅ MAE={mae:.2f} min, R²={r2:.4f}\n")

print(f"🔨 [2/6] LightGBM Regressor")
lgb_model = lgb.LGBMRegressor(n_estimators=300, max_depth=6, learning_rate=0.05, random_state=42, verbose=-1)
lgb_model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose_eval=False)
y_pred = lgb_model.predict(X_test)
mae = np.mean(np.abs(y_pred - y_test))
rmse = np.sqrt(np.mean((y_pred - y_test) ** 2))
r2 = 1 - np.sum((y_test - y_pred)**2) / np.sum((y_test - np.mean(y_test))**2)
joblib.dump(lgb_model, os.path.join(SAVE_DIR, "delay_lightgbm_multimodel.pkl"))
results["models"]["lightgbm"] = {"mae": float(mae), "rmse": float(rmse), "r2": float(r2)}
print(f"   ✅ MAE={mae:.2f} min, R²={r2:.4f}\n")

try:
    print(f"🔨 [3/6] CatBoost Regressor")
    from catboost import CatBoostRegressor
    cat_model = CatBoostRegressor(iterations=300, depth=6, learning_rate=0.05, random_state=42, verbose=False)
    cat_model.fit(X_train, y_train)
    y_pred = cat_model.predict(X_test)
    mae = np.mean(np.abs(y_pred - y_test))
    rmse = np.sqrt(np.mean((y_pred - y_test) ** 2))
    r2 = 1 - np.sum((y_test - y_pred)**2) / np.sum((y_test - np.mean(y_test))**2)
    joblib.dump(cat_model, os.path.join(SAVE_DIR, "delay_catboost_multimodel.pkl"))
    results["models"]["catboost"] = {"mae": float(mae), "rmse": float(rmse), "r2": float(r2)}
    print(f"   ✅ MAE={mae:.2f} min, R²={r2:.4f}\n")
except:
    print(f"   ⚠️  CatBoost not available - skipping\n")

print(f"🔨 [4/6] SVR (Support Vector Regressor)")
svr_model = SVR(kernel='rbf', C=100, gamma='scale')
svr_model.fit(X_train, y_train)
y_pred = svr_model.predict(X_test)
mae = np.mean(np.abs(y_pred - y_test))
rmse = np.sqrt(np.mean((y_pred - y_test) ** 2))
r2 = 1 - np.sum((y_test - y_pred)**2) / np.sum((y_test - np.mean(y_test))**2)
joblib.dump(svr_model, os.path.join(SAVE_DIR, "delay_svr_multimodel.pkl"))
results["models"]["svr"] = {"mae": float(mae), "rmse": float(rmse), "r2": float(r2)}
print(f"   ✅ MAE={mae:.2f} min, R²={r2:.4f}\n")

print(f"🔨 [5/6] MLP Neural Network")
from tensorflow.keras import Sequential, layers
mlp = Sequential([
    layers.Dense(128, activation='relu', input_shape=(X_train.shape[1],)),
    layers.BatchNormalization(),
    layers.Dropout(0.2),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.2),
    layers.Dense(32, activation='relu'),
    layers.Dense(1)
])
mlp.compile(optimizer='adam', loss='mse', metrics=['mae'])
mlp.fit(X_train, y_train, epochs=30, batch_size=64, validation_split=0.1, verbose=1, workers=0)
y_pred = mlp.predict(X_test, verbose=0).flatten()
mae = np.mean(np.abs(y_pred - y_test))
rmse = np.sqrt(np.mean((y_pred - y_test) ** 2))
r2 = 1 - np.sum((y_test - y_pred)**2) / np.sum((y_test - np.mean(y_test))**2)
mlp.save(os.path.join(SAVE_DIR, "delay_mlp_multimodel.keras"))
results["models"]["mlp"] = {"mae": float(mae), "rmse": float(rmse), "r2": float(r2)}
print(f"   ✅ MAE={mae:.2f} min, R²={r2:.4f}\n")

print(f"🔨 [6/6] Ensemble Voting")
from sklearn.ensemble import VotingRegressor
ensemble = VotingRegressor([
    ('xgb', xgb.XGBRegressor(n_estimators=300, max_depth=6, learning_rate=0.05, random_state=42, verbosity=0)),
    ('lgb', lgb.LGBMRegressor(n_estimators=300, max_depth=6, learning_rate=0.05, random_state=42, verbose=-1)),
])
ensemble.fit(X_train, y_train)
y_pred = ensemble.predict(X_test)
mae = np.mean(np.abs(y_pred - y_test))
rmse = np.sqrt(np.mean((y_pred - y_test) ** 2))
r2 = 1 - np.sum((y_test - y_pred)**2) / np.sum((y_test - np.mean(y_test))**2)
joblib.dump(ensemble, os.path.join(SAVE_DIR, "delay_ensemble_multimodel.pkl"))
results["models"]["ensemble"] = {"mae": float(mae), "rmse": float(rmse), "r2": float(r2)}
print(f"   ✅ MAE={mae:.2f} min, R²={r2:.4f}\n")

# SAVE
joblib.dump(scaler, os.path.join(SAVE_DIR, "delay_scaler_multimodel.pkl"))
with open(os.path.join(SAVE_DIR, "delay_comparison_report.json"), 'w') as f:
    json.dump(results, f, indent=2)

print(f"╔{'═'*75}╗")
print(f"║{'✅ DELAY TRAINING COMPLETE':^75}║")
print(f"╚{'═'*75}╝\n")
print(f"📊 Results saved to: {SAVE_DIR}\n")
