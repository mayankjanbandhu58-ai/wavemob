"""
Image Utilities

Loading, validation, and preprocessing of chest X-ray images.
"""

import io
import logging
from pathlib import Path
from typing import Optional, Tuple, Union

import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from app.config import IMAGE_SIZE, PIXEL_MEAN, PIXEL_STD

logger = logging.getLogger("wavelength.image_utils")

# Standard preprocessing transform for inference
INFERENCE_TRANSFORM = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=PIXEL_MEAN, std=PIXEL_STD),
])


def load_image(source: Union[str, Path, bytes, io.BytesIO]) -> np.ndarray:
    """
    Load image from various sources into numpy array.

    Args:
        source: File path, raw bytes, or BytesIO object

    Returns:
        Image as numpy array (H, W, 3), uint8, RGB

    Raises:
        ValueError: If image cannot be loaded or is invalid
    """
    try:
        if isinstance(source, (str, Path)):
            img = Image.open(source)
        elif isinstance(source, bytes):
            img = Image.open(io.BytesIO(source))
        elif isinstance(source, io.BytesIO):
            img = Image.open(source)
        else:
            raise ValueError(f"Unsupported source type: {type(source)}")

        # Convert to RGB (handles grayscale, RGBA, etc.)
        img = img.convert("RGB")
        return np.array(img)

    except Exception as e:
        raise ValueError(f"Failed to load image: {e}")


def validate_image(image_bytes: bytes, max_size_mb: float = 20.0) -> Tuple[bool, str]:
    """
    Validate uploaded image.

    Checks:
        - File size within limits
        - Valid image format
        - Reasonable dimensions
        - Not corrupted

    Args:
        image_bytes: Raw image bytes
        max_size_mb: Maximum file size in MB

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check file size
    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > max_size_mb:
        return False, f"Image too large: {size_mb:.1f}MB (max {max_size_mb}MB)"

    if len(image_bytes) < 100:
        return False, "Image file too small, likely corrupted"

    # Try loading
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()

        # Reload after verify
        img = Image.open(io.BytesIO(image_bytes))
        w, h = img.size

        if w < 50 or h < 50:
            return False, f"Image too small: {w}x{h} (minimum 50x50)"

        if w > 10000 or h > 10000:
            return False, f"Image too large: {w}x{h} (maximum 10000x10000)"

        return True, "OK"

    except Exception as e:
        return False, f"Invalid image: {e}"


def preprocess_for_inference(
    image: np.ndarray,
    transform: Optional[transforms.Compose] = None,
) -> torch.Tensor:
    """
    Preprocess image for model inference.

    Args:
        image: Input image (H, W, 3), uint8, RGB
        transform: Optional custom transform

    Returns:
        Tensor of shape (1, 3, 224, 224), normalized
    """
    if transform is None:
        transform = INFERENCE_TRANSFORM

    pil_img = Image.fromarray(image)
    tensor = transform(pil_img).unsqueeze(0)  # Add batch dim
    return tensor


def image_to_base64(image: np.ndarray, format: str = "PNG") -> str:
    """Convert numpy image to base64 string."""
    import base64
    pil_img = Image.fromarray(image)
    buffer = io.BytesIO()
    pil_img.save(buffer, format=format)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
