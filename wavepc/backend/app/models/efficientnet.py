"""
EfficientNetV2-S Multi-Label Classifier for Chest X-Ray Analysis

Complementary architecture to DenseNet121 for ensemble diversity.
EfficientNetV2-S offers strong accuracy with efficient compute.
Pretrained on ImageNet, fine-tuned on NIH ChestX-ray14.
"""

import torch
import torch.nn as nn
from torchvision import models


class EfficientNetV2SClassifier(nn.Module):
    """
    EfficientNetV2-S-based multi-label classifier.

    Architecture:
        - EfficientNetV2-S feature extractor (pretrained ImageNet)
        - Adaptive average pooling → 1280 features
        - Dropout (configurable rate)
        - Linear → num_classes logits
    """

    def __init__(self, num_classes: int = 8, dropout: float = 0.3, pretrained: bool = True):
        super().__init__()
        self.model_name = "efficientnet_v2_s"

        # Load pretrained EfficientNetV2-S
        weights = models.EfficientNet_V2_S_Weights.IMAGENET1K_V1 if pretrained else None
        base_model = models.efficientnet_v2_s(weights=weights)

        # Extract feature backbone
        self.features = base_model.features
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.dropout = nn.Dropout(p=dropout)

        # Custom classifier head
        in_features = base_model.classifier[-1].in_features  # 1280
        self.classifier = nn.Linear(in_features, num_classes)

        # Initialize classifier weights
        nn.init.xavier_uniform_(self.classifier.weight)
        nn.init.zeros_(self.classifier.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Args:
            x: Input tensor of shape (B, 3, 224, 224)

        Returns:
            Logits tensor of shape (B, num_classes) — raw, uncalibrated
        """
        features = self.features(x)
        features = self.pool(features)
        features = features.view(features.size(0), -1)
        features = self.dropout(features)
        logits = self.classifier(features)
        return logits

    def get_features(self, x: torch.Tensor) -> torch.Tensor:
        """Extract feature maps before pooling (for Grad-CAM)."""
        return self.features(x)

    def get_last_conv_layer(self) -> nn.Module:
        """Return last convolutional layer for Grad-CAM++ targeting."""
        return self.features[-1]


def build_efficientnet_v2_s(num_classes: int = 8, dropout: float = 0.3, pretrained: bool = True) -> EfficientNetV2SClassifier:
    """Factory function to create an EfficientNetV2-S classifier."""
    return EfficientNetV2SClassifier(
        num_classes=num_classes,
        dropout=dropout,
        pretrained=pretrained,
    )
