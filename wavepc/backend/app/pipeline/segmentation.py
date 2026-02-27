"""
U-Net Lung Segmentation Module

Uses a pretrained U-Net (ResNet34 encoder) from segmentation-models-pytorch
to generate binary lung masks. Applied as a preprocessing step before
classification to focus the model on relevant lung regions.
"""

import logging
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

logger = logging.getLogger("wavelength.segmentation")

# Segmentation model singleton
_seg_model = None
_seg_device = None


def _load_segmentation_model(weights_path: Optional[Path] = None, device: str = "cuda") -> torch.nn.Module:
    """
    Load pretrained U-Net segmentation model.

    Uses segmentation-models-pytorch with ResNet34 encoder.
    If no weights are provided, uses encoder pretrained on ImageNet
    and we rely on fine-tuned weights for lung segmentation.
    """
    import segmentation_models_pytorch as smp

    model = smp.Unet(
        encoder_name="resnet34",
        encoder_weights="imagenet",
        in_channels=3,
        classes=1,
        activation=None,  # raw logits
    )

    if weights_path and weights_path.exists():
        logger.info(f"Loading segmentation weights from {weights_path}")
        state_dict = torch.load(weights_path, map_location=device, weights_only=True)
        model.load_state_dict(state_dict)
    else:
        logger.warning("No fine-tuned segmentation weights found. Using ImageNet encoder only.")

    model = model.to(device)
    model.eval()
    return model


def get_segmentation_model(weights_path: Optional[Path] = None, device: str = "cuda") -> torch.nn.Module:
    """Get or initialize the singleton segmentation model."""
    global _seg_model, _seg_device
    if _seg_model is None or _seg_device != device:
        _seg_model = _load_segmentation_model(weights_path, device)
        _seg_device = device
    return _seg_model


def segment_lungs(
    image: np.ndarray,
    model: Optional[torch.nn.Module] = None,
    device: str = "cuda",
    threshold: float = 0.5,
) -> np.ndarray:
    """
    Generate binary lung segmentation mask.

    Args:
        image: Input chest X-ray as numpy array (H, W, 3), uint8
        model: Optional pre-loaded segmentation model
        device: Compute device
        threshold: Binarization threshold for mask

    Returns:
        Binary mask of shape (H, W), values in {0, 1}, float32
    """
    if model is None:
        model = get_segmentation_model(device=device)

    original_h, original_w = image.shape[:2]

    # Preprocess: resize to 256x256, normalize
    img_resized = cv2.resize(image, (256, 256), interpolation=cv2.INTER_LINEAR)
    img_float = img_resized.astype(np.float32) / 255.0

    # Convert to tensor (B, C, H, W)
    tensor = torch.from_numpy(img_float).permute(2, 0, 1).unsqueeze(0).to(device)

    # Inference
    with torch.no_grad():
        logits = model(tensor)
        mask = torch.sigmoid(logits).squeeze().cpu().numpy()

    # Binarize
    mask = (mask > threshold).astype(np.float32)

    # Resize back to original dimensions
    mask = cv2.resize(mask, (original_w, original_h), interpolation=cv2.INTER_NEAREST)

    return mask


def apply_lung_mask(image: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """
    Apply lung segmentation mask to image.

    Non-lung regions are darkened (not zeroed) to maintain some context
    while focusing the classifier on lung regions.

    Args:
        image: Original chest X-ray (H, W, 3), uint8
        mask: Binary lung mask (H, W), float32

    Returns:
        Masked image (H, W, 3), uint8
    """
    # Expand mask to 3 channels
    mask_3ch = np.stack([mask] * 3, axis=-1)

    # Darken non-lung regions (keep 15% of original intensity)
    masked = image.astype(np.float32) * (mask_3ch * 0.85 + 0.15)
    masked = np.clip(masked, 0, 255).astype(np.uint8)

    return masked


def create_segmentation_overlay(
    image: np.ndarray,
    mask: np.ndarray,
    color: tuple = (0, 120, 255),
    alpha: float = 0.3,
) -> np.ndarray:
    """
    Create visualization overlay of segmentation mask on image.

    Args:
        image: Original image (H, W, 3), uint8
        mask: Binary mask (H, W), float32
        color: Overlay color (B, G, R)
        alpha: Transparency

    Returns:
        Overlay image (H, W, 3), uint8
    """
    overlay = image.copy()
    mask_bool = mask > 0.5

    colored_mask = np.zeros_like(image)
    colored_mask[mask_bool] = color

    overlay = cv2.addWeighted(overlay, 1.0, colored_mask, alpha, 0)
    return overlay
