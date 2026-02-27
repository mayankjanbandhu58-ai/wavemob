"""
Model Export — TorchScript & ONNX

Exports trained PyTorch models to:
1. TorchScript (.jit) — for PyTorch-based serving
2. ONNX (.onnx) — for ONNX Runtime GPU inference (production)

Validates that exported models produce matching outputs.
"""

import logging
import sys
from pathlib import Path

import numpy as np
import torch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.config import CHECKPOINT_DIR, DENSENET_DROPOUT, EFFICIENTNET_DROPOUT, IMAGE_SIZE, NUM_CLASSES, ONNX_DIR
from backend.app.models.densenet import build_densenet121
from backend.app.models.efficientnet import build_efficientnet_v2_s

logger = logging.getLogger("wavelength.export")
logging.basicConfig(level=logging.INFO, format="%(asctime)s │ %(levelname)-8s │ %(message)s")


def export_model(model_type: str = "densenet121"):
    """
    Export a trained model to TorchScript and ONNX.

    Args:
        model_type: "densenet121" or "efficientnet_v2_s"
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Load model
    checkpoint_path = CHECKPOINT_DIR / f"{model_type}_best.pth"
    if not checkpoint_path.exists():
        logger.error(f"Checkpoint not found: {checkpoint_path}")
        return False

    if model_type == "densenet121":
        model = build_densenet121(num_classes=NUM_CLASSES, dropout=DENSENET_DROPOUT, pretrained=False)
    else:
        model = build_efficientnet_v2_s(num_classes=NUM_CLASSES, dropout=EFFICIENTNET_DROPOUT, pretrained=False)

    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    logger.info(f"Loaded {model_type} (AUC: {checkpoint.get('val_auc', '?')})")

    # Dummy input
    dummy_input = torch.randn(1, 3, IMAGE_SIZE, IMAGE_SIZE).to(device)

    # Get reference output
    with torch.no_grad():
        ref_output = model(dummy_input).cpu().numpy()

    # ── TorchScript Export ──
    jit_path = CHECKPOINT_DIR / f"{model_type}.jit"
    try:
        traced = torch.jit.trace(model, dummy_input)
        traced.save(str(jit_path))
        logger.info(f"TorchScript saved: {jit_path}")

        # Validate
        loaded_jit = torch.jit.load(str(jit_path))
        with torch.no_grad():
            jit_output = loaded_jit(dummy_input).cpu().numpy()
        max_diff = np.max(np.abs(ref_output - jit_output))
        logger.info(f"TorchScript max diff: {max_diff:.8f}")
        assert max_diff < 1e-4, f"TorchScript output mismatch: {max_diff}"
    except Exception as e:
        logger.error(f"TorchScript export failed: {e}")

    # ── ONNX Export ──
    onnx_path = ONNX_DIR / f"{model_type}.onnx"
    try:
        torch.onnx.export(
            model,
            dummy_input,
            str(onnx_path),
            export_params=True,
            opset_version=17,
            do_constant_folding=True,
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={
                "input": {0: "batch_size"},
                "output": {0: "batch_size"},
            },
        )
        logger.info(f"ONNX saved: {onnx_path}")

        # Validate with ONNX Runtime
        try:
            import onnxruntime as ort

            session = ort.InferenceSession(
                str(onnx_path),
                providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
            )
            onnx_output = session.run(
                None,
                {"input": dummy_input.cpu().numpy()},
            )[0]
            max_diff = np.max(np.abs(ref_output - onnx_output))
            logger.info(f"ONNX max diff: {max_diff:.8f}")
            assert max_diff < 1e-3, f"ONNX output mismatch: {max_diff}"
            logger.info("✓ ONNX validation passed")
        except ImportError:
            logger.warning("onnxruntime not installed, skipping ONNX validation")

    except Exception as e:
        logger.error(f"ONNX export failed: {e}")

    return True


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="both",
                       choices=["densenet121", "efficientnet_v2_s", "both"])
    args = parser.parse_args()

    if args.model == "both":
        export_model("densenet121")
        export_model("efficientnet_v2_s")
    else:
        export_model(args.model)
