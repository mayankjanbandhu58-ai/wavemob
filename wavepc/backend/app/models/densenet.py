"""
DenseNet121 Multi-Label Classifier for Chest X-Ray Analysis

Medical imaging backbone widely validated in CheXNet and related literature.
Pretrained on ImageNet, fine-tuned on NIH ChestX-ray14.
Includes dropout before final layer to support Monte Carlo Dropout inference.
"""

import torch
import torch.nn as nn
from torchvision import models


class DenseNet121Classifier(nn.Module):
    """
    DenseNet121-based multi-label classifier.

    Architecture:
        - DenseNet121 feature extractor (pretrained ImageNet)
        - Adaptive average pooling → 1024 features
        - Dropout (configurable rate)
        - Linear → num_classes logits (no sigmoid; use BCEWithLogitsLoss)
    """

    def __init__(self, num_classes: int = 8, dropout: float = 0.3, pretrained: bool = True):
        super().__init__()
        self.model_name = "densenet121"

        # Load pretrained DenseNet121
        weights = models.DenseNet121_Weights.IMAGENET1K_V1 if pretrained else None
        base_model = models.densenet121(weights=weights)

        # Extract feature layers (everything except the final classifier)
        self.features = base_model.features
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.dropout = nn.Dropout(p=dropout)

        # Custom classifier head for multi-label classification
        in_features = base_model.classifier.in_features  # 1024
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
        features = torch.relu(features)
        features = self.pool(features)
        features = features.view(features.size(0), -1)
        features = self.dropout(features)
        logits = self.classifier(features)
        return logits

    def get_features(self, x: torch.Tensor) -> torch.Tensor:
        """Extract feature maps before pooling (for Grad-CAM)."""
        return self.features(x)

    def get_embeddings(self, x: torch.Tensor) -> torch.Tensor:
        """Extract 1024-d pooled feature embeddings for cosine similarity search."""
        features = self.features(x)
        features = torch.relu(features)
        features = self.pool(features)
        features = features.view(features.size(0), -1)
        return features

    def get_last_conv_layer(self) -> nn.Module:
        """Return last convolutional layer for Grad-CAM++ targeting."""
        return self.features.denseblock4


def build_densenet121(num_classes: int = 8, dropout: float = 0.3, pretrained: bool = True) -> DenseNet121Classifier:
    """Factory function to create a DenseNet121 classifier."""
    return DenseNet121Classifier(
        num_classes=num_classes,
        dropout=dropout,
        pretrained=pretrained,
    )
