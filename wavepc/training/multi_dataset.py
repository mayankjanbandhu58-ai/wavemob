"""
Multi-Dataset Loader

Combines multiple chest X-ray datasets into a unified training corpus
for maximum data diversity and model robustness.

Supported Datasets:
- NIH ChestX-ray14 (112K images, 14 diseases)
- NIH ChestX-ray14 224x224 Resized (same, pre-resized)
- Chest X-Ray Images (Pneumonia) — binary classification
- Chest X-ray 17 Diseases
- CoronaHack Chest X-Ray
- Pulmonary Chest X-Ray Abnormalities
- Tuberculosis (TB) Chest X-ray Database
- Chest X-Ray Masks and Labels (segmentation)
"""

import logging
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from PIL import Image

logger = logging.getLogger("wavelength.multi_dataset")

# Our unified 8-disease label set
UNIFIED_LABELS = [
    "Atelectasis",
    "Cardiomegaly",
    "Effusion",
    "Infiltration",
    "Mass",
    "Nodule",
    "Pneumonia",
    "Pneumothorax",
]


def discover_datasets(data_dir: Path) -> Dict[str, Path]:
    """
    Auto-discover extracted datasets in data/.

    Uses actual extracted folder names from Kaggle downloads.
    Returns dict mapping dataset_name → directory path.
    """
    datasets = {}

    # Map known folder names to dataset identifiers
    known_mappings = {
        # NIH resized 224x224 — images are inside images/images-224/images-224/
        "images": "nih_resized",
        "images-224": "nih_resized",
        # Pneumonia binary classification
        "chest_xray": "pneumonia",
        # CoronaHack
        "Coronahack-Chest-XRay-Dataset": "coronahack",
        # TB datasets
        "TB_Chest_Radiography_Database": "tb",
        "Montgomery": "tb_montgomery",
        "ChinaSet_AllFiles": "tb_china",
        # Lung segmentation masks
        "Lung Segmentation": "masks",
        # 17-diseases (often extracted to 'data/data/')
        "data": "17diseases",
        "files": "17diseases_files",
    }

    for entry in data_dir.iterdir():
        if not entry.is_dir():
            continue

        # Check exact match first
        if entry.name in known_mappings:
            key = known_mappings[entry.name]
            # Avoid overwriting nih_resized if we already found it
            if key not in datasets:
                datasets[key] = entry
            continue

        # Fuzzy matching fallback
        name_lower = entry.name.lower()
        if "224" in name_lower or "resized" in name_lower:
            datasets.setdefault("nih_resized", entry)
        elif "pneumonia" in name_lower:
            datasets.setdefault("pneumonia", entry)
        elif "corona" in name_lower or "hack" in name_lower:
            datasets.setdefault("coronahack", entry)
        elif "pulmonary" in name_lower or "abnormalit" in name_lower:
            datasets.setdefault("pulmonary", entry)
        elif "tb" in name_lower or "tuberculosis" in name_lower:
            datasets.setdefault("tb", entry)
        elif "mask" in name_lower or "segmentation" in name_lower:
            datasets.setdefault("masks", entry)
        elif "17" in name_lower and "disease" in name_lower:
            datasets.setdefault("17diseases", entry)

    # Check for NIH full dataset (images_001 through images_012)
    nih_image_dirs = sorted(data_dir.glob("images_0*"))
    if nih_image_dirs:
        datasets["nih_full_dirs"] = nih_image_dirs  # Special: list of dirs

    logger.info(f"Discovered {len(datasets)} datasets: {list(datasets.keys())}")
    return datasets


def find_images_recursive(directory: Path, extensions=(".png", ".jpg", ".jpeg")) -> List[Path]:
    """Find all image files recursively."""
    images = []
    for ext in extensions:
        images.extend(directory.rglob(f"*{ext}"))
    return sorted(images)


def find_csv_files(directory: Path) -> List[Path]:
    """Find all CSV files in directory tree."""
    return sorted(directory.rglob("*.csv"))


def load_nih_dataset(dataset_dir: Path, data_dir: Path) -> pd.DataFrame:
    """
    Load NIH ChestX-ray14 dataset with labels.

    The images may be in:
    - data/images/ (resized 224x224 version)
    - data/images_001/ through data/images_012/ (full version)
    - Or nested within the dataset_dir

    CSV is typically at data/Data_Entry_2017.csv
    """
    # Find labels CSV — check data root first, then dataset dir
    csv_path = data_dir / "Data_Entry_2017.csv"
    if not csv_path.exists():
        csv_candidates = list(data_dir.rglob("Data_Entry*.csv"))
        if csv_candidates:
            csv_path = csv_candidates[0]
        else:
            logger.warning("NIH labels CSV not found")
            return pd.DataFrame()

    logger.info(f"Loading NIH labels from {csv_path}")
    df = pd.read_csv(csv_path)
    logger.info(f"  CSV has {len(df)} entries")

    # Build image lookup — check multiple possible locations
    image_dirs = []
    
    # Primary: data/images/ (resized version)
    imgs_dir = data_dir / "images"
    if imgs_dir.exists():
        image_dirs.append(imgs_dir)
        # Check for nested structure: images/images-224/images-224/
        for sub in imgs_dir.rglob("images*"):
            if sub.is_dir():
                image_dirs.append(sub)

    # Secondary: data/images_001/ through data/images_012/
    for d in sorted(data_dir.glob("images_0*")):
        if d.is_dir():
            image_dirs.append(d)
            # NIH structure: images_001/images/
            inner = d / "images"
            if inner.exists():
                image_dirs.append(inner)

    if not image_dirs:
        image_dirs = [dataset_dir]

    logger.info(f"  Searching {len(image_dirs)} image directories")

    # Build a fast lookup: filename → full path
    image_index = {}
    for img_dir in image_dirs:
        for img in img_dir.glob("*.png"):
            image_index[img.name] = img
        for img in img_dir.glob("*.jpg"):
            image_index[img.name] = img

    logger.info(f"  Found {len(image_index)} images in lookup")

    # Build unified dataframe
    rows = []
    missing = 0
    for _, row in df.iterrows():
        img_name = row["Image Index"]
        findings = str(row["Finding Labels"])

        img_path = image_index.get(img_name)
        if img_path is None:
            missing += 1
            continue

        labels = {label: 0 for label in UNIFIED_LABELS}
        for label in UNIFIED_LABELS:
            if label in findings:
                labels[label] = 1

        # Skip "No Finding" only rows (add back controlled amount below)
        if sum(labels.values()) == 0:
            continue

        rows.append({"filepath": str(img_path), "source": "nih", **labels})

    # Add controlled amount of "No Finding" samples (20% of positive samples)
    no_finding_count = 0
    max_negative = int(len(rows) * 0.25)
    for _, row in df.iterrows():
        if no_finding_count >= max_negative:
            break
        findings = str(row["Finding Labels"])
        if "No Finding" in findings:
            img_name = row["Image Index"]
            img_path = image_index.get(img_name)
            if img_path is None:
                continue
            labels = {label: 0 for label in UNIFIED_LABELS}
            rows.append({"filepath": str(img_path), "source": "nih", **labels})
            no_finding_count += 1

    if missing > 0:
        logger.info(f"  Skipped {missing} entries with missing images")

    result = pd.DataFrame(rows)
    logger.info(f"NIH dataset: {len(result)} samples ({len(result)-no_finding_count} positive, {no_finding_count} negative)")
    return result


def load_pneumonia_dataset(dataset_dir: Path) -> pd.DataFrame:
    """Load Chest X-Ray Images (Pneumonia) — binary pneumonia classification."""
    rows = []

    for split in ["train", "test", "val"]:
        for category in ["NORMAL", "PNEUMONIA"]:
            cat_dir = dataset_dir / split / category
            if not cat_dir.exists():
                # Try nested structure
                for sub in dataset_dir.rglob(split):
                    alt = sub / category
                    if alt.exists():
                        cat_dir = alt
                        break

            if not cat_dir.exists():
                continue

            for img_path in find_images_recursive(cat_dir):
                labels = {label: 0 for label in UNIFIED_LABELS}
                if category == "PNEUMONIA":
                    labels["Pneumonia"] = 1
                    # Detect bacterial vs viral from filename
                    if "bacteria" in img_path.name.lower():
                        labels["Infiltration"] = 1
                rows.append({"filepath": str(img_path), "source": "pneumonia", **labels})

    result = pd.DataFrame(rows)
    logger.info(f"Pneumonia dataset: {len(result)} samples")
    return result


def load_coronahack_dataset(dataset_dir: Path) -> pd.DataFrame:
    """Load CoronaHack Chest X-Ray Dataset."""
    rows = []

    csv_files = find_csv_files(dataset_dir)
    if csv_files:
        df = pd.read_csv(csv_files[0])
        img_dirs = [d for d in dataset_dir.rglob("*") if d.is_dir() and any(d.glob("*.png")) or any(d.glob("*.jpg"))]
        img_root = img_dirs[0] if img_dirs else dataset_dir

        for _, row in df.iterrows():
            img_name = str(row.get("X_ray_image_name", row.get("Filename", "")))
            if not img_name:
                continue

            img_path = img_root / img_name
            if not img_path.exists():
                matches = list(dataset_dir.rglob(img_name))
                if matches:
                    img_path = matches[0]
                else:
                    continue

            labels = {label: 0 for label in UNIFIED_LABELS}
            label_str = str(row.get("Label", "")).lower()
            if "pneumonia" in label_str:
                labels["Pneumonia"] = 1
            if "virus" in str(row.get("Label_2_Virus_category", "")).lower():
                labels["Infiltration"] = 1

            rows.append({"filepath": str(img_path), "source": "coronahack", **labels})
    else:
        # No CSV, classify by folder structure
        for img_path in find_images_recursive(dataset_dir):
            labels = {label: 0 for label in UNIFIED_LABELS}
            if "pneumonia" in str(img_path).lower():
                labels["Pneumonia"] = 1
            rows.append({"filepath": str(img_path), "source": "coronahack", **labels})

    result = pd.DataFrame(rows)
    logger.info(f"CoronaHack dataset: {len(result)} samples")
    return result


def load_tb_dataset(dataset_dir: Path) -> pd.DataFrame:
    """Load TB Chest X-ray Database."""
    rows = []

    for img_path in find_images_recursive(dataset_dir):
        labels = {label: 0 for label in UNIFIED_LABELS}
        path_str = str(img_path).lower()

        # TB manifests as infiltrations and nodules in chest X-rays
        if "tuberculosis" in path_str or "tb" in path_str or "positive" in path_str:
            labels["Infiltration"] = 1
            labels["Nodule"] = 1

        rows.append({"filepath": str(img_path), "source": "tb", **labels})

    result = pd.DataFrame(rows)
    logger.info(f"TB dataset: {len(result)} samples")
    return result


def load_pulmonary_dataset(dataset_dir: Path) -> pd.DataFrame:
    """Load Pulmonary Chest X-Ray Abnormalities dataset."""
    rows = []

    csv_files = find_csv_files(dataset_dir)
    if csv_files:
        for csv_path in csv_files:
            try:
                df = pd.read_csv(csv_path)
                # Different CSVs may have different formats
                img_col = None
                for col in ["filename", "image", "img", "file", "path"]:
                    matches = [c for c in df.columns if col in c.lower()]
                    if matches:
                        img_col = matches[0]
                        break

                if not img_col:
                    continue

                for _, row in df.iterrows():
                    img_name = str(row[img_col])
                    matches = list(dataset_dir.rglob(img_name))
                    if not matches:
                        continue
                    img_path = matches[0]

                    labels = {label: 0 for label in UNIFIED_LABELS}
                    row_str = " ".join(str(v).lower() for v in row.values)

                    for disease in UNIFIED_LABELS:
                        if disease.lower() in row_str:
                            labels[disease] = 1

                    # General abnormality detection
                    if "abnormal" in row_str or "positive" in row_str:
                        if sum(labels.values()) == 0:
                            labels["Infiltration"] = 1

                    rows.append({"filepath": str(img_path), "source": "pulmonary", **labels})
            except Exception as e:
                logger.warning(f"Error reading {csv_path}: {e}")
    else:
        for img_path in find_images_recursive(dataset_dir):
            labels = {label: 0 for label in UNIFIED_LABELS}
            path_str = str(img_path).lower()
            if "abnormal" in path_str:
                labels["Infiltration"] = 1
            rows.append({"filepath": str(img_path), "source": "pulmonary", **labels})

    result = pd.DataFrame(rows)
    logger.info(f"Pulmonary dataset: {len(result)} samples")
    return result


def load_17diseases_dataset(dataset_dir: Path) -> pd.DataFrame:
    """Load Chest X-ray 17 Diseases dataset."""
    rows = []

    # Map 17-disease labels to our 8 unified labels
    label_mapping = {
        "atelectasis": "Atelectasis",
        "cardiomegaly": "Cardiomegaly",
        "effusion": "Effusion",
        "pleural_effusion": "Effusion",
        "infiltration": "Infiltration",
        "mass": "Mass",
        "nodule": "Nodule",
        "pneumonia": "Pneumonia",
        "pneumothorax": "Pneumothorax",
        "consolidation": "Pneumonia",
        "edema": "Effusion",
        "emphysema": "Infiltration",
        "fibrosis": "Infiltration",
        "hernia": "Mass",
        "pleural_thickening": "Effusion",
    }

    # Try folder-based classification
    for subdir in dataset_dir.iterdir():
        if not subdir.is_dir():
            continue

        disease_name = subdir.name.lower().replace(" ", "_").replace("-", "_")
        mapped_labels = set()

        for key, unified in label_mapping.items():
            if key in disease_name:
                mapped_labels.add(unified)

        for img_path in find_images_recursive(subdir):
            labels = {label: 0 for label in UNIFIED_LABELS}
            for mapped in mapped_labels:
                labels[mapped] = 1
            rows.append({"filepath": str(img_path), "source": "17diseases", **labels})

    # Fallback: check for CSV
    if not rows:
        csv_files = find_csv_files(dataset_dir)
        for csv_path in csv_files:
            try:
                df = pd.read_csv(csv_path)
                for _, row in df.iterrows():
                    row_str = " ".join(str(v).lower() for v in row.values)
                    labels = {label: 0 for label in UNIFIED_LABELS}
                    for key, unified in label_mapping.items():
                        if key in row_str:
                            labels[unified] = 1
                    # Find the image
                    for col in df.columns:
                        if any(ext in str(row[col]).lower() for ext in [".png", ".jpg", ".jpeg"]):
                            matches = list(dataset_dir.rglob(str(row[col])))
                            if matches:
                                rows.append({"filepath": str(matches[0]), "source": "17diseases", **labels})
                            break
            except Exception:
                pass

    result = pd.DataFrame(rows)
    logger.info(f"17-Diseases dataset: {len(result)} samples")
    return result


def build_unified_dataset(data_dir: Path) -> pd.DataFrame:
    """
    Build a single unified DataFrame from all available datasets.

    Returns DataFrame with columns:
        filepath, source, Atelectasis, Cardiomegaly, Effusion,
        Infiltration, Mass, Nodule, Pneumonia, Pneumothorax
    """
    datasets = discover_datasets(data_dir)
    all_dfs = []

    # Prefer resized NIH (224x224) over full NIH to save disk/time
    if "nih_resized" in datasets:
        df = load_nih_dataset(datasets["nih_resized"], data_dir)
        if not df.empty:
            all_dfs.append(df)
    elif "nih_full" in datasets:
        df = load_nih_dataset(datasets["nih_full"], data_dir)
        if not df.empty:
            all_dfs.append(df)

    if "pneumonia" in datasets:
        df = load_pneumonia_dataset(datasets["pneumonia"])
        if not df.empty:
            all_dfs.append(df)

    if "coronahack" in datasets:
        df = load_coronahack_dataset(datasets["coronahack"])
        if not df.empty:
            all_dfs.append(df)

    if "tb" in datasets:
        df = load_tb_dataset(datasets["tb"])
        if not df.empty:
            all_dfs.append(df)

    if "pulmonary" in datasets:
        df = load_pulmonary_dataset(datasets["pulmonary"])
        if not df.empty:
            all_dfs.append(df)

    if "17diseases" in datasets:
        df = load_17diseases_dataset(datasets["17diseases"])
        if not df.empty:
            all_dfs.append(df)

    if not all_dfs:
        logger.error("No datasets loaded!")
        return pd.DataFrame()

    combined = pd.concat(all_dfs, ignore_index=True)

    # Validate: remove rows with missing images
    valid_mask = combined["filepath"].apply(lambda p: Path(p).exists())
    valid_count = valid_mask.sum()
    combined = combined[valid_mask].reset_index(drop=True)

    logger.info(f"\n{'='*60}")
    logger.info(f"  UNIFIED DATASET SUMMARY")
    logger.info(f"{'='*60}")
    logger.info(f"  Total samples:  {len(combined)}")
    logger.info(f"  Valid images:   {valid_count}")
    logger.info(f"\n  Per-source breakdown:")
    for src, count in combined["source"].value_counts().items():
        logger.info(f"    {src:20s}: {count:>8,}")
    logger.info(f"\n  Per-disease positive counts:")
    for label in UNIFIED_LABELS:
        pos = combined[label].sum()
        logger.info(f"    {label:20s}: {pos:>8,} ({pos/len(combined)*100:.1f}%)")
    logger.info(f"{'='*60}\n")

    return combined


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    logging.basicConfig(level=logging.INFO, format="%(asctime)s │ %(levelname)-8s │ %(message)s")

    from backend.app.config import DATA_DIR
    df = build_unified_dataset(DATA_DIR)
    if not df.empty:
        df.to_csv(DATA_DIR / "unified_dataset.csv", index=False)
        print(f"\nSaved unified dataset: {len(df)} samples → data/unified_dataset.csv")
