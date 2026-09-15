"""
Improved FastAPI exception handlers with structured error responses.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import traceback
from logging_config import get_logger

logger = get_logger(__name__)

def setup_exception_handlers(app: FastAPI):
    """Register custom exception handlers."""
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Validation error on {request.url.path}: {exc.errors()}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": "error",
                "type": "validation_error",
                "detail": exc.errors(),
                "path": request.url.path,
            },
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "type": "internal_server_error",
                "detail": "An unexpected error occurred. Check server logs.",
                "path": request.url.path,
            },
        )
