"""
NIH ChestX-ray14 Dataset Loader

Implements:
- Patient-level train/val/test split to prevent data leakage
- Multi-label encoding for 8 target conditions
- Class weight computation for imbalanced labels
- Configurable augmentations
"""

import logging
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import torch
from PIL import Image
from sklearn.model_selection import GroupShuffleSplit
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

from training.config import (
    BATCH_SIZE,
    DATA_DIR,
    DISEASE_LABELS,
    IMAGE_SIZE,
    LABELS_CSV,
    NUM_CLASSES,
    NUM_WORKERS,
    PIXEL_MEAN,
    PIXEL_STD,
    RANDOM_SEED,
    SPLIT_RATIOS,
)

logger = logging.getLogger("wavelength.dataset")


class ChestXrayDataset(Dataset):
    """
    NIH ChestX-ray14 multi-label dataset.

    Each sample returns:
        - image: Tensor (3, 224, 224)
        - labels: Tensor (8,) multi-hot encoded
        - filename: str
    """

    def __init__(
        self,
        dataframe: pd.DataFrame,
        image_dir: Path,
        transform: Optional[transforms.Compose] = None,
        disease_labels: List[str] = DISEASE_LABELS,
    ):
        self.df = dataframe.reset_index(drop=True)
        self.image_dir = Path(image_dir)
        self.transform = transform
        self.disease_labels = disease_labels

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int):
        row = self.df.iloc[idx]

        # Load image
        img_path = self.image_dir / row["Image Index"]
        try:
            image = Image.open(img_path).convert("RGB")
        except Exception as e:
            logger.warning(f"Failed to load {img_path}: {e}")
            # Return a blank image as fallback
            image = Image.new("RGB", (IMAGE_SIZE, IMAGE_SIZE), (0, 0, 0))

        if self.transform:
            image = self.transform(image)

        # Multi-hot label encoding
        labels = torch.zeros(len(self.disease_labels), dtype=torch.float32)
        findings = str(row["Finding Labels"]).split("|")
        for i, disease in enumerate(self.disease_labels):
            if disease in findings:
                labels[i] = 1.0

        return image, labels, row["Image Index"]


def get_transforms(split: str = "train") -> transforms.Compose:
    """
    Get data augmentation transforms.

    Train: augmentations for robustness
    Val/Test: only resize and normalize
    """
    if split == "train":
        return transforms.Compose([
            transforms.Resize((IMAGE_SIZE + 32, IMAGE_SIZE + 32)),
            transforms.RandomCrop((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(degrees=10),
            transforms.ColorJitter(brightness=0.1, contrast=0.1),
            transforms.ToTensor(),
            transforms.Normalize(mean=PIXEL_MEAN, std=PIXEL_STD),
        ])
    else:
        return transforms.Compose([
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(mean=PIXEL_MEAN, std=PIXEL_STD),
        ])


def load_and_split_data(
    labels_csv: Path = LABELS_CSV,
    split_ratios: Tuple[float, float, float] = SPLIT_RATIOS,
    seed: int = RANDOM_SEED,
    max_samples: Optional[int] = None,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Load dataset and create patient-level train/val/test splits.

    CRITICAL: Split by Patient ID to prevent data leakage.
    Images from the same patient must stay in the same split.

    Args:
        labels_csv: Path to Data_Entry_2017.csv
        split_ratios: (train, val, test) ratios
        seed: Random seed for reproducibility
        max_samples: Optional cap on total samples

    Returns:
        Tuple of (train_df, val_df, test_df)
    """
    logger.info(f"Loading labels from {labels_csv}")
    df = pd.read_csv(labels_csv)

    # Filter to images containing at least one of our 8 target diseases + No Finding
    target_diseases = set(DISEASE_LABELS)

    def has_target_disease(finding_str: str) -> bool:
        findings = set(finding_str.split("|"))
        return bool(findings & target_diseases) or finding_str == "No Finding"

    df = df[df["Finding Labels"].apply(has_target_disease)].copy()

    if max_samples and len(df) > max_samples:
        df = df.sample(n=max_samples, random_state=seed).reset_index(drop=True)

    logger.info(f"Filtered dataset: {len(df)} images")

    # Extract patient ID from filename (format: XXXXX_YYY.png → patient XXXXX)
    df["Patient ID"] = df["Image Index"].apply(lambda x: int(x.split("_")[0]))

    # Patient-level split to prevent data leakage
    train_ratio, val_ratio, test_ratio = split_ratios

    # First split: train+val vs test
    gss1 = GroupShuffleSplit(n_splits=1, test_size=test_ratio, random_state=seed)
    train_val_idx, test_idx = next(gss1.split(df, groups=df["Patient ID"]))

    train_val_df = df.iloc[train_val_idx]
    test_df = df.iloc[test_idx]

    # Second split: train vs val
    val_relative = val_ratio / (train_ratio + val_ratio)
    gss2 = GroupShuffleSplit(n_splits=1, test_size=val_relative, random_state=seed)
    train_idx, val_idx = next(gss2.split(train_val_df, groups=train_val_df["Patient ID"]))

    train_df = train_val_df.iloc[train_idx]
    val_df = train_val_df.iloc[val_idx]

    # Verify no patient leakage
    train_patients = set(train_df["Patient ID"])
    val_patients = set(val_df["Patient ID"])
    test_patients = set(test_df["Patient ID"])

    assert len(train_patients & val_patients) == 0, "LEAKAGE: Train-Val patient overlap!"
    assert len(train_patients & test_patients) == 0, "LEAKAGE: Train-Test patient overlap!"
    assert len(val_patients & test_patients) == 0, "LEAKAGE: Val-Test patient overlap!"

    logger.info(f"Split sizes — Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
    logger.info(f"Patients — Train: {len(train_patients)}, Val: {len(val_patients)}, Test: {len(test_patients)}")

    return train_df, val_df, test_df


def compute_class_weights(df: pd.DataFrame) -> torch.Tensor:
    """
    Compute pos_weight for BCEWithLogitsLoss to handle class imbalance.

    pos_weight[i] = num_negative[i] / num_positive[i]

    Args:
        df: Training dataframe

    Returns:
        pos_weight tensor of shape (num_classes,)
    """
    total = len(df)
    pos_counts = np.zeros(NUM_CLASSES)

    for _, row in df.iterrows():
        findings = str(row["Finding Labels"]).split("|")
        for i, disease in enumerate(DISEASE_LABELS):
            if disease in findings:
                pos_counts[i] += 1

    neg_counts = total - pos_counts

    # Compute pos_weight with smoothing to avoid extreme values
    pos_weight = neg_counts / (pos_counts + 1e-5)

    # Cap extreme weights
    pos_weight = np.clip(pos_weight, 1.0, 50.0)

    logger.info("Class weights (pos_weight):")
    for i, label in enumerate(DISEASE_LABELS):
        logger.info(f"  {label}: {pos_weight[i]:.2f} (pos={int(pos_counts[i])}, neg={int(neg_counts[i])})")

    return torch.tensor(pos_weight, dtype=torch.float32)


def create_dataloaders(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    image_dir: Path,
    batch_size: int = BATCH_SIZE,
    num_workers: int = NUM_WORKERS,
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Create DataLoaders for train/val/test splits.

    Args:
        train_df, val_df, test_df: Split dataframes
        image_dir: Directory containing images
        batch_size: Batch size
        num_workers: Number of data loading workers

    Returns:
        Tuple of (train_loader, val_loader, test_loader)
    """
    train_dataset = ChestXrayDataset(train_df, image_dir, transform=get_transforms("train"))
    val_dataset = ChestXrayDataset(val_df, image_dir, transform=get_transforms("val"))
    test_dataset = ChestXrayDataset(test_df, image_dir, transform=get_transforms("test"))

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True,
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    return train_loader, val_loader, test_loader
