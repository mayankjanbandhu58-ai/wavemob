"""
Grad-CAM++ Explainability Module

Generates per-disease visual explanations showing which image regions
influenced the model's prediction. Uses pytorch-grad-cam library.

Reference: Chattopadhyay et al., "Grad-CAM++: Generalized Gradient-based
Visual Explanations for Deep Convolutional Networks" (2018)
"""

import base64
import io
import logging
from typing import Dict, List, Optional

import cv2
import numpy as np
import torch
from PIL import Image
from pytorch_grad_cam import GradCAMPlusPlus
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

logger = logging.getLogger("wavelength.gradcam")


class GradCAMExplainer:
    """
    Grad-CAM++ explainability engine.

    Generates per-disease heatmaps showing regions of interest.
    """

    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        """
        Initialize Grad-CAM++ explainer.

        Args:
            model: Classification model
            target_layer: Convolutional layer to target for CAM computation
        """
        self.model = model
        self.cam = GradCAMPlusPlus(model=model, target_layers=[target_layer])

    def generate_heatmap(
        self,
        input_tensor: torch.Tensor,
        class_idx: int,
        original_image: np.ndarray,
    ) -> np.ndarray:
        """
        Generate Grad-CAM++ heatmap for a specific disease class.

        Args:
            input_tensor: Preprocessed input, shape (1, 3, 224, 224)
            class_idx: Target disease class index
            original_image: Original image for overlay, (H, W, 3), uint8

        Returns:
            Heatmap overlay image (H, W, 3), uint8
        """
        targets = [ClassifierOutputTarget(class_idx)]

        # Generate CAM
        grayscale_cam = self.cam(input_tensor=input_tensor, targets=targets)
        grayscale_cam = grayscale_cam[0]  # (H, W)

        # Resize CAM to original image size
        h, w = original_image.shape[:2]
        grayscale_cam = cv2.resize(grayscale_cam, (w, h))

        # Normalize original image to [0, 1]
        img_normalized = original_image.astype(np.float32) / 255.0

        # Create overlay
        overlay = show_cam_on_image(img_normalized, grayscale_cam, use_rgb=True)

        return overlay

    def generate_all_heatmaps(
        self,
        input_tensor: torch.Tensor,
        probabilities: np.ndarray,
        original_image: np.ndarray,
        disease_labels: List[str],
        threshold: float = 0.1,
    ) -> Dict[str, np.ndarray]:
        """
        Generate heatmaps for all diseases with probability above threshold.

        Args:
            input_tensor: Preprocessed input tensor
            probabilities: Disease probabilities, shape (num_classes,)
            original_image: Original image for overlay
            disease_labels: List of disease names
            threshold: Minimum probability to generate heatmap

        Returns:
            Dict mapping disease_name → heatmap overlay image
        """
        heatmaps = {}

        for idx, (label, prob) in enumerate(zip(disease_labels, probabilities)):
            if prob >= threshold:
                try:
                    heatmap = self.generate_heatmap(input_tensor, idx, original_image)
                    heatmaps[label] = heatmap
                    logger.debug(f"Generated heatmap for {label} (prob={prob:.3f})")
                except Exception as e:
                    logger.warning(f"Failed to generate heatmap for {label}: {e}")

        return heatmaps

    def generate_combined_heatmap(
        self,
        input_tensor: torch.Tensor,
        probabilities: np.ndarray,
        original_image: np.ndarray,
        disease_labels: List[str],
        top_k: int = 3,
    ) -> np.ndarray:
        """
        Generate a combined heatmap weighted by disease probabilities.

        Shows the top-K most likely diseases combined.

        Args:
            input_tensor: Preprocessed input tensor
            probabilities: Disease probabilities
            original_image: Original image
            disease_labels: Disease names
            top_k: Number of top diseases to include

        Returns:
            Combined heatmap overlay image (H, W, 3), uint8
        """
        top_indices = np.argsort(probabilities)[::-1][:top_k]
        h, w = original_image.shape[:2]

        combined_cam = np.zeros((h, w), dtype=np.float32)
        total_weight = 0

        for idx in top_indices:
            if probabilities[idx] < 0.05:
                continue

            targets = [ClassifierOutputTarget(int(idx))]
            grayscale_cam = self.cam(input_tensor=input_tensor, targets=targets)
            grayscale_cam = cv2.resize(grayscale_cam[0], (w, h))

            weight = probabilities[idx]
            combined_cam += weight * grayscale_cam
            total_weight += weight

        if total_weight > 0:
            combined_cam /= total_weight

        # Normalize
        combined_cam = np.clip(combined_cam, 0, 1)

        img_normalized = original_image.astype(np.float32) / 255.0
        overlay = show_cam_on_image(img_normalized, combined_cam, use_rgb=True)

        return overlay


def heatmap_to_base64(heatmap: np.ndarray) -> str:
    """
    Convert heatmap numpy array to base64-encoded PNG string.

    Args:
        heatmap: Image array (H, W, 3), uint8, RGB

    Returns:
        Base64-encoded PNG string
    """
    img = Image.fromarray(heatmap)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
