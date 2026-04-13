# 🚀 QUICK START - 30 SECOND VERSION

## Status: READY ✅

All categorical encoding bugs fixed. Scripts ready for Colab.

---

## What Was Wrong

```
ValueError: could not convert string to float: 'commercial_hub'
```

**Cause:** Categorical strings weren't being converted to numbers

**Fixed:** Added proper dtype conversion in 3 training scripts

---

## How to Run

### In Google Colab (Recommended):

**Step 1:** Open new Colab notebook

**Step 2:** Copy & run this cell:
```python
!cd /content && git clone https://github.com/your-repo/bus-site.git 2>/dev/null || echo "Already cloned"
%cd /content/bus-site/ai-service
!pip install -q tensorflow pandas scikit-learn xgboost lightgbm numpy -U
!pip install -q catboost 2>/dev/null || echo "CatBoost optional"
```

**Step 3:** Copy & run this cell:
```python
%cd /content/bus-site/ai-service/data && python ../training/enhanced_generate_dataset.py
```

**Step 4:** Copy & run these cells (one at a time):
```python
%cd /content/bus-site/ai-service/training
!python train_demand_models.py
```
```python
%cd /content/bus-site/ai-service/training
!python train_delay_models.py
```
```python
%cd /content/bus-site/ai-service/training
!python train_anomaly_models.py
```

**Step 5:** See results:
```python
import json
import os

for task in ['demand', 'delay', 'anomaly']:
    with open(f'/content/bus-site/ai-service/models/saved/{task}_comparison_report.json') as f:
        report = json.load(f)
    print(f"\n{task.upper()}:")
    for model, metrics in list(report['models'].items())[:3]:
        print(f"  {model}: {list(metrics.values())[0]:.4f}")
```

---

## What You Get

- 6 demand prediction models ✅
- 6 delay prediction models ✅  
- 6 anomaly detection models ✅
- Comparison reports (JSON) ✅
- Best model for each task identified ✅

---

## Time Required

- Dataset generation: 5 min
- Demand training: 5 min
- Delay training: 8 min
- Anomaly training: 5 min
- **Total: ~25 min**

---

## If Something Fails

1. Check the error message
2. Look at debug output (shows yellow 🔍 and green ✅)
3. If categorical error: Run `verify_encoding.py` first
4. See `COLAB_INSTRUCTIONS.md` for detailed troubleshooting

---

## Files You Need

| File | Purpose |
|------|---------|
| `ai-service/training/train_demand_models.py` | Train demand models |
| `ai-service/training/train_delay_models.py` | Train delay models |
| `ai-service/training/train_anomaly_models.py` | Train anomaly models |
| `ai-service/training/enhanced_generate_dataset.py` | Generate data |
| `COLAB_INSTRUCTIONS.md` | Full guide with all cells |
| `ai-service/verify_encoding.py` | Test encoding locally |

---

## Key Improvement

**Before:** Script fails with categorical encoding error
**After:** ✅ All categories properly encoded to float32 before scaling

**Debug output now shows:**
- Detected categorical columns: `['route_type', 'weather']` ✓
- Encoding successful: `After encoding: 21 features` ✓
- Scaling complete: `✅ Scaling complete` ✓

---

## One More Thing

The scripts now print detailed status at each step. If anything fails, you'll see exactly where:

```
🔍 Detected categorical columns: ['route_type', 'weather']
🔄 Encoding 2 categorical columns...
   • route_type: ['commercial_hub', 'residential', 'peripheral']
   • weather: ['clear', 'light_rain', 'heavy_rain', ...]
✅ After encoding: 21 features
🔄 Converting to numpy (float32)...
✅ Array dtype: float32, shape: (2452320, 21)
🔄 Scaling features with StandardScaler...
✅ Scaling complete
```

---

## Questions?

- **Dataset not generating?** Check `verify_encoding.py` works
- **Training fails?** Look for ❌ in output - shows exact problem
- **Results missing?** Check `models/saved/*_comparison_report.json` exists

---

**You're all set!** 🎉

Go run the training in Colab now.
