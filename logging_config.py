"""
Improved logging configuration for SentinelX backend.
Provides structured logging with JSON output for production.
"""

import logging
import sys
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Formats log records as JSON for structured logging."""
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance."""
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    
    return logger
