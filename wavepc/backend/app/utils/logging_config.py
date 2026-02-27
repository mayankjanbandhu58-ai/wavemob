"""
Logging Configuration

Structured logging setup for the Wavelength system.
Uses console and file handlers with JSON-compatible formatting.
"""

import logging
import sys
from pathlib import Path

from app.config import LOG_DIR, LOG_LEVEL


def setup_logging(name: str = "wavelength", log_file: str = "wavelength.log") -> logging.Logger:
    """
    Configure structured logging.

    Args:
        name: Logger name
        log_file: Log file name

    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))

    # Prevent duplicate handlers
    if logger.handlers:
        return logger

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_format = logging.Formatter(
        "%(asctime)s │ %(levelname)-8s │ %(name)-30s │ %(message)s",
        datefmt="%H:%M:%S",
    )
    console_handler.setFormatter(console_format)

    # File handler
    file_handler = logging.FileHandler(LOG_DIR / log_file)
    file_handler.setLevel(logging.DEBUG)
    file_format = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(file_format)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger
