"""
Wavelength — Global Configuration

Central configuration for model paths, hyperparameters, disease labels,
and runtime settings. Uses environment variables where appropriate.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ──────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent  # wavelength/
DATA_DIR = PROJECT_ROOT / "data"
CHECKPOINT_DIR = PROJECT_ROOT / "checkpoints"
LOG_DIR = PROJECT_ROOT / "logs"
ONNX_DIR = CHECKPOINT_DIR / "onnx"
SEGMENTATION_WEIGHTS_DIR = CHECKPOINT_DIR / "segmentation"

# Create directories
for d in [DATA_DIR, CHECKPOINT_DIR, LOG_DIR, ONNX_DIR, SEGMENTATION_WEIGHTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ──────────────────────────────────────────────
# Dataset
# ──────────────────────────────────────────────
DATASET_NAME = "nih-chest-xrays/data"
IMAGE_DIR = DATA_DIR / "images"
LABELS_CSV = DATA_DIR / "Data_Entry_2017.csv"

# ──────────────────────────────────────────────
# Disease Labels (8 target conditions)
# ──────────────────────────────────────────────
DISEASE_LABELS = [
    "Atelectasis",
    "Cardiomegaly",
    "Effusion",
    "Infiltration",
    "Mass",
    "Nodule",
    "Pneumonia",
    "Pneumothorax",
]
NUM_CLASSES = len(DISEASE_LABELS)

# ──────────────────────────────────────────────
# Image Preprocessing
# ──────────────────────────────────────────────
IMAGE_SIZE = 224  # Input resolution for DenseNet/EfficientNet
PIXEL_MEAN = [0.485, 0.456, 0.406]  # ImageNet normalization
PIXEL_STD = [0.229, 0.224, 0.225]

# ──────────────────────────────────────────────
# Model Architecture
# ──────────────────────────────────────────────
DENSENET_DROPOUT = 0.3
EFFICIENTNET_DROPOUT = 0.3

# ──────────────────────────────────────────────
# Training
# ──────────────────────────────────────────────
BATCH_SIZE = 32
NUM_WORKERS = 4
LEARNING_RATE = 1e-4
WEIGHT_DECAY = 1e-5
MAX_EPOCHS = 50
PATIENCE = 7  # Early stopping patience
SPLIT_RATIOS = (0.70, 0.15, 0.15)  # train / val / test
RANDOM_SEED = 42

# ──────────────────────────────────────────────
# Inference
# ──────────────────────────────────────────────
MC_DROPOUT_PASSES = 5
UNCERTAINTY_THRESHOLD = 0.15  # Flag if variance exceeds this
DEFAULT_TEMPERATURE = 1.0  # Will be overwritten after calibration

# ──────────────────────────────────────────────
# Risk Engine
# ──────────────────────────────────────────────
CRITICAL_CONDITION_WEIGHTS = {
    "Atelectasis": 1.0,
    "Cardiomegaly": 1.2,
    "Effusion": 1.3,
    "Infiltration": 1.1,
    "Mass": 1.8,
    "Nodule": 1.5,
    "Pneumonia": 1.6,
    "Pneumothorax": 2.0,
}

RISK_THRESHOLDS = {
    "low": 0.3,
    "moderate": 0.6,
    # anything above 0.6 = high
}

# ──────────────────────────────────────────────
# Backend Server
# ──────────────────────────────────────────────
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
