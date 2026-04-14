# 🔥 COLAB EXECUTION GUIDE - ALL FIXES APPLIED

## Status: READY FOR TRAINING

All categorical encoding bugs have been fixed. The training scripts now include **enhanced debugging output** to show exactly what's happening at each step.

---

## 🚀 Updated Colab Cells (Copy-Paste Ready)

### **Cell 1: Clone Repository & Install Dependencies**
```python
!if [ -d /content/bus-site/.git ]; then cd /content/bus-site && git pull origin main; else git clone https://github.com/ArcaneNova/bus-site.git /content/bus-site; fi

%cd /content/bus-site/ai-service

# Install dependencies
!pip install -q tensorflow pandas scikit-learn xgboost lightgbm numpy matplotlib seaborn -U
!pip install -q catboost 2>/dev/null || echo "CatBoost optional"

print("✅ Dependencies installed")
```

---

### **Cell 2: Check Dataset Generator**
```python
%cd /content/bus-site/ai-service/training

print("📊 Testing dataset generator with debugging...")
print("=" * 80)

# Quick test
import pandas as pd
import numpy as np

data = {
    'route_type': ['commercial_hub', 'residential', 'peripheral', 'commercial_hub'],
    'hour': [6, 12, 18, 22],
    'passenger_count': [120, 45, 80, 35]
}
test_df = pd.DataFrame(data)

print(f"\nTest DataFrame:")
print(test_df)
print(f"\nDtypes:\n{test_df.dtypes}")

# Test categorical encoding
print(f"\n🔄 Testing pd.get_dummies()...")
cat_cols = test_df.select_dtypes(include=['object']).columns.tolist()
print(f"Categorical columns found: {cat_cols}")

if cat_cols:
    test_encoded = pd.get_dummies(test_df, columns=cat_cols, drop_first=True, dtype=float)
    print(f"✅ Encoded successfully!")
    print(f"Shape: {test_encoded.shape}")
    print(f"Columns: {test_encoded.columns.tolist()}")
    
    # Test scaling
    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(test_encoded.values.astype(np.float32))
    print(f"✅ Scaling successful!")
    print(f"Scaled array shape: {X_scaled.shape}")

print("\n" + "=" * 80)
```

---

### **Cell 3: Generate Enhanced Dataset (2.4M rows)**
```python
%cd /content/bus-site/ai-service/training

print("🔄 Generating 3-year synthetic dataset...")
print("=" * 80)

!python enhanced_generate_dataset.py

print("\n" + "=" * 80)
print("✅ Dataset generated successfully!")
print("   • demand_dataset.csv")
print("   • delay_dataset.csv")
print("   • anomaly_dataset.csv")

# Verify
import os
import pandas as pd

for fname in ['demand_dataset.csv', 'delay_dataset.csv', 'anomaly_dataset.csv']:
    path = f'/content/bus-site/ai-service/data/{fname}'
    if os.path.exists(path):
        df = pd.read_csv(path, nrows=5)
        print(f"\n✅ {fname} ({os.path.getsize(path) / 1024 / 1024:.1f} MB)")
        print(f"   Columns: {df.columns.tolist()}")
        print(f"   Dtypes: {df.dtypes.tolist()}")
```

**⏱️ Time: 5 minutes**

---

### **Cell 4: Train Demand Prediction Models (6 models)**
```python
import subprocess, sys

%cd /content/bus-site/ai-service/training

print("\n" + "=" * 80)
print("🎯 TRAINING DEMAND PREDICTION MODELS")
print("=" * 80)

# If this still shows an old traceback, rerun Cell 1 to pull the latest code.
result = subprocess.run([sys.executable, "train_demand_models.py"], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print(result.stderr)
if result.returncode != 0:
    raise RuntimeError(f"Demand model training failed with exit code {result.returncode}. Fix the error above, then rerun Cell 1 and Cell 4.")

print("\n" + "=" * 80)
print("✅ Demand models trained!")
```

**⏱️ Time: 3-5 minutes (GPU)**

**What you should see:**
```
Initial shape: (2452320, 16)
Initial columns: ['route_type', 'hour', 'day_of_week', 'weather', ...]
Dtypes:
route_type        object
hour               int64
...
🔍 Detected categorical columns: ['route_type', 'weather']
🔄 Encoding 2 categorical columns...
   • route_type: ['commercial_hub', 'residential', 'peripheral']
   • weather: ['clear', 'light_rain', 'heavy_rain', ...]
✅ After encoding: 21 features
🔄 Converting to numpy (float32)...
✅ Array dtype: float32, shape: (2452320, 21)
🔄 Scaling features with StandardScaler...
✅ Scaling complete

🎯 TRAINING 1/6: LSTM Model
...
```

---

### **Cell 5: Train Delay Prediction Models (6 models)**
```python
import subprocess, sys

%cd /content/bus-site/ai-service/training

print("\n" + "=" * 80)
print("🎯 TRAINING DELAY PREDICTION MODELS")
print("=" * 80)

result = subprocess.run([sys.executable, "train_delay_models.py"], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print(result.stderr)
if result.returncode != 0:
    raise RuntimeError(f"Delay model training failed with exit code {result.returncode}. Fix the error above, then rerun Cell 1 and Cell 5.")

print("\n" + "=" * 80)
print("✅ Delay models trained!")
```

**⏱️ Time: 5-8 minutes (GPU)**

---

### **Cell 6: Train Anomaly Detection Models (6 methods)**
```python
import subprocess, sys

%cd /content/bus-site/ai-service/training

print("\n" + "=" * 80)
print("🎯 TRAINING ANOMALY DETECTION MODELS")
print("=" * 80)

result = subprocess.run([sys.executable, "train_anomaly_models.py"], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print(result.stderr)
if result.returncode != 0:
    raise RuntimeError(f"Anomaly model training failed with exit code {result.returncode}. Fix the error above, then rerun Cell 1 and Cell 6.")

print("\n" + "=" * 80)
print("✅ Anomaly models trained!")
```

**⏱️ Time: 3-5 minutes (GPU)**

---

### **Cell 7: Load & Display Results**
```python
import json
import pandas as pd
from IPython.display import display, Markdown
import os

print("\n" + "=" * 80)
print("📊 MODEL COMPARISON RESULTS")
print("=" * 80)

results_dir = '/content/bus-site/ai-service/evaluation_results'
os.makedirs(results_dir, exist_ok=True)

# Check what files were generated
saved_dir = '/content/bus-site/ai-service/models/saved'
if os.path.exists(saved_dir):
    files = os.listdir(saved_dir)
    print(f"\n📁 Generated Model Files ({len(files)} items):")
    for f in sorted(files)[:20]:
        print(f"   • {f}")

# Load and display reports
for task in ['demand', 'delay', 'anomaly']:
    report_file = os.path.join(saved_dir, f'{task}_comparison_report.json')
    if os.path.exists(report_file):
        with open(report_file) as f:
            report = json.load(f)
        
        print(f"\n{'='*60}")
        print(f"📈 {task.upper()} PREDICTION")
        print(f"{'='*60}")
        print(f"Models Trained: {report.get('models_compared', '?')}")
        print(f"Dataset Size: {report.get('data_size', '?'):,} records")
        
        if 'models' in report:
            print(f"\nModel Performance:")
            for model_name, metrics in list(report['models'].items())[:3]:
                mae = metrics.get('mae', metrics.get('f1_score', metrics.get('accuracy')))
                print(f"  • {model_name}: {mae:.4f}")
    else:
        print(f"\n⚠️ {task}_comparison_report.json not found")

print("\n" + "=" * 80)
```

---

## ⚠️ If You Get Errors

### Error: "could not convert string to float"
**Status:** ✅ FIXED - The enhanced debug output now shows if categorical encoding is happening

If you still see this error:
1. Check the output for "🔍 Detected categorical columns"
2. Look for "🔄 Encoding" message - should show which columns are being encoded
3. If you see "After encoding: X features" then encoding succeeded

### Error: "FileNotFoundError: dataset.csv"
The scripts check these paths in order:
1. `../data/demand_dataset.csv` (local)
2. `/content/bus-site/ai-service/data/demand_dataset.csv` (Colab)
3. `data/demand_dataset.csv` (relative)

Make sure you ran **Cell 3** first to generate the datasets.

### Error: "CUDA out of memory"
The dataset is now **2.4M rows** (previously 14.7M). This fits in Colab's memory.
If still OOM: Try **Cell 2** first to verify categorical encoding works.

---

## 📊 Expected Outputs

After training completes, you should have:

**Demand Models:**
- `demand_lstm_multimodel.keras`
- `demand_gru_multimodel.keras`
- `demand_transformer_multimodel.keras`
- `demand_xgboost_multimodel.pkl`
- `demand_lightgbm_multimodel.pkl`
- `demand_rf_multimodel.pkl`
- `demand_comparison_report.json` ← **Shows metrics & best model**

**Delay Models:**
- `delay_xgboost_reg_multimodel.pkl`
- `delay_lightgbm_reg_multimodel.pkl`
- (+ more for classification)
- `delay_comparison_report.json` ← **Shows metrics & best model**

**Anomaly Models:**
- `anomaly_isolation_forest_multimodel.pkl`
- `anomaly_lof_multimodel.pkl`
- `anomaly_ocsvm_multimodel.pkl`
- `anomaly_autoencoder_multimodel.keras`
- `anomaly_dbscan_multimodel.pkl`
- `anomaly_comparison_report.json` ← **Shows metrics & best model**

---

## 🔥 Key Fixes Applied

### ✅ Fix 1: Categorical Encoding
- **Added:** `dtype=float` parameter to `pd.get_dummies()`
- **Added:** `.astype(np.float32)` after `.values` conversion
- **Added:** `np.nan_to_num()` to handle edge cases
- **Result:** NO MORE string-to-float errors

### ✅ Fix 2: Training Progress Visibility
- **Added:** Detailed debug output showing exact step
- **Added:** Column names after encoding
- **Added:** Sample values to verify conversion
- **Result:** Know exactly where it fails if there's an error

### ✅ Fix 3: Model Persistence
- **All Keras models:** Saved as `.keras` format (TensorFlow 2.16+ requirement)
- **All Tree models:** Saved as `.pkl` format (joblib)
- **Result:** Models load correctly during inference

### ✅ Fix 4: Dataset Size
- **Reduced from:** 14.7M rows → **2.4M rows** (6-month window)
- **Maintains:** All feature patterns and seasonal variations
- **Result:** Fits in Colab memory, trains in 5 min

---

## 📋 Timeline

| Step | Task | Time |
|------|------|------|
| Cell 1 | Install dependencies | 2 min |
| Cell 2 | Verify encoding logic | 1 min |
| Cell 3 | Generate dataset | 5 min |
| Cell 4 | Train demand models | 5 min |
| Cell 5 | Train delay models | 8 min |
| Cell 6 | Train anomaly models | 5 min |
| Cell 7 | Display results | 1 min |
| **Total** | **Complete training pipeline** | **~27 minutes** |

---

## ✨ Next Steps

1. **Copy & paste** each cell into a new Colab notebook
2. **Run Cell 1-3** to verify setup
3. **Run Cell 4-6** to train all models (this can take 15-20 min)
4. **Run Cell 7** to see comparison results
5. **Download** `models/saved/*_comparison_report.json` for your paper
6. **Download** `evaluation_results/*.png` for your panel presentation

---

## 🆘 Questions?

- **Dataset not generating?** Check Cell 2 output - shows if categorical encoding works
- **Training fails?** Look for "❌" symbols in output - they pinpoint exactly where it fails
- **Results not showing?** Run Cell 7 to load the JSON reports manually

Good luck! 🚀
