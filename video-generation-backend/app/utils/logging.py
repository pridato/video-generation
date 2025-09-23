"""
Logging utilities
"""
import logging
import sys
from typing import Optional
from app.core.config import settings


def setup_logging(level: Optional[str] = None) -> None:
    """
    Configure application logging
    """
    log_level = level or settings.LOG_LEVEL

    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Configure specific loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger instance
    """
    return logging.getLogger(name)