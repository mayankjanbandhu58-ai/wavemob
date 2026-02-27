# Wavelength AI

**AI-Powered Multi-Disease Chest X-Ray Clinical Decision Support System**

> Designed for rural and under-resourced settings where radiologist access is limited.
> AI-assisted screening to help triage chest X-rays — does **not** replace doctors.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    WAVELENGTH AI                         │
├──────────────────────────────────────────────────────────┤
│  Frontend (Next.js 14 + TypeScript + Tailwind)           │
│  ├── Dashboard with drag-drop upload                     │
│  ├── Disease probability visualization                   │
│  ├── Heatmap overlay viewer                              │
│  └── PDF report download                                 │
├──────────────────────────────────────────────────────────┤
│  Backend (FastAPI + ONNX Runtime)                        │
│  ├── POST /api/predict     — Single image analysis       │
│  ├── POST /api/batch-predict  — Batch analysis           │
│  └── GET  /api/report/{id}    — Report retrieval         │
├──────────────────────────────────────────────────────────┤
│  AI Pipeline                                             │
│  ├── U-Net Lung Segmentation (pretrained)                │
│  ├── DenseNet121 + EfficientNetV2-S Ensemble             │
│  ├── Temperature Scaling Calibration                     │
│  ├── Monte Carlo Dropout Uncertainty                     │
│  ├── Grad-CAM++ Explainability                           │
│  └── Clinical Risk Scoring Engine                        │
├──────────────────────────────────────────────────────────┤
│  Dataset: NIH ChestX-ray14 (~20K filtered images)        │
│  Split: 70/15/15 (patient-level, no leakage)             │
│  Loss: BCEWithLogitsLoss with class weights              │
└──────────────────────────────────────────────────────────┘
```

## Detected Conditions (8 classes)

| Condition | Description |
|-----------|-------------|
| Atelectasis | Partial/complete lung collapse |
| Cardiomegaly | Enlarged heart |
| Effusion | Fluid around lungs |
| Infiltration | Substance filling airspaces |
| Mass | Abnormal growth |
| Nodule | Small round lesion |
| Pneumonia | Lung infection |
| Pneumothorax | Collapsed lung |

## Setup & Run

### Prerequisites
- Python 3.11+
- NVIDIA GPU with CUDA (RTX 4050 or equivalent)
- Node.js 18+
- Kaggle account (for dataset download)

### Install Dependencies

```bash
# Backend (from project root)
pip install -r backend/requirements.txt

# Frontend
cd frontend
npm install
```

### Validate Environment
```bash
python backend/scripts/validate_setup.py
```

### Download Dataset
```bash
python backend/scripts/download_dataset.py
```

### Train Models
```bash
# Train both models
python training/train.py --model both --max-samples 20000

# Evaluate on test set
python training/evaluate.py --model both

# Calibrate + create ensemble
python training/calibrate.py

# Export to ONNX
python training/export_models.py
```

### Run Backend

From the **root directory** (`wavelength`):
```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
backend
```

OR from the **backend directory** (`wavelength/backend`):
```powershell
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```


### Run Frontend
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

## Project Structure

```
wavelength/
├── backend/              # FastAPI + AI pipeline
│   ├── app/
│   │   ├── models/       # DenseNet121, EfficientNetV2-S
│   │   ├── pipeline/     # Segmentation, ensemble, calibration, etc.
│   │   ├── inference/    # ONNX Runtime wrapper
│   │   ├── routes/       # API endpoints
│   │   └── utils/        # Image processing, logging
│   └── scripts/          # Dataset download, env validation
├── training/             # Training pipeline
│   ├── train.py          # Main training loop
│   ├── evaluate.py       # Test set evaluation
│   ├── calibrate.py      # Temperature scaling + ensemble
│   ├── export_models.py  # TorchScript + ONNX export
│   └── dataset.py        # Data loading with patient splits
├── frontend/             # Next.js 14 dashboard
├── data/                 # Dataset (gitignored)
├── checkpoints/          # Model weights (gitignored)
└── logs/                 # Training logs (gitignored)
```

## Safety & Disclaimer

This system is designed as **clinical decision support** and must not be used as a standalone diagnostic tool. All AI-generated findings must be reviewed by qualified medical personnel. The system may produce false positives and false negatives.

## License

For research and demonstration purposes only.
