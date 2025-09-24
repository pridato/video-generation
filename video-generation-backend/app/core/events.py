import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from .config import settings
from .database import db_manager

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Maneja los eventos de inicio y cierre de la aplicación."""
    # Startup events
    logger.info("Starting up Video Generation API")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    # Inicializar la base de datos
    db_manager.initialize()
    db_manager.create_tables()

    # Verificar configuraciones críticas
    if not settings.openai_configured:
        logger.warning("OpenAI is not properly configured")

    if not settings.supabase_configured:
        logger.warning("Supabase is not properly configured")

    if not settings.jwt_configured:
        logger.warning("JWT is not properly configured")

    logger.info("Application startup complete")

    yield

    # Shutdown events
    logger.info("Shutting down Video Generation API")
    logger.info("Application shutdown complete")


def setup_logging():
    """Configura el sistema de logging."""
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper()),
        format=settings.LOG_FORMAT,
        handlers=[
            logging.StreamHandler(),
        ]
    )

    # Configurar loggers específicos
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.DEBUG else logging.WARNING
    )