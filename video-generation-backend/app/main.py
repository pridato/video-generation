"""
FastAPI Video Generation API - Hexagonal Architecture
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.config import settings
from app.core.events import lifespan, setup_logging
from app.core.container import container, check_services_health
from app.api.v1.api import api_router
from app.api.middleware.cors import setup_cors
from app.api.middleware.error_handler import ErrorHandlerMiddleware, setup_error_handlers
from app.api.middleware.rate_limit import create_rate_limit_middleware
from app.schemas.base import HealthResponse

# Setup logging first
setup_logging()
logger = logging.getLogger(__name__)

# Create FastAPI application with lifespan events
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API para generación de contenido de video con IA - Arquitectura Hexagonal",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan  # Use the lifespan from core.events
)

# Setup middleware
logger.info("Configurando middleware...")

# 1. Error handling middleware (should be first)
app.add_middleware(ErrorHandlerMiddleware)

# 2. Rate limiting middleware
if not settings.DEBUG:  # Only in production
    rate_limit_middleware = create_rate_limit_middleware(
        calls_per_minute=settings.RATE_LIMIT_PER_MINUTE,
        burst_limit=settings.RATE_LIMIT_BURST
    )
    app.add_middleware(rate_limit_middleware)

# 3. CORS middleware
setup_cors(app)

# Setup custom error handlers
setup_error_handlers(app)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get(
    "/",
    tags=["Root"],
    summary="API Root",
    description="Endpoint raíz de la API con información general"
)
async def root():
    """
    Endpoint raíz que proporciona información básica de la API.
    """
    return {
        "message": f"Bienvenido a {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "architecture": "Hexagonal Architecture (Ports & Adapters)",
        "docs_url": "/docs" if settings.DEBUG else "Documentación deshabilitada en producción",
        "api_v1": settings.API_V1_PREFIX,
        "features": [
            "✅ Mejora de scripts con IA",
            "✅ Generación de audio TTS",
            "✅ Autenticación JWT con Supabase",
            "✅ Rate limiting",
            "✅ Manejo global de errores",
            "✅ Arquitectura hexagonal"
        ]
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health Check",
    description="Verifica el estado de la API y servicios conectados"
)
async def health():
    """
    Health check endpoint que verifica el estado de todos los servicios.
    """
    try:
        # Initialize container if not already done
        if not container._initialized:
            container.initialize()

        # Check all services
        services_status = await check_services_health()

        # Determine overall status
        overall_status = services_status.get("overall", "unhealthy")

        return HealthResponse(
            status=overall_status,
            version=settings.APP_VERSION,
            services=services_status
        )

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthResponse(
            status="unhealthy",
            version=settings.APP_VERSION,
            services={"error": str(e)}
        )


@app.get(
    "/info",
    tags=["Info"],
    summary="API Information",
    description="Información detallada sobre la configuración y arquitectura"
)
async def info():
    """
    Proporciona información detallada sobre la API y su configuración.
    """
    return {
        "api": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG
        },
        "architecture": {
            "pattern": "Hexagonal Architecture (Ports & Adapters)",
            "layers": {
                "presentation": "FastAPI + Pydantic schemas",
                "application": "Use cases + interfaces",
                "domain": "Entities + repositories + domain services",
                "infrastructure": "Database + external services"
            },
            "principles": [
                "Dependency Inversion",
                "Single Responsibility",
                "Domain-Driven Design",
                "Clean Architecture"
            ]
        },
        "services": {
            "openai": "✅ Configurado" if settings.openai_configured else "❌ No configurado",
            "supabase": "✅ Configurado" if settings.supabase_configured else "❌ No configurado",
            "jwt": "✅ Configurado" if settings.jwt_configured else "❌ No configurado"
        },
        "features": {
            "authentication": "Supabase JWT",
            "rate_limiting": f"{settings.RATE_LIMIT_PER_MINUTE} requests/min",
            "cors_origins": settings.cors_origins_list,
            "database": "PostgreSQL (via SQLAlchemy)",
            "ai_services": ["OpenAI GPT-4", "OpenAI TTS", "OpenAI Whisper"],
            "storage": "Supabase Storage"
        },
        "endpoints": {
            "api_v1": settings.API_V1_PREFIX,
            "docs": "/docs" if settings.DEBUG else None,
            "health": "/health",
            "root": "/"
        }
    }


# Global exception handler for uncaught exceptions
@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """
    Handler global para errores 500 no capturados.
    """
    logger.error(f"Unhandled error: {str(exc)}")
    return {
        "success": False,
        "error": "Error interno del servidor",
        "error_code": "INTERNAL_SERVER_ERROR",
        "timestamp": "2024-01-01T12:00:00Z"
    }


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Entorno: {settings.ENVIRONMENT}")
    logger.info(f"Debug: {settings.DEBUG}")
    logger.info(f"Host: {settings.API_HOST}:{settings.API_PORT}")

    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )