"""
Main Training Loop

Trains DenseNet121 and EfficientNetV2-S on NIH ChestX-ray14.
Features:
- Mixed precision training (AMP)
- AdamW optimizer with CosineAnnealingWarmRestarts
- Early stopping by validation mean AUC
- Per-epoch metrics logging
- Best checkpoint saving
"""

import json
import logging
import sys
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import roc_auc_score
from torch.cuda.amp import GradScaler, autocast
from tqdm import tqdm

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.config import CHECKPOINT_DIR, DISEASE_LABELS, IMAGE_SIZE, NUM_CLASSES
from backend.app.models.densenet import build_densenet121
from backend.app.models.efficientnet import build_efficientnet_v2_s
from training.config import (
    BATCH_SIZE,
    DENSENET_DROPOUT,
    EFFICIENTNET_DROPOUT,
    GRAD_CLIP_NORM,
    LEARNING_RATE,
    MAX_EPOCHS,
    MIXED_PRECISION,
    NUM_WORKERS,
    PATIENCE,
    RANDOM_SEED,
    T_0,
    T_MULT,
    WEIGHT_DECAY,
)
from training.dataset import (
    compute_class_weights,
    create_dataloaders,
    load_and_split_data,
)

logger = logging.getLogger("wavelength.train")
logging.basicConfig(level=logging.INFO, format="%(asctime)s │ %(levelname)-8s │ %(message)s")


def train_one_epoch(
    model: nn.Module,
    loader,
    criterion: nn.Module,
    optimizer,
    scaler: GradScaler,
    device: str,
    epoch: int,
) -> float:
    """Train for one epoch. Returns average loss."""
    model.train()
    running_loss = 0.0
    num_batches = 0

    pbar = tqdm(loader, desc=f"Epoch {epoch} [Train]", leave=False)
    for images, labels, _ in pbar:
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)

        optimizer.zero_grad()

        with autocast(enabled=MIXED_PRECISION):
            logits = model(images)
            loss = criterion(logits, labels)

        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP_NORM)
        scaler.step(optimizer)
        scaler.update()

        running_loss += loss.item()
        num_batches += 1
        pbar.set_postfix(loss=f"{loss.item():.4f}")

    return running_loss / max(num_batches, 1)


@torch.no_grad()
def validate(
    model: nn.Module,
    loader,
    criterion: nn.Module,
    device: str,
) -> tuple:
    """Validate model. Returns (avg_loss, mean_auc, per_disease_auc)."""
    model.eval()
    running_loss = 0.0
    num_batches = 0

    all_labels = []
    all_probs = []

    for images, labels, _ in tqdm(loader, desc="Validating", leave=False):
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)

        with autocast(enabled=MIXED_PRECISION):
            logits = model(images)
            loss = criterion(logits, labels)

        probs = torch.sigmoid(logits)
        all_labels.append(labels.cpu().numpy())
        all_probs.append(probs.cpu().numpy())

        running_loss += loss.item()
        num_batches += 1

    avg_loss = running_loss / max(num_batches, 1)

    all_labels = np.concatenate(all_labels, axis=0)
    all_probs = np.concatenate(all_probs, axis=0)

    # Per-disease AUC
    per_auc = {}
    valid_aucs = []
    for i, label in enumerate(DISEASE_LABELS):
        try:
            auc = roc_auc_score(all_labels[:, i], all_probs[:, i])
            per_auc[label] = auc
            valid_aucs.append(auc)
        except ValueError:
            per_auc[label] = 0.0  # Single class in split

    mean_auc = np.mean(valid_aucs) if valid_aucs else 0.0

    return avg_loss, mean_auc, per_auc


def train_model(
    model_type: str = "densenet121",
    max_samples: int = 20000,
):
    """
    Full training pipeline for a single model.

    Args:
        model_type: "densenet121" or "efficientnet_v2_s"
        max_samples: Maximum dataset samples to use
    """
    # Set seeds
    torch.manual_seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Device: {device}")
    if device == "cuda":
        logger.info(f"GPU: {torch.cuda.get_device_name(0)}")

    # ── Data ──
    logger.info("Loading and splitting dataset...")
    train_df, val_df, test_df = load_and_split_data(max_samples=max_samples)

    # Find image directory (handle both flat and nested structures)
    from backend.app.config import DATA_DIR
    image_dir = DATA_DIR / "images"
    if not image_dir.exists():
        # Try alternative paths
        for candidate in ["images_001/images", "images"]:
            alt = DATA_DIR / candidate
            if alt.exists():
                image_dir = alt
                break

    logger.info(f"Image directory: {image_dir}")

    train_loader, val_loader, test_loader = create_dataloaders(
        train_df, val_df, test_df, image_dir,
        batch_size=BATCH_SIZE, num_workers=NUM_WORKERS,
    )

    # ── Class weights ──
    pos_weight = compute_class_weights(train_df).to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    # ── Model ──
    if model_type == "densenet121":
        model = build_densenet121(num_classes=NUM_CLASSES, dropout=DENSENET_DROPOUT)
    elif model_type == "efficientnet_v2_s":
        model = build_efficientnet_v2_s(num_classes=NUM_CLASSES, dropout=EFFICIENTNET_DROPOUT)
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    model = model.to(device)
    logger.info(f"Model: {model_type} | Params: {sum(p.numel() for p in model.parameters()):,}")

    # ── Optimizer & Scheduler ──
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=LEARNING_RATE,
        weight_decay=WEIGHT_DECAY,
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(
        optimizer, T_0=T_0, T_mult=T_MULT,
    )
    scaler = GradScaler(enabled=MIXED_PRECISION)

    # ── Training Loop ──
    best_auc = 0.0
    patience_counter = 0
    history = {"train_loss": [], "val_loss": [], "val_auc": []}

    checkpoint_path = CHECKPOINT_DIR / f"{model_type}_best.pth"

    logger.info("=" * 60)
    logger.info(f"  Training {model_type}")
    logger.info(f"  Epochs: {MAX_EPOCHS} | Batch: {BATCH_SIZE} | LR: {LEARNING_RATE}")
    logger.info(f"  Early stopping patience: {PATIENCE}")
    logger.info("=" * 60)

    for epoch in range(1, MAX_EPOCHS + 1):
        epoch_start = time.time()

        # Train
        train_loss = train_one_epoch(
            model, train_loader, criterion, optimizer, scaler, device, epoch,
        )

        # Validate
        val_loss, val_auc, per_auc = validate(model, val_loader, criterion, device)

        # Step scheduler
        scheduler.step()

        # Log
        elapsed = time.time() - epoch_start
        lr = optimizer.param_groups[0]["lr"]

        logger.info(
            f"Epoch {epoch:3d}/{MAX_EPOCHS} │ "
            f"Train Loss: {train_loss:.4f} │ "
            f"Val Loss: {val_loss:.4f} │ "
            f"Val AUC: {val_auc:.4f} │ "
            f"LR: {lr:.6f} │ "
            f"Time: {elapsed:.1f}s"
        )

        # Per-disease AUC
        auc_str = " │ ".join(f"{k[:4]}: {v:.3f}" for k, v in per_auc.items())
        logger.info(f"  Per-disease: {auc_str}")

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["val_auc"].append(val_auc)

        # Save best
        if val_auc > best_auc:
            best_auc = val_auc
            patience_counter = 0
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_auc": val_auc,
                "per_auc": per_auc,
                "model_type": model_type,
            }, checkpoint_path)
            logger.info(f"  ★ New best model saved! AUC: {val_auc:.4f}")
        else:
            patience_counter += 1
            if patience_counter >= PATIENCE:
                logger.info(f"Early stopping at epoch {epoch} (patience={PATIENCE})")
                break

    # Save training history
    history_path = CHECKPOINT_DIR / f"{model_type}_history.json"
    with open(history_path, "w") as f:
        json.dump(history, f, indent=2)

    logger.info("=" * 60)
    logger.info(f"  Training complete for {model_type}")
    logger.info(f"  Best AUC: {best_auc:.4f}")
    logger.info(f"  Checkpoint: {checkpoint_path}")
    logger.info("=" * 60)

    return best_auc


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train Wavelength chest X-ray classifier")
    parser.add_argument("--model", type=str, default="densenet121",
                       choices=["densenet121", "efficientnet_v2_s", "both"])
    parser.add_argument("--max-samples", type=int, default=20000)
    args = parser.parse_args()

    if args.model == "both":
        logger.info("Training both models sequentially...")
        auc1 = train_model("densenet121", max_samples=args.max_samples)
        auc2 = train_model("efficientnet_v2_s", max_samples=args.max_samples)
        logger.info(f"DenseNet121 AUC: {auc1:.4f} | EfficientNetV2-S AUC: {auc2:.4f}")
    else:
        train_model(args.model, max_samples=args.max_samples)
