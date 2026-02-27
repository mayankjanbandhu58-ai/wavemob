"""
Data Setup Script

Extracts and organizes dataset files placed in the data/ folder.
Handles:
- NIH ChestX-ray14 (full or 224x224 resized version)
- Chest X-Ray Masks & Labels (for lung segmentation)

Usage:
    python scripts/setup_data.py
"""

import os
import sys
import zipfile
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"


def extract_zip(zip_path: Path, extract_to: Path):
    """Extract a zip file with progress."""
    print(f"  Extracting: {zip_path.name} ({zip_path.stat().st_size / 1e9:.2f} GB)")
    with zipfile.ZipFile(zip_path, 'r') as zf:
        total = len(zf.namelist())
        for i, member in enumerate(zf.namelist()):
            zf.extract(member, extract_to)
            if (i + 1) % 5000 == 0 or i + 1 == total:
                print(f"    [{i+1}/{total}] files extracted...")
    print(f"  ✓ Done: {zip_path.name}")


def find_and_organize_images():
    """Find all extracted images and organize into data/images/."""
    images_dir = DATA_DIR / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    # Count existing images
    existing = list(images_dir.glob("*.png")) + list(images_dir.glob("*.jpg"))
    if len(existing) > 100:
        print(f"  ✓ Images directory already has {len(existing)} images")
        return len(existing)

    # Search for images in subdirectories (NIH dataset has images in multiple folders)
    image_count = 0
    search_patterns = ["**/*.png", "**/*.jpg", "**/*.jpeg"]

    for pattern in search_patterns:
        for img_path in DATA_DIR.glob(pattern):
            if img_path.parent == images_dir:
                image_count += 1
                continue
            dest = images_dir / img_path.name
            if not dest.exists():
                shutil.move(str(img_path), str(dest))
                image_count += 1
                if image_count % 5000 == 0:
                    print(f"    Moved {image_count} images...")

    print(f"  ✓ Total images in data/images/: {image_count}")
    return image_count


def find_labels_csv():
    """Find and place the labels CSV in the expected location."""
    expected = DATA_DIR / "Data_Entry_2017.csv"
    if expected.exists():
        print(f"  ✓ Labels CSV found: {expected}")
        return True

    # Search for it
    for csv in DATA_DIR.rglob("Data_Entry_2017*.csv"):
        shutil.copy2(str(csv), str(expected))
        print(f"  ✓ Labels CSV found and copied to: {expected}")
        return True

    # Also check for common alternative names
    alternatives = [
        "Data_Entry_2017_v2020.csv",
        "Data_Entry_2017.csv",
        "data_entry_2017.csv",
    ]
    for alt in alternatives:
        for csv in DATA_DIR.rglob(alt):
            shutil.copy2(str(csv), str(expected))
            print(f"  ✓ Labels CSV ({alt}) copied to: {expected}")
            return True

    print("  ✗ Labels CSV not found! Please ensure Data_Entry_2017.csv is in data/")
    return False


def find_segmentation_masks():
    """Check for lung segmentation mask data."""
    masks_dir = DATA_DIR / "masks"

    # Search for mask-related directories
    for d in DATA_DIR.rglob("*mask*"):
        if d.is_dir() and d != masks_dir:
            if not masks_dir.exists():
                shutil.copytree(str(d), str(masks_dir))
                print(f"  ✓ Segmentation masks found and moved to: {masks_dir}")
                return True

    mask_count = len(list(masks_dir.glob("*.png"))) if masks_dir.exists() else 0
    if mask_count > 0:
        print(f"  ✓ Segmentation masks: {mask_count} files in {masks_dir}")
        return True

    print("  ⚠ No segmentation masks found (optional — ImageNet encoder will be used)")
    return False


def cleanup_empty_dirs():
    """Remove empty directories after reorganization."""
    for dirpath, dirnames, filenames in os.walk(str(DATA_DIR), topdown=False):
        for dirname in dirnames:
            d = Path(dirpath) / dirname
            if d.name in ("images", "masks", "__MACOSX"):
                continue
            try:
                if not any(d.iterdir()):
                    d.rmdir()
            except (OSError, PermissionError):
                pass


def main():
    print("=" * 60)
    print("  Wavelength — Data Setup")
    print("=" * 60)

    # Step 1: Find and extract all zip files
    zips = list(DATA_DIR.glob("*.zip"))
    if zips:
        print(f"\nFound {len(zips)} zip file(s):")
        for z in zips:
            print(f"  - {z.name} ({z.stat().st_size / 1e9:.2f} GB)")
        print()

        for z in zips:
            extract_zip(z, DATA_DIR)
    else:
        print("\nNo zip files found in data/. Checking for extracted data...")

    # Step 2: Organize images
    print("\n--- Organizing Images ---")
    img_count = find_and_organize_images()

    # Step 3: Find labels CSV
    print("\n--- Checking Labels CSV ---")
    has_labels = find_labels_csv()

    # Step 4: Check segmentation masks
    print("\n--- Checking Segmentation Masks ---")
    find_segmentation_masks()

    # Step 5: Cleanup
    print("\n--- Cleanup ---")
    cleanup_empty_dirs()
    print("  ✓ Cleaned up empty directories")

    # Summary
    print("\n" + "=" * 60)
    print("  Summary")
    print("=" * 60)
    print(f"  Images:     {img_count}")
    print(f"  Labels CSV: {'✓' if has_labels else '✗ MISSING'}")

    if img_count > 0 and has_labels:
        print("\n  ✅ Dataset ready! You can now train:")
        print("     .venv\\Scripts\\activate")
        print("     python training/train.py --model both")
    else:
        print("\n  ❌ Dataset incomplete. Check above for missing files.")

    print()


if __name__ == "__main__":
    main()
