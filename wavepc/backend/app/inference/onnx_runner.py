"""
ONNX Runtime Inference Runner

Thin wrapper around ONNX Runtime for GPU-accelerated inference.
Used for production serving after model export.
Falls back to PyTorch models if ONNX is not available.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np

logger = logging.getLogger("wavelength.onnx_runner")


class ONNXInferenceRunner:
    """
    ONNX Runtime inference wrapper with GPU acceleration.

    Loads exported ONNX models and provides a unified inference interface.
    Supports multiple models for ensemble inference.
    """

    def __init__(self, device: str = "cuda"):
        self.device = device
        self.sessions: Dict[str, "ort.InferenceSession"] = {}
        self._ort = None

    def _get_ort(self):
        """Lazy import of onnxruntime."""
        if self._ort is None:
            import onnxruntime as ort
            self._ort = ort
        return self._ort

    def load_model(self, name: str, model_path: Path):
        """
        Load an ONNX model.

        Args:
            name: Model identifier (e.g., "densenet121")
            model_path: Path to .onnx file
        """
        ort = self._get_ort()

        if not model_path.exists():
            raise FileNotFoundError(f"ONNX model not found: {model_path}")

        # Configure session options
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_options.intra_op_num_threads = 4

        # Providers: prefer GPU, fallback to CPU
        providers = []
        if self.device == "cuda":
            providers.append(("CUDAExecutionProvider", {
                "device_id": 0,
                "arena_extend_strategy": "kNextPowerOfTwo",
                "gpu_mem_limit": 2 * 1024 * 1024 * 1024,  # 2GB
            }))
        providers.append("CPUExecutionProvider")

        session = ort.InferenceSession(
            str(model_path),
            sess_options=sess_options,
            providers=providers,
        )

        self.sessions[name] = session
        active_provider = session.get_providers()[0]
        logger.info(f"Loaded ONNX model '{name}' from {model_path} [Provider: {active_provider}]")

    def predict(self, name: str, input_array: np.ndarray) -> np.ndarray:
        """
        Run inference on a single model.

        Args:
            name: Model identifier
            input_array: Input array of shape (1, 3, 224, 224), float32

        Returns:
            Logits array of shape (1, num_classes)
        """
        if name not in self.sessions:
            raise ValueError(f"Model '{name}' not loaded. Available: {list(self.sessions.keys())}")

        session = self.sessions[name]
        input_name = session.get_inputs()[0].name

        input_array = input_array.astype(np.float32)
        outputs = session.run(None, {input_name: input_array})

        return outputs[0]

    def predict_ensemble(self, input_array: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Run inference on all loaded models.

        Args:
            input_array: Input array of shape (1, 3, 224, 224)

        Returns:
            Dict mapping model_name → sigmoid probabilities array
        """
        predictions = {}
        for name in self.sessions:
            logits = self.predict(name, input_array)
            # Sigmoid without scipy dependency
            probs = 1.0 / (1.0 + np.exp(-logits.squeeze()))
            predictions[name] = probs

        return predictions

    @property
    def loaded_models(self) -> List[str]:
        """Return names of loaded models."""
        return list(self.sessions.keys())
