"""
Health check endpoints - Refactored for hexagonal architecture
"""
from fastapi import APIRouter

from app.schemas.base import HealthResponse
from app.core.container import check_services_health

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Verifica el estado de la API y todos los servicios conectados"
)
async def health_check():
    """
    Endpoint de verificación completa de salud del servicio.

    Verifica:
    - Estado de la base de datos
    - Conexión con OpenAI
    - Conexión con Supabase
    - Estado general del sistema
    """
    try:
        # Verificar estado de todos los servicios
        services_status = await check_services_health()

        # Determinar estado general
        overall_status = services_status.get("overall", "unhealthy")

        return HealthResponse(
            status=overall_status,
            version="1.0.0",
            services=services_status
        )

    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            version="1.0.0",
            services={"error": str(e)}
        )