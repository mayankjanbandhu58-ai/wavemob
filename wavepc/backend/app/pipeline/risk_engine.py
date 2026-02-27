"""
Clinical Risk Scoring Engine

Aggregates multi-label disease probabilities into a single risk score,
weighting critical conditions (e.g., Pneumothorax, Mass) more heavily.
Outputs a triage recommendation: Low / Moderate / High Suspicion.
"""

import logging
from typing import Dict, List

import numpy as np

from app.config import CRITICAL_CONDITION_WEIGHTS, DISEASE_LABELS, RISK_THRESHOLDS

logger = logging.getLogger("wavelength.risk_engine")


class RiskEngine:
    """
    Clinical risk scoring engine for triage prioritization.

    Computes a weighted composite risk score based on disease probabilities
    and clinical severity weights. Higher-risk conditions (e.g., Pneumothorax)
    amplify the score.
    """

    def __init__(
        self,
        disease_labels: List[str] = DISEASE_LABELS,
        condition_weights: Dict[str, float] = CRITICAL_CONDITION_WEIGHTS,
        thresholds: Dict[str, float] = RISK_THRESHOLDS,
    ):
        self.disease_labels = disease_labels
        self.condition_weights = condition_weights
        self.thresholds = thresholds

    def compute_risk(
        self,
        probabilities: np.ndarray,
        uncertainty: Dict = None,
    ) -> Dict:
        """
        Compute clinical risk score.

        Algorithm:
            1. Multiply each disease probability by its clinical weight
            2. Take weighted max (highest-risk single finding)
            3. Add a contribution from the weighted mean (overall burden)
            4. Boost score if uncertainty is high (conservative approach)

        Args:
            probabilities: Disease probabilities, shape (num_classes,)
            uncertainty: Optional uncertainty dict from MC Dropout

        Returns:
            Dict with risk_score, risk_level, risk_color, and details
        """
        # Step 1: Weighted probabilities
        weighted_probs = np.zeros_like(probabilities)
        for i, label in enumerate(self.disease_labels):
            weight = self.condition_weights.get(label, 1.0)
            weighted_probs[i] = probabilities[i] * weight

        # Step 2: Composite score
        # 60% from max weighted finding, 40% from mean weighted burden
        max_score = float(np.max(weighted_probs))
        mean_score = float(np.mean(weighted_probs))
        risk_score = 0.6 * max_score + 0.4 * mean_score

        # Step 3: Uncertainty boost (if model is uncertain, err on the side of caution)
        if uncertainty and uncertainty.get("overall_uncertainty") == "high":
            risk_score = min(1.0, risk_score * 1.15)

        # Step 4: Classify risk level
        risk_level, risk_color = self._classify_risk(risk_score)

        # Identify dominant findings
        dominant_findings = self._get_dominant_findings(probabilities)

        return {
            "risk_score": round(float(risk_score), 4),
            "risk_level": risk_level,
            "risk_color": risk_color,
            "dominant_findings": dominant_findings,
            "recommendation": self._get_recommendation(risk_level),
        }

    def _classify_risk(self, score: float):
        """Map risk score to triage level."""
        if score < self.thresholds["low"]:
            return "Low Risk", "#22C55E"  # Green
        elif score < self.thresholds["moderate"]:
            return "Moderate Risk", "#EAB308"  # Yellow
        else:
            return "High Suspicion", "#EF4444"  # Red

    def _get_dominant_findings(self, probabilities: np.ndarray, threshold: float = 0.3) -> List[Dict]:
        """Identify dominant disease findings above threshold."""
        findings = []
        for i, label in enumerate(self.disease_labels):
            if probabilities[i] >= threshold:
                findings.append({
                    "disease": label,
                    "probability": round(float(probabilities[i]), 4),
                    "severity_weight": self.condition_weights.get(label, 1.0),
                })
        # Sort by probability descending
        findings.sort(key=lambda x: x["probability"], reverse=True)
        return findings

    def _get_recommendation(self, risk_level: str) -> str:
        """Generate clinical recommendation based on risk level."""
        recommendations = {
            "Low Risk": (
                "No significant abnormalities detected by AI screening. "
                "Routine follow-up recommended. Clinical correlation advised."
            ),
            "Moderate Risk": (
                "Potential abnormalities detected. Priority review by radiologist "
                "recommended within 24 hours. Clinical correlation required."
            ),
            "High Suspicion": (
                "URGENT: High-probability findings detected. Immediate radiologist "
                "review recommended. Consider clinical intervention. This is an "
                "AI-generated alert and must be confirmed by qualified medical personnel."
            ),
        }
        return recommendations.get(risk_level, "Clinical review recommended.")
