"""
Global error handling middleware
"""
import logging
import traceback
from typing import Dict, Any
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import ValidationError

from app.schemas.base import ErrorResponse

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware para manejo global de errores."""

    async def dispatch(self, request: Request, call_next):
        """
        Procesa la request y maneja errores globalmente.

        Args:
            request: Request de FastAPI
            call_next: Siguiente middleware/handler

        Returns:
            Response: Respuesta del servidor
        """
        try:
            response = await call_next(request)
            return response

        except HTTPException as e:
            # HTTPExceptions ya están manejadas por FastAPI
            # Pero podemos logear y personalizar el formato
            logger.warning(
                f"HTTP Exception: {e.status_code} - {e.detail} "
                f"[{request.method} {request.url}]"
            )

            error_response = ErrorResponse(
                error=str(e.detail),
                error_code=f"HTTP_{e.status_code}",
                details={"status_code": e.status_code}
            )

            return JSONResponse(
                status_code=e.status_code,
                content=error_response.dict(),
                headers=e.headers
            )

        except ValidationError as e:
            # Errores de validación de Pydantic
            logger.warning(
                f"Validation Error: {str(e)} "
                f"[{request.method} {request.url}]"
            )

            error_details = {
                "validation_errors": [
                    {
                        "field": ".".join(str(loc) for loc in error.get("loc", [])),
                        "message": error.get("msg", ""),
                        "type": error.get("type", "")
                    }
                    for error in e.errors()
                ]
            }

            error_response = ErrorResponse(
                error="Error de validación en los datos enviados",
                error_code="VALIDATION_ERROR",
                details=error_details
            )

            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content=error_response.dict()
            )

        except ValueError as e:
            # Errores de valor (lógica de negocio)
            logger.warning(
                f"Value Error: {str(e)} "
                f"[{request.method} {request.url}]"
            )

            error_response = ErrorResponse(
                error=str(e),
                error_code="VALUE_ERROR"
            )

            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=error_response.dict()
            )

        except PermissionError as e:
            # Errores de permisos
            logger.warning(
                f"Permission Error: {str(e)} "
                f"[{request.method} {request.url}]"
            )

            error_response = ErrorResponse(
                error=str(e),
                error_code="PERMISSION_DENIED"
            )

            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content=error_response.dict()
            )

        except ConnectionError as e:
            # Errores de conexión con servicios externos
            logger.error(
                f"Connection Error: {str(e)} "
                f"[{request.method} {request.url}]"
            )

            error_response = ErrorResponse(
                error="Error de conexión con servicios externos",
                error_code="CONNECTION_ERROR",
                details={"service_error": str(e)}
            )

            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content=error_response.dict()
            )

        except Exception as e:
            # Errores no esperados
            logger.error(
                f"Unexpected Error: {str(e)} "
                f"[{request.method} {request.url}]\n"
                f"Traceback: {traceback.format_exc()}"
            )

            # En producción, no exponer detalles internos
            error_message = "Error interno del servidor"
            error_details = None

            # En desarrollo, mostrar más detalles
            from app.core.config import settings
            if settings.DEBUG:
                error_message = str(e)
                error_details = {
                    "traceback": traceback.format_exc(),
                    "exception_type": type(e).__name__
                }

            error_response = ErrorResponse(
                error=error_message,
                error_code="INTERNAL_SERVER_ERROR",
                details=error_details
            )

            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=error_response.dict()
            )


def setup_error_handlers(app) -> None:
    """
    Configura handlers específicos de FastAPI además del middleware.

    Args:
        app: Instancia de FastAPI
    """

    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc: HTTPException):
        """Handler para errores 404."""
        error_response = ErrorResponse(
            error="Recurso no encontrado",
            error_code="NOT_FOUND",
            details={
                "path": str(request.url.path),
                "method": request.method
            }
        )

        return JSONResponse(
            status_code=404,
            content=error_response.dict()
        )

    @app.exception_handler(405)
    async def method_not_allowed_handler(request: Request, exc: HTTPException):
        """Handler para errores 405."""
        error_response = ErrorResponse(
            error="Método no permitido",
            error_code="METHOD_NOT_ALLOWED",
            details={
                "path": str(request.url.path),
                "method": request.method,
                "allowed_methods": exc.headers.get("Allow", "").split(", ") if exc.headers else []
            }
        )

        return JSONResponse(
            status_code=405,
            content=error_response.dict(),
            headers=exc.headers
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc):
        """Handler personalizado para errores de validación de FastAPI."""
        error_details = {
            "validation_errors": [
                {
                    "field": ".".join(str(loc) for loc in error.get("loc", [])),
                    "message": error.get("msg", ""),
                    "input": error.get("input")
                }
                for error in exc.errors()
            ]
        }

        error_response = ErrorResponse(
            error="Error de validación en la request",
            error_code="REQUEST_VALIDATION_ERROR",
            details=error_details
        )

        return JSONResponse(
            status_code=422,
            content=error_response.dict()
        )


# Import necesario para el handler
from fastapi.exceptions import RequestValidationError