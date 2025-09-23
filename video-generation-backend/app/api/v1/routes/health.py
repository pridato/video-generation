"""
Health check endpoints
"""
from fastapi import APIRouter, Depends
from app.schemas.health import HealthResponse
from app.api.deps import validate_api_configuration

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Health Check")
async def health_check():
    """
    Endpoint de verificación de salud del servicio
    """
    try:
        # Validar configuraciones
        validate_api_configuration()

        return HealthResponse(
            status="healthy",
            message="API is running correctly",
            version="1.0.0"
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            message=f"Configuration error: {str(e)}",
            version="1.0.0"
        )