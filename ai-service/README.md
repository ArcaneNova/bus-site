# SmartDTC AI Service - Multi-Model Comparison & Ensemble

FastAPI microservice providing **multi-model ML predictions** for the SmartDTC bus management platform. Runs on **port 8000**.

**🎯 For Paper & Panel Presentation:** This service trains and compares multiple state-of-the-art models for each task, enabling rigorous evaluation and selection of optimal architectures.

---

## Table of Contents

1. [What This Service Does](#what-this-service-does)
2. [Key Features](#key-features)
3. [Models Trained](#models-trained)
4. [Project Structure](#project-structure)
5. [Quick Start (Google Colab)](#quick-start-google-colab)
6. [Step-by-Step Guide](#step-by-step-guide)
   - [Step 1: Generate Enhanced Dataset](#step-1-generate-enhanced-dataset)
   - [Step 2: Train All Models](#step-2-train-all-models)
   - [Step 3: Evaluate & Compare](#step-3-evaluate--compare)
   - [Step 4: Deploy](#step-4-deploy)
7. [API Endpoints](#api-endpoints)
8. [Model Comparison Results](#model-comparison-results)
9. [API Reference](#api-reference)
10. [Environment Variables](#environment-variables)

---

## What This Service Does

| Task | Models Trained | Best Use Case |
|------|---|---|
| **Demand Prediction** | LSTM, GRU, Transformer, XGBoost, LightGBM, Random Forest | Predict passenger demand 24h ahead |
| **Delay Prediction** | XGBoost, LightGBM, CatBoost, SVR, MLP, Ensemble | Predict trip delays in real-time |
| **Anomaly Detection** | Isolation Forest, LOF, One-Class SVM, Autoencoder, DBSCAN, Ensemble | Flag unusual bus behavior |
| **ETA Prediction** | Gradient Boosting | Real-time passenger ETA |
| **Schedule Optimization** | Genetic Algorithm | Optimal bus headway planning |

All endpoints work **with or without trained models** — fallback to rule-based heuristics when unavailable.

---

## Key Features

✅ **Multiple Models Per Task** - Compare different architectures (LSTM, XGBoost, LightGBM, CatBoost, etc.)  
✅ **3-Year Synthetic Dataset** - Realistic patterns, 561 DTC routes, real geographical data  
✅ **Advanced Feature Engineering** - Cyclic temporal features, route-specific attributes  
✅ **Ensemble Methods** - Voting & stacking for optimal performance  
✅ **Comprehensive Evaluation** - Cross-validation, metrics comparison, visualizations  
✅ **Publication-Ready** - Detailed reports, comparison tables, graphs for paper  
✅ **Colab Compatible** - Full training pipeline runnable on Google Colab GPUs  

---

## Models Trained

### **DEMAND PREDICTION**
| Model | Type | Complexity | Speed | Best For |
|-------|------|-----------|-------|----------|
| LSTM | RNN | High | Medium | Temporal patterns, peak hour prediction |
| GRU | RNN | Medium | Fast | Faster alternative to LSTM |
| Transformer | Attention | Very High | Medium | State-of-the-art sequence modeling |
| XGBoost | Tree Ensemble | Medium | Very Fast | Feature importance, interpretability |
| LightGBM | Tree Ensemble | Medium | Very Fast | Large datasets, production efficiency |
| Random Forest | Ensemble | Medium | Fast | Baseline comparison, robustness |

### **DELAY PREDICTION**
| Model | Regression | Classification | Best For |
|-------|-----------|---|----------|
| XGBoost | MAE (min) | F1-Score | Balanced performance |
| LightGBM | ✅ | ✅ | Large-scale production |
| CatBoost | ✅ | ✅ | Categorical features handling |
| SVR | ✅ | — | Robust boundary detection |
| MLP | ✅ | ✅ | End-to-end deep learning |
| Ensemble Voting | ✅ | ✅ | Maximum accuracy |

### **ANOMALY DETECTION**
| Model | Type | Strengths | Weaknesses |
|-------|------|-----------|-----------|
| Isolation Forest | Tree-based | Fast, scalable | Struggles with high-dim data |
| LOF | Density-based | Local anomalies | Slower on large datasets |
| One-Class SVM | Kernel-based | Robust boundaries | Hyperparameter tuning needed |
| Autoencoder | Deep Learning | Learns complex patterns | Training overhead |
| DBSCAN | Clustering | No pre-set K | Density parameter sensitivity |
| Ensemble (Majority Voting) | Hybrid | Best overall | Computational cost |

---

## Project Structure

```
ai-service/
├── main.py                          # FastAPI application
├── model_loader.py                  # Model loading at startup
├── predictors.py                    # Prediction logic
├── anomaly_detector.py              # Anomaly detection
├── eta_predictor.py                 # ETA prediction
├── optimizer.py                     # Headway optimization
├── schemas.py                       # Pydantic schemas
├── requirements.txt                 # Dependencies
├── evaluate_models.py               # ⭐ Model evaluation script
│
├── training/
│   ├── enhanced_generate_dataset.py # ⭐ Enhanced dataset generator
│   ├── train_demand_models.py       # ⭐ Train 6 demand models
│   ├── train_delay_models.py        # ⭐ Train 6 delay models
│   ├── train_anomaly_models.py      # ⭐ Train 6 anomaly models
│   ├── generate_dataset.py          # [Legacy] Original dataset generator
│   ├── train_demand_lstm.py         # [Legacy] Original LSTM trainer
│   └── train_delay_xgboost.py       # [Legacy] Original XGBoost trainer
│
├── data/
│   ├── demand_dataset.csv           # Generated: 3-year hourly demand (561K+ rows)
│   ├── delay_dataset.csv            # Generated: 3-year trip delays (561K+ rows)
│   └── anomaly_dataset.csv          # Generated: Anomaly patterns (200K+ rows)
│
├── models/
│   └── saved/
│       ├── demand_lstm_multimodel/              # TensorFlow SavedModel
│       ├── demand_gru_multimodel/
│       ├── demand_transformer_multimodel/
│       ├── demand_xgboost_multimodel.pkl
│       ├── demand_lightgbm_multimodel.pkl
│       ├── demand_rf_multimodel.pkl
│       ├── demand_scaler_multimodel.pkl
│       ├── demand_comparison_report.json       # ⭐ Comparison metrics
│       │
│       ├── delay_xgboost_reg_multimodel.pkl
│       ├── delay_xgboost_clf_multimodel.pkl
│       ├── delay_lightgbm_reg_multimodel.pkl
│       ├── delay_catboost_reg_multimodel.pkl
│       ├── delay_svr_multimodel.pkl
│       ├── delay_mlp_multimodel/
│       ├── delay_ensemble_multimodel.pkl
│       ├── delay_scaler_multimodel.pkl
│       ├── delay_comparison_report.json        # ⭐ Comparison metrics
│       │
│       ├── anomaly_isolation_forest_multimodel.pkl
│       ├── anomaly_lof_multimodel.pkl
│       ├── anomaly_ocsvm_multimodel.pkl
│       ├── anomaly_autoencoder_multimodel/
│       ├── anomaly_dbscan_multimodel.pkl
│       ├── anomaly_scaler_multimodel.pkl
│       ├── anomaly_ae_threshold.pkl
│       └── anomaly_comparison_report.json      # ⭐ Comparison metrics
│
├── evaluation_results/
│   ├── demand_model_comparison.png             # ⭐ Visualization
│   ├── delay_model_comparison.png
│   ├── anomaly_model_comparison.png
│   ├── demand_comparison.csv
│   ├── delay_comparison.csv
│   ├── anomaly_comparison.csv
│   └── evaluation_summary.json
│
├── notebooks/
│   ├── model_evaluation.ipynb                  # ⭐ Jupyter notebook for Colab
│   └── [execution outputs & visualizations]
│
└── README.md (this file)
```

---

## Quick Start (Google Colab) ⭐

### **COMPLETE GOOGLE COLAB IMPLEMENTATION GUIDE**

**Total Time: ~1-2 hours (with GPU enabled)**

#### **Cell 1: Setup & Clone Repository**
```python
# Mount Google Drive (optional - for saving results)
from google.colab import drive
drive.mount('/content/drive')

# Clone repository
!git clone https://github.com/ArcaneNova/bus-site.git
%cd /content/bus-site/ai-service

print("✅ Repository cloned & ready")
```

#### **Cell 2: Install All Dependencies**
```bash
!pip install -q pandas numpy scikit-learn xgboost lightgbm catboost
!pip install -q tensorflow tensorflow-datasets
!pip install -q matplotlib seaborn plotly joblib python-dotenv
!pip install -q -U fastapi uvicorn pydantic httpx

print("✅ All packages installed")
```

#### **Cell 3: Generate Enhanced 3-Year Dataset**
```python
# This creates realistic synthetic data from real DTC routes
%cd /content/bus-site/ai-service/training
!python enhanced_generate_dataset.py

print("\n✅ Datasets generated:")
print("   • demand_dataset.csv (561K+ records)")
print("   • delay_dataset.csv (561K+ records)")
print("   • anomaly_dataset.csv (200K+ records)")
```

**⏱️ Time: 5 minutes**

#### **Cell 4: Train Demand Prediction Models (6 models)**
```python
# Trains: LSTM, GRU, Transformer, XGBoost, LightGBM, Random Forest
%cd /content/bus-site/ai-service/training
!python train_demand_models.py

print("\n✅ Demand models trained")
print("   Check: models/saved/demand_comparison_report.json")
```

**⏱️ Time: 5-15 minutes (GPU: 3-5 min, CPU: 15 min)**

#### **Cell 5: Train Delay Prediction Models (12 models)**
```python
# Trains: XGBoost, LightGBM, CatBoost, SVR, MLP + Classifiers
%cd /content/bus-site/ai-service/training
!python train_delay_models.py

print("\n✅ Delay models trained")
print("   Check: models/saved/delay_comparison_report.json")
```

**⏱️ Time: 8-20 minutes (GPU: 5-8 min, CPU: 20 min)**

#### **Cell 6: Train Anomaly Detection Models (6 methods)**
```python
# Trains: Isolation Forest, LOF, One-Class SVM, Autoencoder, DBSCAN, Ensemble
%cd /content/bus-site/ai-service/training
!python train_anomaly_models.py

print("\n✅ Anomaly models trained")
print("   Check: models/saved/anomaly_comparison_report.json")
```

**⏱️ Time: 5-10 minutes (GPU: 2-3 min, CPU: 10 min)**

#### **Cell 7: Evaluate & Generate Comparison Visualizations**
```python
# Generates comparison plots, CSV tables, and summary JSON
%cd /content/bus-site/ai-service
!python evaluate_models.py

print("\n✅ Evaluation complete!")
print("\n📊 Generated outputs:")
print("   • evaluation_results/demand_model_comparison.png")
print("   • evaluation_results/delay_model_comparison.png")
print("   • evaluation_results/anomaly_model_comparison.png")
print("   • evaluation_results/evaluation_summary.json")
print("   • evaluation_results/*.csv (comparison tables)")
```

**⏱️ Time: 2 minutes**

#### **Cell 8: Load & Display Results**
```python
import json
import pandas as pd
from IPython.display import Image, display

# Load summary
with open('/content/bus-site/ai-service/evaluation_results/evaluation_summary.json') as f:
    summary = json.load(f)

print("="*80)
print("📊 MODEL COMPARISON RESULTS")
print("="*80)

# Demand
if 'demand' in summary['task_summaries']:
    d = summary['task_summaries']['demand']
    print(f"\n🎯 DEMAND PREDICTION")
    print(f"   Best Model: {d['best_model']}")
    print(f"   MAE: {d['best_mae']:.2f} passengers")
    print(f"   R² Score: {d['best_r2']:.4f}")
    print(f"   Models Compared: {d['models_compared']}")

# Delay
if 'delay' in summary['task_summaries']:
    d = summary['task_summaries']['delay']
    print(f"\n🎯 DELAY PREDICTION")
    print(f"   Best Model: {d['best_model']}")
    print(f"   MAE: {d['best_mae_minutes']:.2f} minutes")
    print(f"   Models Compared: {d['models_compared']}")

# Anomaly
if 'anomaly' in summary['task_summaries']:
    d = summary['task_summaries']['anomaly']
    print(f"\n🎯 ANOMALY DETECTION")
    print(f"   Best Model: {d['best_model']}")
    print(f"   F1-Score: {d['best_f1']:.3f}")
    print(f"   Anomaly Rate: {d['anomaly_rate']:.2f}%")
    print(f"   Models Compared: {d['models_compared']}")

print("\n" + "="*80)

# Display comparison plots
print("\n📈 VISUALIZATIONS:")
display(Image('/content/bus-site/ai-service/evaluation_results/demand_model_comparison.png'))
display(Image('/content/bus-site/ai-service/evaluation_results/delay_model_comparison.png'))
display(Image('/content/bus-site/ai-service/evaluation_results/anomaly_model_comparison.png'))

# Load comparison tables
print("\n📋 COMPARISON TABLES:")
print("\nDEMAND MODELS:")
print(pd.read_csv('/content/bus-site/ai-service/evaluation_results/demand_comparison.csv').to_string())
print("\nDELAY MODELS:")
print(pd.read_csv('/content/bus-site/ai-service/evaluation_results/delay_comparison.csv').to_string())
print("\nANOMALY MODELS:")
print(pd.read_csv('/content/bus-site/ai-service/evaluation_results/anomaly_comparison.csv').to_string())
```

**⏱️ Time: 1 minute**

#### **Cell 9: Download Results for Panel & Paper**
```python
from google.colab import files
import os

# Create zip of all results
os.chdir('/content/bus-site/ai-service')
!zip -r SmartDTC_Model_Comparison_Results.zip evaluation_results/ models/saved/*comparison_report.json

# Download
files.download('SmartDTC_Model_Comparison_Results.zip')

print("✅ Downloaded: SmartDTC_Model_Comparison_Results.zip")
print("\nContains:")
print("   • Comparison visualizations (PNG)")
print("   • Comparison tables (CSV)")
print("   • Detailed metrics (JSON)")
print("   • Ready for presentation & paper!")
```

---

### **⚡ Quick Setup Checklist**

- [ ] Enable GPU in Colab: Runtime → Change Runtime Type → GPU
- [ ] Run Cell 1-2: Setup (2 min)
- [ ] Run Cell 3: Generate Data (5 min)
- [ ] Run Cell 4-6: Train Models (30-50 min)
- [ ] Run Cell 7-8: Evaluate & View Results (5 min)
- [ ] Run Cell 9: Download Everything (2 min)
- [ ] Use results for panel presentation & paper writing

---

### **🔧 Troubleshooting Common Colab Issues**

#### **Issue: "FileNotFoundError: dataset.csv not found"**

**Fix:** The training scripts now auto-detect file locations. Just make sure:
1. Cell 3 completed successfully (you should see "✅ Datasets generated")
2. Don't skip Cell 3 — you MUST generate data before training
3. If it still fails, run this in a new cell:
```python
import os
os.chdir('/content/bus-site/ai-service')
!ls -la data/
!ls -la models/saved/
```

#### **Issue: "ModuleNotFoundError: No module named 'lightgbm' (or catboost)"**

**Fix:** Cell 2 installs all packages. If error persists:
```python
!pip install -q lightgbm catboost optuna
```
Then re-run the training cell.

#### **Issue: "CUDA out of memory" during training**

**Fix:** Either:
1. Use CPU (slower but works): Disable GPU (Runtime → Change Runtime Type → None)
2. Reduce batch size: Edit the training script to use smaller BATCH_SIZE before running
3. Run each model separately instead of all at once

#### **Issue: "Permission denied" when creating files**

**Fix:** The scripts need write access. Run this once:
```python
!mkdir -p /content/bus-site/ai-service/models/saved
!mkdir -p /content/bus-site/ai-service/evaluation_results
```

#### **Issue: Cell 9 download fails or times out**

**Fix:** Download files individually:
```python
from google.colab import files
import os

os.chdir('/content/bus-site/ai-service/evaluation_results')

# Download PNG plots
files.download('demand_model_comparison.png')
files.download('delay_model_comparison.png')
files.download('anomaly_model_comparison.png')

# Download CSV tables
files.download('demand_comparison.csv')
files.download('delay_comparison.csv')
files.download('anomaly_comparison.csv')

# Download summary
files.download('evaluation_summary.json')
```

#### **Issue: Training takes way longer than expected**

**Common causes:**
- ❌ GPU NOT enabled (very slow on CPU)
- ❌ Too much other data on Colab instance
- ❌ Network latency downloading TensorFlow

**Solution:** 
1. Check GPU is enabled: Runtime → Change Runtime Type → GPU
2. Restart runtime if slow: Runtime → Restart all runtimes
3. Wait for TensorFlow to fully download (shows in Cell 2)

---

### **📊 What You'll Get From Colab**

After running all cells, you'll have:

**Best Models Per Task:**
```
Demand Prediction:      LSTM (MAE: ~12-15)
Delay Prediction:       XGBoost (MAE: ~2-3 min)
Anomaly Detection:      Ensemble (F1: ~0.85)
```

**For Your Panel:**
- 3 publication-ready comparison plots
- 3 detailed comparison CSV tables
- Complete metrics summary JSON

**For Your Paper:**
- Model comparison tables
- Performance visualizations
- Business insights from data analysis
- Justification for model selection

---

### **🖥️ Local Troubleshooting (Desktop/Server)**

#### **Issue: "FileNotFoundError: demand_dataset.csv not found"**

**Fix:** The scripts auto-detect paths. Make sure you're running from the correct directory:
```bash
cd d:\capstone project\bus-site\ai-service\training
python train_demand_models.py
```

Or verify files exist:
```bash
ls ../data/  # On Linux/Mac
dir ..\data\  # On Windows
```

#### **Issue: "numpy.float32 has no attribute 'clip'" in anomaly generation**

**Fix:** This has been fixed in the latest version. If you see this error, update the script:
```bash
git pull origin main
```

#### **Issue: "No module named tensorflow"**

**Fix:** Reinstall dependencies:
```bash
pip install -r requirements.txt --upgrade
```

Or install individually:
```bash
pip install tensorflow==2.16.1
pip install scikit-learn xgboost lightgbm catboost
```

#### **Issue: Out of memory on local machine**

**Fix:** Run scripts one at a time and use CPU:
```bash
# This will use CPU instead of GPU (slower but uses less memory)
python training/train_demand_models.py

# Wait for completion, then next:
python training/train_delay_models.py

python training/train_anomaly_models.py
```

Or reduce dataset size by editing the generators to use fewer records.

#### **Issue: "Connection refused" when running API**

**Fix:** Make sure port 8000 isn't in use:
```bash
# Find process using port 8000
lsof -i :8000  # On Linux/Mac
netstat -ano | findstr :8000  # On Windows

# Kill process and try again
python -m uvicorn main:app --port 8001  # Use different port
```

---

## Local Execution Guide (Optional - For Desktop/Server)

### **If Running Locally Instead of Colab:**

#### **Step 1: Setup Environment**
```bash
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### **Step 2: Generate Enhanced Dataset**

#### **Step 2: Generate Enhanced Dataset**

Generates 3 years of realistic synthetic data from real DTC routes/stages.

```bash
python training/enhanced_generate_dataset.py
```

**Output:**
- `data/demand_dataset.csv` - 561K+ records
- `data/delay_dataset.csv` - 561K+ records
- `data/anomaly_dataset.csv` - 200K+ records

#### **Step 3: Train All Models**

```bash
# Demand prediction (6 models)
python training/train_demand_models.py

# Delay prediction (6 models)  
python training/train_delay_models.py

# Anomaly detection (6 models)
python training/train_anomaly_models.py
```

Time: ~45 min (CPU) or ~10-15 min (GPU)

#### **Step 4: Evaluate & Compare**

```bash
python evaluate_models.py
```

Generates comparison plots, tables, and summary metrics in `evaluation_results/`

#### **Step 5: Deploy API**

```bash
# Run API server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or with Docker
docker build -t smartdtc-ai .
docker run -p 8000:8000 smartdtc-ai
```

API available at: `http://localhost:8000`  
Docs: `http://localhost:8000/docs`

---

## API Endpoints

### **Demand Prediction**
```
POST /predict/demand
Content-Type: application/json

{
  "route_id": "7000",
  "date": "2024-03-15",
  "hour": 8,
  "is_weekend": false,
  "is_holiday": false,
  "weather": "clear",
  "avg_temp_c": 28.5,
  "special_event": false
}

Response:
{
  "route_id": "7000",
  "date": "2024-03-15",
  "hour": 8,
  "predicted_count": 145,
  "crowd_level": "high",
  "confidence": 0.87,
  "model_used": "LSTM"
}
```

### **Delay Prediction**
```
POST /predict/delay
Content-Type: application/json

{
  "route_id": "7000",
  "hour": 8,
  "day_of_week": 4,
  "is_weekend": false,
  "is_holiday": false,
  "weather": "light_rain",
  "avg_temp_c": 28.0,
  "passenger_load_pct": 85.0,
  "scheduled_duration_min": 45.0,
  "distance_km": 15.2,
  "total_stops": 23
}

Response:
{
  "route_id": "7000",
  "predicted_delay_minutes": 8.5,
  "is_delayed": true,
  "delay_probability": 0.92,
  "delay_category": "high",
  "confidence": 0.85,
  "model_used": "XGBoost"
}
```

### **Anomaly Detection**
```
POST /detect/anomaly

{
  "speed_kmh": 15.0,
  "delay_minutes": 35.0,
  "passenger_load": 140.0
}

Response:
{
  "is_anomaly": true,
  "score": -0.65,
  "confidence": 0.88,
  "reason": "Unusually low speed with high delay",
  "model_used": "Ensemble"
}
```

### **Model Comparison**
```
GET /health

Response:
{
  "status": "healthy",
  "models_loaded": {
    "demand": ["lstm", "gru", "transformer", "xgboost", "lightgbm", "random_forest"],
    "delay": ["xgboost", "lightgbm", "catboost", "svr", "mlp", "ensemble"],
    "anomaly": ["isolation_forest", "lof", "one_class_svm", "autoencoder", "dbscan", "ensemble"]
  },
  "best_models": {
    "demand": {"model": "LSTM", "mae": 12.3},
    "delay": {"model": "XGBoost", "mae": 2.1},
    "anomaly": {"model": "Ensemble", "f1": 0.85}
  }
}
```

---

## Model Comparison Results

### **Example Output** (from `evaluation_results/evaluation_summary.json`):

```json
{
  "task_summaries": {
    "demand": {
      "best_model": "LSTM",
      "best_mae": 12.34,
      "best_r2": 0.8567,
      "models_compared": 6
    },
    "delay": {
      "best_model": "XGBoost",
      "best_mae_minutes": 2.15,
      "models_compared": 6
    },
    "anomaly": {
      "best_model": "Ensemble",
      "best_f1": 0.852,
      "anomaly_rate": 3.2,
      "models_compared": 6
    }
  }
}
```

---

## Prerequisites

### **Local Machine:**
- Python 3.10+
- 16GB RAM (8GB minimum)
- GPU optional but recommended

### **Google Colab:**
- Free Google account
- GPU access (enable in Runtime → Change Runtime Type)

### **Packages:**
- FastAPI, TensorFlow, XGBoost, LightGBM, CatBoost, scikit-learn
- See `requirements.txt` for complete list

---

## Environment Variables

```bash
# .env file
MODEL_DIR=models/saved
DATA_DIR=data
LOG_LEVEL=INFO
ENABLE_ENSEMBLE=true
```

---

## For Paper & Panel Presentation

### **Recommended Sections:**

1. **Dataset Analysis** - Use plots from `demand_analysis.png`, `delay_analysis.png`
2. **Model Comparison** - Use comparison CSVs and PNG visualizations
3. **Best Models** - Report from `evaluation_summary.json`
4. **Feature Importance** - Extract from trained tree-based models
5. **Novelty** - Multi-model comparison framework, ensemble approach

### **Files to Export:**
- `evaluation_results/*.png` - Ready for slides
- `evaluation_results/*.csv` - Tables for paper
- `models/saved/*_comparison_report.json` - Detailed metrics
- Notebook output - Running examples

---

## Advanced Usage

### **Custom Model Selection:**
```python
# In main.py, modify predict_demand to select specific model
def predict_demand(..., model_name: str = "best"):
    if model_name == "lstm":
        return lstm_model.predict(...)
    elif model_name == "lightgbm":
        return lightgbm_model.predict(...)
    elif model_name == "ensemble":
        return ensemble_predict(...)
```

### **Cross-Validation:**
- Training scripts already split data (80% train, 10% val, 10% test)
- For K-fold CV, modify `train_*_models.py` scripts

### **Hyperparameter Tuning:**
- Uses `optuna` for automated hyperparameter optimization
- Uncomment in training scripts to enable

---

## Citation & Paper Reference

If using this work for publication, cite:
```
SmartDTC AI Service: Multi-Model Comparison Framework for Bus Demand, Delay, 
and Anomaly Prediction using 3-Year Synthetic Realistic Data from DTC Routes.
```

---

**Last Updated:** April 9, 2026  
**Maintained By:** SmartDTC AI Research Team  
**License:** MIT

---

## Prerequisites

### Local (for data generation only)
- Python 3.10 or 3.11
- `pip install pandas numpy`
- Access to `routes.csv` and `stages.csv` at the workspace root (already in the repo)

### Google Colab (for training)
- A free Google account — no GPU quota needed for XGBoost; GPU accelerates LSTM ~5×
- Model training takes approximately:
  - Demand LSTM: ~5–15 minutes on Colab GPU
  - Delay XGBoost: ~2–5 minutes on Colab CPU

---

## Step 1 — Generate the Training Dataset

Run this **once locally** (or skip to Colab section where you can run it there too).

```bash
# From the ai-service/ directory
cd ai-service
pip install pandas numpy
python training/generate_dataset.py
```

This reads `routes.csv` and `stages.csv` from the workspace root and produces:

| File | Rows | Description |
|---|---|---|
| `data/demand_dataset.csv` | ~2,700+ | One year of hourly demand records per route |
| `data/delay_dataset.csv` | ~2,700+ | One year of trip-level delay records per route |

**What the data contains:**

`demand_dataset.csv` columns:
- `route_id`, `date`, `hour`, `day_of_week`, `is_weekend`, `is_holiday`
- `weather`, `weather_encoded`, `avg_temp_c`, `special_event`, `month`
- `passenger_count` ← **target**

`delay_dataset.csv` columns:
- `route_id`, `date`, `hour`, `day_of_week`, `is_weekend`, `is_holiday`
- `weather`, `weather_encoded`, `avg_temp_c`
- `passenger_load_pct`, `scheduled_duration_min`, `distance_km`, `total_stops`, `month`
- `delay_minutes` ← **regression target**
- `is_delayed` ← **classification target** (1 if delay > 5 min)

---

## Step 2 — Train on Google Colab

### Why Colab?
Google Colab provides free GPU/CPU compute. Training the LSTM locally on a laptop CPU takes significantly longer. Colab also avoids any local environment setup issues.

---

### 2a. Train the Demand LSTM

#### Open a new Colab notebook at [colab.research.google.com](https://colab.research.google.com)

**Cell 1 — Install packages:**
```python
!pip install tensorflow xgboost scikit-learn joblib pandas numpy -q
```

**Cell 2 — Upload the dataset CSV:**
```python
from google.colab import files
uploaded = files.upload()
# Select demand_dataset.csv from your computer (found in ai-service/data/)
```

**Cell 3 — Upload the training script:**
```python
from google.colab import files
uploaded = files.upload()
# A file picker dialog will appear in your browser.
# Navigate to your project folder and select:
#   bus-site/ai-service/training/train_demand_lstm.py
```

> 📁 **Where is `train_demand_lstm.py`?**  
> On your computer it is at:  
> `<your project folder>\bus-site\ai-service\training\train_demand_lstm.py`  
> Upload **only this one file** — not the whole `training/` folder.

**Cell 4 — Fix the data path and run:**
```python
import re, os

# The script expects CSV at ../data/demand_dataset.csv (relative to training/).
# We patch the paths so it works from Colab's /content directory.
with open("train_demand_lstm.py", "r") as f:
    code = f.read()

os.makedirs("models_output", exist_ok=True)

code = re.sub(r'DATA_PATH\s*=.*', 'DATA_PATH = "demand_dataset.csv"', code)
code = re.sub(r'SAVE_DIR\s*=.*',  'SAVE_DIR  = "models_output"',       code)

with open("train_demand_lstm_colab.py", "w") as f:
    f.write(code)

exec(open("train_demand_lstm_colab.py").read())
```

> **Tip:** Change the Colab runtime to **GPU** via *Runtime → Change runtime type → T4 GPU* before running for faster training.

**Cell 5 — Check accuracy before exporting:**
```python
import numpy as np
import matplotlib.pyplot as plt
import joblib

# ── Reload scaler + model (already in memory if you ran Cell 4 above) ──
# If you restarted the runtime, uncomment and re-run Cell 4 first.

# ── Metrics (the training script already computed these, shown here visually) ──
# y_test and y_pred are still in scope from exec() above
mae  = np.mean(np.abs(y_pred - y_test))
mape = np.mean(np.abs((y_pred - y_test) / (y_test + 1e-8))) * 100
rmse = np.sqrt(np.mean((y_pred - y_test) ** 2))
r2   = 1 - np.sum((y_test - y_pred)**2) / np.sum((y_test - np.mean(y_test))**2)

print("=" * 45)
print("        DEMAND LSTM — TEST ACCURACY")
print("=" * 45)
print(f"  MAE   : {mae:.2f}  passengers   (lower = better)")
print(f"  RMSE  : {rmse:.2f}  passengers   (lower = better)")
print(f"  MAPE  : {mape:.2f}%              (lower = better)")
print(f"  R²    : {r2:.4f}               (1.0 = perfect)")
print("=" * 45)

# ── Acceptance thresholds ──
ok = mae < 20 and mape < 25 and r2 > 0.70
print(f"\n{'✅  Model is GOOD — safe to export.' if ok else '⚠️  Model needs more data or tuning.'}")

# ── Plot: Actual vs Predicted (first 200 test samples) ──
fig, axes = plt.subplots(1, 2, figsize=(14, 4))

axes[0].plot(y_test[:200], label="Actual",    alpha=0.8, linewidth=1.2)
axes[0].plot(y_pred[:200], label="Predicted", alpha=0.8, linewidth=1.2, linestyle="--")
axes[0].set_title("Actual vs Predicted Demand (first 200 samples)")
axes[0].set_xlabel("Sample")
axes[0].set_ylabel("Passenger Count")
axes[0].legend()
axes[0].grid(True, alpha=0.3)

axes[1].scatter(y_test[:500], y_pred[:500], alpha=0.3, s=10, color="steelblue")
axes[1].plot([y_test.min(), y_test.max()],
             [y_test.min(), y_test.max()], "r--", linewidth=1.5, label="Perfect fit")
axes[1].set_title("Scatter: Actual vs Predicted")
axes[1].set_xlabel("Actual")
axes[1].set_ylabel("Predicted")
axes[1].legend()
axes[1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig("demand_model_accuracy.png", dpi=120)
plt.show()
print("📊  Plot saved as demand_model_accuracy.png")
```

> **What good results look like:**
> | Metric | Acceptable | Good |
> |--------|-----------|------|
> | MAE | < 20 passengers | < 10 passengers |
> | MAPE | < 25% | < 15% |
> | R² | > 0.70 | > 0.85 |
>
> If results are poor, try training on more data (increase `SAMPLES_PER_ROUTE` in `generate_dataset.py`) or enable GPU runtime.

**Cell 6 — Download the trained model files:**
```python
import shutil, os
from google.colab import files

# Zip the SavedModel folder (it's a directory, not a single file)
shutil.make_archive("demand_lstm", "zip", "models_output", "demand_lstm")

files.download("demand_lstm.zip")                    # LSTM SavedModel folder
files.download("models_output/demand_scaler.pkl")    # feature scaler
files.download("demand_model_accuracy.png")          # accuracy plot (optional)
```

---

### 2b. Train the Delay XGBoost

**In the same or a new Colab notebook:**

**Cell 1 — Install packages (if new notebook):**
```python
!pip install xgboost scikit-learn joblib pandas numpy -q
```

**Cell 2 — Upload the dataset:**
```python
from google.colab import files
uploaded = files.upload()
# Select delay_dataset.csv from ai-service/data/
```

**Cell 3 — Upload the training script:**
```python
from google.colab import files
uploaded = files.upload()
# Select training/train_delay_xgboost.py
```

**Cell 4 — Fix paths and run:**
```python
import re, os

with open("train_delay_xgboost.py", "r") as f:
    code = f.read()

os.makedirs("models_output", exist_ok=True)

code = re.sub(r'DATA_PATH\s*=.*', 'DATA_PATH = "delay_dataset.csv"', code)
code = re.sub(r'SAVE_DIR\s*=.*',  'SAVE_DIR  = "models_output"',     code)

with open("train_delay_xgboost_colab.py", "w") as f:
    f.write(code)

exec(open("train_delay_xgboost_colab.py").read())
```

**Cell 5 — Check accuracy before exporting:**
```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error,
    f1_score, classification_report, confusion_matrix,
    ConfusionMatrixDisplay,
)

# yr_test / yr_pred  = regression targets (delay_minutes)
# yc_test / yc_pred  = classifier targets (is_delayed)
# These are in scope from exec() above.

mae  = mean_absolute_error(yr_test, yr_pred)
rmse = np.sqrt(mean_squared_error(yr_test, yr_pred))
mape = np.mean(np.abs((yr_pred - yr_test) / (yr_test + 1e-8))) * 100
f1   = f1_score(yc_test, yc_pred)

print("=" * 50)
print("      DELAY XGBOOST — TEST ACCURACY")
print("=" * 50)
print(f"  Regressor  MAE  : {mae:.2f} min   (lower = better)")
print(f"  Regressor  RMSE : {rmse:.2f} min  (lower = better)")
print(f"  Regressor  MAPE : {mape:.2f}%     (lower = better)")
print(f"  Classifier F1   : {f1:.3f}        (1.0 = perfect)")
print("=" * 50)
print()
print(classification_report(yc_test, yc_pred, target_names=["on-time", "delayed"]))

ok = mae < 8 and f1 > 0.70
print(f"{'✅  Model is GOOD — safe to export.' if ok else '⚠️  Model needs more data or tuning.'}")

# ── Plots ──
fig, axes = plt.subplots(1, 2, figsize=(14, 4))

# Scatter: actual vs predicted delay minutes
axes[0].scatter(yr_test[:500], yr_pred[:500], alpha=0.3, s=10, color="darkorange")
axes[0].plot([yr_test.min(), yr_test.max()],
             [yr_test.min(), yr_test.max()], "r--", linewidth=1.5, label="Perfect fit")
axes[0].set_title("Delay Regressor: Actual vs Predicted")
axes[0].set_xlabel("Actual delay (min)")
axes[0].set_ylabel("Predicted delay (min)")
axes[0].legend(); axes[0].grid(True, alpha=0.3)

# Confusion matrix for classifier
cm = confusion_matrix(yc_test, yc_pred)
ConfusionMatrixDisplay(cm, display_labels=["on-time", "delayed"]).plot(ax=axes[1], colorbar=False)
axes[1].set_title(f"Delay Classifier Confusion Matrix  (F1={f1:.3f})")

plt.tight_layout()
plt.savefig("delay_model_accuracy.png", dpi=120)
plt.show()
print("📊  Plot saved as delay_model_accuracy.png")
```

> **What good results look like:**
> | Metric | Acceptable | Good |
> |--------|-----------|------|
> | Regressor MAE | < 8 min | < 4 min |
> | Classifier F1 | > 0.70 | > 0.85 |

**Cell 6 — Download the trained model files:**
```python
from google.colab import files

files.download("models_output/delay_regressor.pkl")
files.download("models_output/delay_classifier.pkl")
files.download("models_output/delay_scaler.pkl")
files.download("delay_model_accuracy.png")           # accuracy plot (optional)
```

---

### Alternative: Run Everything in One Colab Notebook

You can also clone the repo directly inside Colab and run everything end-to-end:

```python
# Cell 1 — Clone repo and install
!git clone https://github.com/YOUR_USERNAME/bus-site.git
%cd bus-site/ai-service
!pip install -r requirements.txt -q

# Cell 2 — Generate dataset
!python training/generate_dataset.py

# Cell 3 — Train LSTM (change runtime to GPU first!)
!python training/train_demand_lstm.py

# Cell 4 — Train XGBoost
!python training/train_delay_xgboost.py

# Cell 5 — Download all model files
import shutil
from google.colab import files

shutil.make_archive("demand_lstm", "zip", "models/saved", "demand_lstm")
files.download("demand_lstm.zip")
files.download("models/saved/demand_scaler.pkl")
files.download("models/saved/delay_regressor.pkl")
files.download("models/saved/delay_classifier.pkl")
files.download("models/saved/delay_scaler.pkl")
```

---

## Step 3 — Export and Place Model Files

After downloading from Colab, place the files into `ai-service/models/saved/`:

```
ai-service/
└── models/
    └── saved/
        ├── demand_lstm/          ← Unzip demand_lstm.zip here (it's a folder)
        │   ├── saved_model.pb
        │   └── variables/
        │       ├── variables.index
        │       └── variables.data-00000-of-00001
        ├── demand_scaler.pkl     ← Downloaded from Colab
        ├── delay_regressor.pkl   ← Downloaded from Colab
        ├── delay_classifier.pkl  ← Downloaded from Colab
        └── delay_scaler.pkl      ← Downloaded from Colab
```

**To unzip `demand_lstm.zip` on Windows:**
```powershell
Expand-Archive -Path "demand_lstm.zip" -DestinationPath "ai-service\models\saved\"
```

**On Linux/Mac:**
```bash
unzip demand_lstm.zip -d ai-service/models/saved/
```

> The `models/saved/` directory is in `.gitignore` because model files are large binary files. Each team member must run the training or copy the files manually.

---

## Step 4 — Run Locally

### 4.1 Set up virtual environment

```bash
cd ai-service

# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

### 4.2 Install dependencies

```bash
pip install -r requirements.txt
```

`requirements.txt` includes:
- `fastapi`, `uvicorn[standard]` — web framework
- `tensorflow` — LSTM model inference
- `xgboost`, `scikit-learn` — delay model inference
- `joblib` — model serialization
- `pandas`, `numpy` — data handling
- `pydantic` — request validation

### 4.3 Configure environment

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` if your model directory is in a non-default location:
```env
MODEL_DIR=./models/saved
LOG_LEVEL=info
```

### 4.4 Start the server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service will start and log:
```
INFO:  Loading ML models…
INFO:  ✅  LSTM demand model loaded
INFO:  ✅  Demand scaler loaded
INFO:  ✅  XGBoost delay regressor loaded
INFO:  ✅  AI service ready
INFO:  Uvicorn running on http://0.0.0.0:8000
```

If model files are not present, you'll see warnings but the service will still start:
```
WARNING:  ⚠️  LSTM model not found — using rule-based fallback
```

### 4.5 Verify it works

Open [http://localhost:8000/health](http://localhost:8000/health) or run:
```bash
curl http://localhost:8000/health
```

Response with trained models:
```json
{
  "status": "ok",
  "models": {
    "demand_lstm": true,
    "delay_xgboost": true
  }
}
```

Interactive API docs are at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Step 5 — Run with Docker

### 5.1 Build the image

```bash
cd ai-service
docker build -t smartdtc-ai .
```

### 5.2 Run the container

```bash
docker run -d \
  --name smartdtc-ai \
  -p 8000:8000 \
  -v "$(pwd)/models:/app/models" \
  -e MODEL_DIR=/app/models/saved \
  smartdtc-ai
```

**On Windows PowerShell:**
```powershell
docker run -d `
  --name smartdtc-ai `
  -p 8000:8000 `
  -v "${PWD}/models:/app/models" `
  -e MODEL_DIR=/app/models/saved `
  smartdtc-ai
```

The `-v` flag mounts your local `models/` directory into the container so it can find the trained model files.

### 5.3 With Docker Compose (recommended)

If the project has a `docker-compose.yml`, run all services together:
```bash
# From the workspace root (bus-site/)
docker-compose up --build
```

---

## API Reference

### `GET /health`
Check service status and which models are loaded.

```bash
curl http://localhost:8000/health
```

---

### `POST /predict/demand`
Predict passenger count for a specific route, date, and hour.

**Request:**
```json
{
  "route_id": "DTC-401",
  "date": "2024-08-15",
  "hour": 8,
  "is_weekend": false,
  "is_holiday": true,
  "weather": "clear",
  "avg_temp_c": 32.5,
  "special_event": false
}
```

**Response:**
```json
{
  "route_id": "DTC-401",
  "predicted_demand": 118,
  "hour": 8,
  "confidence": 0.82,
  "model_used": "lstm"
}
```

`model_used` will be `"lstm"` when the trained model is loaded, or `"rule_based"` for the fallback.

---

### `POST /predict/delay`
Predict expected delay and whether a trip will be delayed.

**Request:**
```json
{
  "route_id": "DTC-401",
  "hour": 8,
  "day_of_week": 1,
  "is_weekend": false,
  "is_holiday": false,
  "weather": "rain",
  "avg_temp_c": 28.0,
  "passenger_load_pct": 85.0,
  "scheduled_duration_min": 45,
  "distance_km": 18.5,
  "total_stops": 22
}
```

**Response:**
```json
{
  "route_id": "DTC-401",
  "delay_minutes": 7.3,
  "is_delayed": true,
  "confidence": 0.78,
  "model_used": "xgboost"
}
```

---

### `POST /predict/eta`
Predict ETA for a passenger at a specific stop.

**Request:**
```json
{
  "distance_km": 4.2,
  "hour": 9,
  "day_of_week": 2,
  "is_weekend": false,
  "weather_encoded": 0,
  "avg_speed_kmh": 22.0,
  "stop_count_remaining": 6,
  "current_delay_minutes": 3.0
}
```

**Response:**
```json
{
  "eta_minutes": 14.5,
  "confidence": 0.75,
  "model_used": "gradient_boosting"
}
```

---

### `POST /detect/anomaly`
Detect abnormal bus behaviour (speeding, unusual delay, overcrowding).

**Request:**
```json
{
  "speed_kmh": 85.0,
  "delay_minutes": 25.0,
  "passenger_load": 145
}
```

**Response:**
```json
{
  "is_anomaly": true,
  "score": -0.42,
  "confidence": 0.88,
  "reason": "High delay and overcrowding detected"
}
```

---

### `POST /optimize/headway`
Calculate optimal headway (minutes between buses) for each hour of the day.

**Request:**
```json
{
  "route_id": "DTC-401",
  "date": "2024-08-15",
  "total_buses_available": 8,
  "demand_profile": [5, 3, 2, 2, 8, 20, 45, 90, 120, 100, 65, 55, 70, 65, 55, 60, 75, 115, 135, 100, 70, 50, 35, 18]
}
```

**Response:**
```json
{
  "route_id": "DTC-401",
  "headway_minutes": [30, 30, 30, 30, 20, 12, 8, 5, 4, 5, 8, 10, 8, 8, 10, 10, 8, 5, 4, 5, 8, 10, 12, 20],
  "optimization_score": 0.91,
  "buses_required": 6
}
```

---

### `POST /schedule/generate`
Generate a full day's departure schedule for a route.

**Request:**
```json
{
  "route_id": "DTC-401",
  "date": "2024-08-15",
  "total_buses_available": 8
}
```

**Response:**
```json
{
  "route_id": "DTC-401",
  "date": "2024-08-15",
  "trips": [
    {
      "departure_time": "05:30",
      "estimated_arrival": "06:20",
      "headway_minutes": 30,
      "expected_demand": 12
    },
    ...
  ],
  "total_trips": 28
}
```

---

### `POST /admin/retrain`
Trigger background retraining of all models using latest data.

**Request:**
```json
{
  "retrain_demand": true,
  "retrain_delay": true,
  "retrain_anomaly": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Retraining started in background. Check /health after ~2 minutes."
}
```

---

## Fallback Behaviour (No Models)

If model files are not present in `models/saved/`, the service automatically uses rule-based heuristics:

**Demand fallback:** Uses a hardcoded hourly demand table based on observed DTC patterns:
```
Peak hours (8am, 6pm): ~120–130 passengers
Off-peak (2am–4am):    ~2–5 passengers
```
Adjusted by weather factor: rain = ×0.85, fog = ×0.90, heatwave = ×0.75

**Delay fallback:** Calculates delay from weather + load:
```
Rain → +5 min base delay
Passenger load > 80% → +2 min additional
```

This means you can develop and test the full stack without running the ML training pipeline.

---

## Model Retraining via API

The `/admin/retrain` endpoint triggers `retrain_pipeline.py` in the background. The pipeline:

1. Pulls recent data from the MongoDB database (via `MONGO_URI` env var)
2. Re-runs feature engineering
3. Retrains the LSTM and XGBoost models
4. Saves new model files to `models/saved/`, overwriting the old ones
5. Reloads the models into memory

This is useful for production — schedule weekly retraining as a cron job via the backend's scheduler service.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

| Variable | Default | Description |
|---|---|---|
| `MODEL_DIR` | `./models/saved` | Path to trained model files |
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warning`) |
| `MONGO_URI` | *(optional)* | MongoDB connection string for retraining pipeline |
| `PORT` | `8000` | Port the service listens on (when using Dockerfile CMD) |

---

## Quick Reference: Model File Checklist

Before starting the service, verify these files exist in `ai-service/models/saved/`:

```
✅ demand_lstm/              (directory with saved_model.pb inside)
✅ demand_lstm/variables/    (directory)
✅ demand_scaler.pkl
✅ delay_regressor.pkl
✅ delay_classifier.pkl
✅ delay_scaler.pkl
```

Run this check from the `ai-service/` directory:

```bash
python -c "
import os
files = [
    'models/saved/demand_lstm',
    'models/saved/demand_scaler.pkl',
    'models/saved/delay_regressor.pkl',
    'models/saved/delay_classifier.pkl',
    'models/saved/delay_scaler.pkl',
]
for f in files:
    status = '✅' if os.path.exists(f) else '❌ MISSING'
    print(f'{status}  {f}')
"
```
