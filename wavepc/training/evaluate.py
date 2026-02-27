"""
Model Evaluation

Evaluates trained models on the test set.
Reports per-disease AUC, mean AUC, and classification metrics.
"""

import json
import logging
import sys
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import classification_report, roc_auc_score
from torch.cuda.amp import autocast
from tqdm import tqdm

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.config import CHECKPOINT_DIR, DISEASE_LABELS, NUM_CLASSES
from backend.app.models.densenet import build_densenet121
from backend.app.models.efficientnet import build_efficientnet_v2_s
from training.config import BATCH_SIZE, DENSENET_DROPOUT, EFFICIENTNET_DROPOUT, NUM_WORKERS
from training.dataset import create_dataloaders, load_and_split_data

logger = logging.getLogger("wavelength.evaluate")
logging.basicConfig(level=logging.INFO, format="%(asctime)s │ %(levelname)-8s │ %(message)s")


def evaluate_model(model_type: str = "densenet121", max_samples: int = 20000):
    """
    Evaluate a trained model on the test set.

    Args:
        model_type: "densenet121" or "efficientnet_v2_s"
        max_samples: Maximum dataset samples
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Load data
    _, _, test_df = load_and_split_data(max_samples=max_samples)

    from backend.app.config import DATA_DIR
    image_dir = DATA_DIR / "images"
    if not image_dir.exists():
        for candidate in ["images_001/images", "images"]:
            alt = DATA_DIR / candidate
            if alt.exists():
                image_dir = alt
                break

    _, _, test_loader = create_dataloaders(
        test_df, test_df, test_df, image_dir,
        batch_size=BATCH_SIZE, num_workers=NUM_WORKERS,
    )

    # Load model
    checkpoint_path = CHECKPOINT_DIR / f"{model_type}_best.pth"
    if not checkpoint_path.exists():
        logger.error(f"Checkpoint not found: {checkpoint_path}")
        return

    if model_type == "densenet121":
        model = build_densenet121(num_classes=NUM_CLASSES, dropout=DENSENET_DROPOUT, pretrained=False)
    else:
        model = build_efficientnet_v2_s(num_classes=NUM_CLASSES, dropout=EFFICIENTNET_DROPOUT, pretrained=False)

    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    logger.info(f"Loaded {model_type} from epoch {checkpoint.get('epoch', '?')}")
    logger.info(f"Validation AUC at save: {checkpoint.get('val_auc', '?')}")

    # Evaluate
    all_labels = []
    all_probs = []

    with torch.no_grad():
        for images, labels, _ in tqdm(test_loader, desc="Evaluating"):
            images = images.to(device, non_blocking=True)
            with autocast():
                logits = model(images)
            probs = torch.sigmoid(logits).cpu().numpy()
            all_labels.append(labels.numpy())
            all_probs.append(probs)

    all_labels = np.concatenate(all_labels, axis=0)
    all_probs = np.concatenate(all_probs, axis=0)

    # Per-disease AUC
    logger.info("\n" + "=" * 50)
    logger.info(f"  TEST SET RESULTS — {model_type}")
    logger.info("=" * 50)

    aucs = {}
    for i, disease in enumerate(DISEASE_LABELS):
        try:
            auc = roc_auc_score(all_labels[:, i], all_probs[:, i])
        except ValueError:
            auc = 0.0
        aucs[disease] = auc
        logger.info(f"  {disease:20s}  AUC: {auc:.4f}")

    mean_auc = np.mean(list(aucs.values()))
    logger.info(f"\n  Mean AUC: {mean_auc:.4f}")
    logger.info("=" * 50)

    # Save results
    results = {
        "model_type": model_type,
        "mean_auc": mean_auc,
        "per_disease_auc": aucs,
    }

    results_path = CHECKPOINT_DIR / f"{model_type}_test_results.json"
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)

    logger.info(f"Results saved to {results_path}")
    return mean_auc


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="densenet121",
                       choices=["densenet121", "efficientnet_v2_s", "both"])
    parser.add_argument("--max-samples", type=int, default=20000)
    args = parser.parse_args()

    if args.model == "both":
        auc1 = evaluate_model("densenet121", args.max_samples)
        auc2 = evaluate_model("efficientnet_v2_s", args.max_samples)
        if auc1 and auc2:
            logger.info(f"\nDenseNet121: {auc1:.4f} | EfficientNetV2-S: {auc2:.4f}")
    else:
        evaluate_model(args.model, args.max_samples)
