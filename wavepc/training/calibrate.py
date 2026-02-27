"""
Temperature Calibration Fitting

Fits temperature scaling on validation set logits to calibrate
model confidence after training.
"""

import json
import logging
import sys
from pathlib import Path

import numpy as np
import torch
from torch.cuda.amp import autocast
from tqdm import tqdm

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.config import CHECKPOINT_DIR, NUM_CLASSES
from backend.app.models.densenet import build_densenet121
from backend.app.models.efficientnet import build_efficientnet_v2_s
from backend.app.pipeline.calibration import TemperatureScaler
from backend.app.pipeline.ensemble import WeightedEnsemble
from training.config import BATCH_SIZE, DENSENET_DROPOUT, EFFICIENTNET_DROPOUT, NUM_WORKERS
from training.dataset import create_dataloaders, load_and_split_data

logger = logging.getLogger("wavelength.calibrate")
logging.basicConfig(level=logging.INFO, format="%(asctime)s │ %(levelname)-8s │ %(message)s")


def calibrate_models(max_samples: int = 20000):
    """
    Fit temperature scaling and ensemble weights on validation set.
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Load data
    _, val_df, _ = load_and_split_data(max_samples=max_samples)

    from backend.app.config import DATA_DIR
    image_dir = DATA_DIR / "images"
    if not image_dir.exists():
        for candidate in ["images_001/images", "images"]:
            alt = DATA_DIR / candidate
            if alt.exists():
                image_dir = alt
                break

    _, val_loader, _ = create_dataloaders(
        val_df, val_df, val_df, image_dir,
        batch_size=BATCH_SIZE, num_workers=NUM_WORKERS,
    )

    # Load both models and collect validation logits
    models_aucs = {}
    all_logits = {}

    for model_type in ["densenet121", "efficientnet_v2_s"]:
        checkpoint_path = CHECKPOINT_DIR / f"{model_type}_best.pth"
        if not checkpoint_path.exists():
            logger.warning(f"Skipping {model_type}: checkpoint not found")
            continue

        if model_type == "densenet121":
            model = build_densenet121(NUM_CLASSES, DENSENET_DROPOUT, pretrained=False)
        else:
            model = build_efficientnet_v2_s(NUM_CLASSES, EFFICIENTNET_DROPOUT, pretrained=False)

        checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
        model.load_state_dict(checkpoint["model_state_dict"])
        model = model.to(device)
        model.eval()

        val_auc = checkpoint.get("val_auc", 0.5)
        models_aucs[model_type] = val_auc

        # Collect validation logits
        logits_list = []
        labels_list = []

        with torch.no_grad():
            for images, labels, _ in tqdm(val_loader, desc=f"Collecting {model_type} logits"):
                images = images.to(device, non_blocking=True)
                with autocast():
                    logits = model(images)
                logits_list.append(logits.cpu())
                labels_list.append(labels)

        all_logits[model_type] = torch.cat(logits_list, dim=0)

    if not models_aucs:
        logger.error("No models found for calibration")
        return

    val_labels = torch.cat(labels_list, dim=0)

    # ── Ensemble weights ──
    ensemble = WeightedEnsemble.from_validation_aucs(models_aucs)
    ensemble.save(CHECKPOINT_DIR / "ensemble_config.json")
    logger.info(f"Ensemble weights: {ensemble.weights}")

    # ── Temperature scaling ──
    # Average logits across models for temperature fitting
    avg_logits = torch.zeros_like(list(all_logits.values())[0])
    for name, logits in all_logits.items():
        avg_logits += ensemble.weights[name] * logits

    scaler = TemperatureScaler(initial_temperature=1.5)
    scaler.fit(avg_logits, val_labels)
    scaler.save(CHECKPOINT_DIR / "temperature.json")

    logger.info("Calibration complete!")


if __name__ == "__main__":
    calibrate_models()
