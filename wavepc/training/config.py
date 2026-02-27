"""
Training Configuration

Hyperparameters and training settings, extending the base config.
"""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.config import (
    BATCH_SIZE,
    CHECKPOINT_DIR,
    DATA_DIR,
    DENSENET_DROPOUT,
    DISEASE_LABELS,
    EFFICIENTNET_DROPOUT,
    IMAGE_SIZE,
    LABELS_CSV,
    LEARNING_RATE,
    LOG_DIR,
    MAX_EPOCHS,
    NUM_CLASSES,
    NUM_WORKERS,
    PATIENCE,
    PIXEL_MEAN,
    PIXEL_STD,
    RANDOM_SEED,
    SPLIT_RATIOS,
    WEIGHT_DECAY,
)

# Training-specific overrides (if needed)
MIXED_PRECISION = True
SCHEDULER = "cosine_warm_restarts"  # CosineAnnealingWarmRestarts
T_0 = 10  # Initial restart period
T_MULT = 2  # Multiply period after each restart
GRAD_CLIP_NORM = 1.0
