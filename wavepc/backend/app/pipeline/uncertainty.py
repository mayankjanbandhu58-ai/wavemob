"""
Monte Carlo Dropout Uncertainty Estimation

Performs multiple stochastic forward passes with dropout enabled
to estimate predictive uncertainty. High variance across passes
indicates the model is uncertain about its prediction.

Reference: Gal & Ghahramani, "Dropout as a Bayesian Approximation" (2016)
"""

import logging
from typing import Dict, Tuple

import numpy as np
import torch

logger = logging.getLogger("wavelength.uncertainty")


def mc_dropout_inference(
    model: torch.nn.Module,
    input_tensor: torch.Tensor,
    num_passes: int = 5,
    device: str = "cuda",
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Perform Monte Carlo Dropout inference.

    Enables dropout during inference and runs multiple forward passes
    to estimate predictive uncertainty.

    Args:
        model: PyTorch model with dropout layers
        input_tensor: Input tensor of shape (1, C, H, W)
        num_passes: Number of stochastic forward passes
        device: Compute device

    Returns:
        Tuple of:
            - mean_probs: Mean predicted probabilities, shape (num_classes,)
            - variance: Prediction variance, shape (num_classes,)
    """
    input_tensor = input_tensor.to(device)

    # Enable dropout but keep batch norm in eval mode
    _enable_mc_dropout(model)

    all_probs = []

    with torch.no_grad():
        for _ in range(num_passes):
            logits = model(input_tensor)
            probs = torch.sigmoid(logits).cpu().numpy().squeeze()
            all_probs.append(probs)

    # Restore eval mode
    model.eval()

    all_probs = np.array(all_probs)  # (num_passes, num_classes)

    mean_probs = np.mean(all_probs, axis=0)
    variance = np.var(all_probs, axis=0)

    return mean_probs, variance


def _enable_mc_dropout(model: torch.nn.Module):
    """
    Enable dropout layers while keeping other layers in eval mode.

    This is key: we want stochastic dropout but deterministic
    batch normalization during MC inference.
    """
    model.eval()
    for module in model.modules():
        if isinstance(module, torch.nn.Dropout):
            module.train()


def classify_uncertainty(
    variance: np.ndarray,
    threshold: float = 0.15,
    disease_labels: list = None,
) -> Dict:
    """
    Classify overall uncertainty and per-disease flags.

    Args:
        variance: Prediction variance per disease, shape (num_classes,)
        threshold: Variance threshold for "high uncertainty"
        disease_labels: List of disease names

    Returns:
        Dict with:
            - overall_uncertainty: "low" | "moderate" | "high"
            - mean_variance: float
            - per_disease: list of dicts with uncertainty flags
    """
    mean_var = float(np.mean(variance))

    if mean_var < threshold * 0.5:
        overall = "low"
    elif mean_var < threshold:
        overall = "moderate"
    else:
        overall = "high"

    per_disease = []
    if disease_labels:
        for i, label in enumerate(disease_labels):
            per_disease.append({
                "disease": label,
                "variance": float(variance[i]),
                "is_uncertain": bool(variance[i] > threshold),
            })

    return {
        "overall_uncertainty": overall,
        "mean_variance": mean_var,
        "per_disease": per_disease,
    }
