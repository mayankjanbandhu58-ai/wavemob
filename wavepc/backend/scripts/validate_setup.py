"""
Environment Validation Script

Checks all system requirements before training or serving.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def check_python():
    """Check Python version."""
    v = sys.version_info
    print(f"Python: {v.major}.{v.minor}.{v.micro}", end="")
    if v.major == 3 and v.minor >= 10:
        print(" ✓")
        return True
    else:
        print(" ✗ (Need 3.10+)")
        return False


def check_cuda():
    """Check CUDA/GPU availability."""
    try:
        import torch
        print(f"PyTorch: {torch.__version__}", end="")

        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            vram = torch.cuda.get_device_properties(0).total_mem / (1024 ** 3)
            print(f" ✓")
            print(f"GPU: {gpu_name} ({vram:.1f} GB VRAM) ✓")
            print(f"CUDA: {torch.version.cuda} ✓")

            # Quick GPU test
            x = torch.randn(100, 100, device="cuda")
            y = x @ x.t()
            print(f"GPU compute test: ✓")
            return True
        else:
            print()
            print("GPU: Not available ✗")
            print("  Training will be very slow on CPU.")
            return False
    except ImportError:
        print("PyTorch: Not installed ✗")
        return False


def check_dependencies():
    """Check all required packages."""
    packages = {
        "torch": "PyTorch",
        "torchvision": "TorchVision",
        "fastapi": "FastAPI",
        "uvicorn": "Uvicorn",
        "PIL": "Pillow",
        "cv2": "OpenCV",
        "numpy": "NumPy",
        "pandas": "Pandas",
        "sklearn": "Scikit-learn",
        "segmentation_models_pytorch": "Segmentation Models PyTorch",
        "pytorch_grad_cam": "Grad-CAM",
        "fpdf": "FPDF2",
        "onnxruntime": "ONNX Runtime",
        "tqdm": "TQDM",
    }

    all_ok = True
    for module, name in packages.items():
        try:
            __import__(module)
            print(f"  {name}: ✓")
        except ImportError:
            print(f"  {name}: ✗")
            all_ok = False

    return all_ok


def check_disk_space():
    """Check available disk space."""
    import shutil

    project_root = Path(__file__).resolve().parent.parent.parent
    total, used, free = shutil.disk_usage(project_root)
    free_gb = free / (1024 ** 3)

    print(f"Disk space: {free_gb:.1f} GB free", end="")
    if free_gb >= 50:
        print(" ✓")
        return True
    elif free_gb >= 10:
        print(" ⚠ (50+ GB recommended for full dataset)")
        return True
    else:
        print(" ✗ (Need at least 10 GB)")
        return False


def validate():
    """Run all validation checks."""
    print("=" * 60)
    print("  Wavelength — Environment Validation")
    print("=" * 60)
    print()

    results = {
        "Python": check_python(),
        "CUDA/GPU": check_cuda(),
        "Disk Space": check_disk_space(),
    }

    print()
    print("Dependencies:")
    results["Dependencies"] = check_dependencies()

    print()
    print("─" * 60)
    passed = sum(results.values())
    total = len(results)
    print(f"Results: {passed}/{total} checks passed")

    if all(results.values()):
        print("✓ All checks passed! Ready to proceed.")
    else:
        failed = [k for k, v in results.items() if not v]
        print(f"✗ Failed checks: {', '.join(failed)}")
        print("  Please resolve these issues before proceeding.")

    print("=" * 60)
    return all(results.values())


if __name__ == "__main__":
    success = validate()
    sys.exit(0 if success else 1)
