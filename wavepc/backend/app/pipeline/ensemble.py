"""
Weighted Ensemble Module

Combines predictions from DenseNet121 and EfficientNetV2-S using
validation-performance-weighted averaging. Weights are derived from
per-model validation AUC scores.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np

logger = logging.getLogger("wavelength.ensemble")


class WeightedEnsemble:
    """
    Weighted ensemble of multi-label classifiers.

    Combines sigmoid probabilities from multiple models using weights
    proportional to their validation AUC performance.
    """

    def __init__(self, model_names: List[str], weights: Optional[Dict[str, float]] = None):
        """
        Initialize ensemble.

        Args:
            model_names: List of model identifiers
            weights: Dict mapping model name → weight. If None, equal weights.
        """
        self.model_names = model_names

        if weights is None:
            # Equal weighting
            w = 1.0 / len(model_names)
            self.weights = {name: w for name in model_names}
        else:
            self.weights = weights

        # Normalize weights to sum to 1
        total = sum(self.weights.values())
        self.weights = {k: v / total for k, v in self.weights.items()}

        logger.info(f"Ensemble weights: {self.weights}")

    def combine(self, predictions: Dict[str, np.ndarray]) -> np.ndarray:
        """
        Combine model predictions via weighted average.

        Args:
            predictions: Dict mapping model_name → probability array of shape (num_classes,)

        Returns:
            Weighted average probabilities of shape (num_classes,)
        """
        combined = np.zeros_like(list(predictions.values())[0])

        for name in self.model_names:
            if name not in predictions:
                raise ValueError(f"Missing predictions for model: {name}")
            combined += self.weights[name] * predictions[name]

        return combined

    @classmethod
    def from_validation_aucs(cls, aucs: Dict[str, float]) -> "WeightedEnsemble":
        """
        Create ensemble with weights derived from validation AUCs.

        Higher AUC → higher weight. Uses AUC^2 for sharper differentiation.

        Args:
            aucs: Dict mapping model_name → mean validation AUC

        Returns:
            WeightedEnsemble instance
        """
        model_names = list(aucs.keys())
        # Square AUCs for sharper weighting
        weights = {name: auc ** 2 for name, auc in aucs.items()}
        return cls(model_names=model_names, weights=weights)

    def save(self, path: Path):
        """Save ensemble configuration."""
        config = {
            "model_names": self.model_names,
            "weights": self.weights,
        }
        with open(path, "w") as f:
            json.dump(config, f, indent=2)
        logger.info(f"Ensemble config saved to {path}")

    @classmethod
    def load(cls, path: Path) -> "WeightedEnsemble":
        """Load ensemble configuration."""
        with open(path) as f:
            config = json.load(f)
        return cls(
            model_names=config["model_names"],
            weights=config["weights"],
        )
