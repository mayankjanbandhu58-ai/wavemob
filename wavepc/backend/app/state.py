"""
Application State

Shared state holder extracted to avoid circular imports between
main.py and route modules.
"""


class AppState:
    """Holds model references and pipeline components."""
    onnx_runner = None
    pytorch_models: dict = {}   # Fallback: model_name → (model, device)
    device: str = "cpu"
    ensemble = None
    calibrator = None
    risk_engine = None
    segmentation_model = None
    reports: dict = {}  # In-memory report storage


app_state = AppState()
