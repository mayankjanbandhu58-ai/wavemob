"""
Dataset Download Script

Downloads the NIH ChestX-ray14 dataset from Kaggle.
Handles credential setup, download, extraction, and validation.
"""

import json
import os
import sys
from pathlib import Path

# Add project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def setup_kaggle_credentials():
    """Ensure Kaggle API credentials are configured."""
    kaggle_dir = Path.home() / ".kaggle"
    kaggle_json = kaggle_dir / "kaggle.json"

    if kaggle_json.exists():
        print(f"✓ Kaggle credentials found at {kaggle_json}")
        return True

    print("=" * 60)
    print("  Kaggle API credentials required")
    print("=" * 60)
    print()
    print("To download the NIH ChestX-ray14 dataset, you need Kaggle API credentials.")
    print("1. Go to https://www.kaggle.com/settings")
    print("2. Scroll down to 'API' section")
    print("3. Click 'Create New API Token'")
    print("4. Download kaggle.json")
    print()

    username = input("Enter your Kaggle username: ").strip()
    api_key = input("Enter your Kaggle API key: ").strip()

    if not username or not api_key:
        print("✗ Invalid credentials")
        return False

    kaggle_dir.mkdir(exist_ok=True)
    credentials = {"username": username, "key": api_key}

    with open(kaggle_json, "w") as f:
        json.dump(credentials, f)

    # Set permissions (Unix-like systems)
    try:
        os.chmod(kaggle_json, 0o600)
    except (OSError, AttributeError):
        pass  # Windows doesn't support chmod the same way

    print(f"✓ Credentials saved to {kaggle_json}")
    return True


def download_dataset():
    """Download NIH ChestX-ray14 dataset from Kaggle."""
    from backend.app.config import DATA_DIR

    # Check if already downloaded
    labels_csv = DATA_DIR / "Data_Entry_2017.csv"
    if labels_csv.exists():
        print(f"✓ Dataset labels already exist at {labels_csv}")

        # Count images
        image_dirs = list(DATA_DIR.glob("images*"))
        if image_dirs:
            img_count = sum(1 for d in image_dirs for _ in d.rglob("*.png"))
            print(f"  Found {img_count} images")
            if img_count > 5000:
                print("✓ Dataset appears complete. Skipping download.")
                return True

    # Setup credentials
    if not setup_kaggle_credentials():
        return False

    print()
    print("Downloading NIH ChestX-ray14 dataset...")
    print("This is a large dataset (~45GB). Download may take a while.")
    print()

    try:
        from kaggle.api.kaggle_api_extended import KaggleApi

        api = KaggleApi()
        api.authenticate()

        DATA_DIR.mkdir(parents=True, exist_ok=True)

        # Download dataset
        api.dataset_download_files(
            "nih-chest-xrays/data",
            path=str(DATA_DIR),
            unzip=True,
        )

        print("✓ Download complete!")
        return validate_dataset()

    except Exception as e:
        print(f"✗ Download failed: {e}")
        print()
        print("Alternative: Download manually from:")
        print("https://www.kaggle.com/datasets/nih-chest-xrays/data")
        print(f"Extract to: {DATA_DIR}")
        return False


def validate_dataset():
    """Validate downloaded dataset integrity."""
    from backend.app.config import DATA_DIR, DISEASE_LABELS

    print("\nValidating dataset...")

    # Check labels CSV
    labels_csv = DATA_DIR / "Data_Entry_2017.csv"
    if not labels_csv.exists():
        # Try alternative name
        for alt_name in ["Data_Entry_2017_v2020.csv", "Data_Entry_2017.csv"]:
            alt = DATA_DIR / alt_name
            if alt.exists():
                labels_csv = alt
                break

    if not labels_csv.exists():
        print(f"✗ Labels CSV not found in {DATA_DIR}")
        return False

    import pandas as pd
    df = pd.read_csv(labels_csv)
    print(f"  Total entries in CSV: {len(df):,}")

    # Check image availability
    image_count = 0
    for ext in ["*.png", "*.jpg"]:
        image_count += sum(1 for _ in DATA_DIR.rglob(ext))

    print(f"  Total images found: {image_count:,}")

    # Check disease distribution
    print("\n  Disease distribution:")
    for disease in DISEASE_LABELS:
        count = df["Finding Labels"].str.contains(disease).sum()
        print(f"    {disease:20s}: {count:,}")

    no_finding = (df["Finding Labels"] == "No Finding").sum()
    print(f"    {'No Finding':20s}: {no_finding:,}")

    if image_count >= 5000:
        print("\n✓ Dataset validation passed!")
        return True
    else:
        print(f"\n⚠ Only {image_count} images found. Expected 100,000+")
        print("  You may need to download more image archives.")
        return False


if __name__ == "__main__":
    download_dataset()
