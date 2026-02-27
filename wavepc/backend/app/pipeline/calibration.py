"""
Temperature Scaling Calibration

Learns a single temperature parameter T on the validation set to calibrate
model confidence. Divides logits by T before applying sigmoid, resulting
in better-calibrated probability estimates.

Reference: Guo et al., "On Calibration of Modern Neural Networks" (2017)
"""

import json
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
from torch.optim import LBFGS

logger = logging.getLogger("wavelength.calibration")


class TemperatureScaler(nn.Module):
    """
    Temperature scaling for multi-label calibration.

    Learns a single scalar T that divides logits:
        calibrated_prob = sigmoid(logits / T)

    T > 1 → softens probabilities (less confident)
    T < 1 → sharpens probabilities (more confident)
    """

    def __init__(self, initial_temperature: float = 1.5):
        super().__init__()
        self.temperature = nn.Parameter(torch.tensor(initial_temperature))

    def forward(self, logits: torch.Tensor) -> torch.Tensor:
        """Scale logits by learned temperature."""
        return logits / self.temperature

    def calibrate(self, logits: torch.Tensor) -> np.ndarray:
        """
        Apply calibration and return numpy probabilities.

        Args:
            logits: Raw model logits, shape (num_classes,) or (B, num_classes)

        Returns:
            Calibrated probabilities as numpy array
        """
        with torch.no_grad():
            scaled = self.forward(logits)
            probs = torch.sigmoid(scaled)
        return probs.cpu().numpy()

    def fit(
        self,
        val_logits: torch.Tensor,
        val_labels: torch.Tensor,
        max_iter: int = 100,
        lr: float = 0.01,
    ):
        """
        Fit temperature on validation set using LBFGS optimization.

        Minimizes binary cross-entropy loss on validation data.

        Args:
            val_logits: Validation logits, shape (N, num_classes)
            val_labels: Validation labels, shape (N, num_classes)
            max_iter: Maximum optimization iterations
            lr: Learning rate for LBFGS
        """
        logger.info("Fitting temperature scaling on validation set...")

        criterion = nn.BCEWithLogitsLoss()
        optimizer = LBFGS([self.temperature], lr=lr, max_iter=max_iter)

        def closure():
            optimizer.zero_grad()
            scaled_logits = self.forward(val_logits)
            loss = criterion(scaled_logits, val_labels)
            loss.backward()
            return loss

        optimizer.step(closure)

        logger.info(f"Calibrated temperature: {self.temperature.item():.4f}")

    def save(self, path: Path):
        """Save temperature parameter."""
        config = {"temperature": self.temperature.item()}
        with open(path, "w") as f:
            json.dump(config, f, indent=2)
        logger.info(f"Temperature saved to {path}: T={config['temperature']:.4f}")

    @classmethod
    def load(cls, path: Path) -> "TemperatureScaler":
        """Load saved temperature parameter."""
        with open(path) as f:
            config = json.load(f)
        scaler = cls(initial_temperature=config["temperature"])
        logger.info(f"Loaded temperature: {config['temperature']:.4f}")
        return scaler
