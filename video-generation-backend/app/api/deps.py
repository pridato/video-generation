"""
Dependencias comunes para la API
"""
from typing import Generator
import logging
from supabase import create_client, Client
from app.core.config import settings
from app.services.openai_service import openai_service
from app.services.clip_selection_service import clip_selection_service
from app.services.embedding_service import embedding_service
from app.services.video_assembly_service import VideoAssemblyService

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """
    Dependency para obtener cliente de Supabase
    """
    try:
        client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_ANON_KEY
        )
        return client
    except Exception as e:
        logger.error(f"Error creating Supabase client: {e}")
        raise


def get_openai_service():
    """
    Dependency para obtener servicio de OpenAI
    """
    if not settings.openai_configured:
        raise Exception("OpenAI not properly configured")
    return openai_service


def get_clip_selection_service():
    """
    Dependency para obtener servicio de selección de clips
    """
    return clip_selection_service


def get_embedding_service():
    """
    Dependency para obtener servicio de embeddings
    """
    return embedding_service


def get_video_assembly_service() -> VideoAssemblyService:
    """
    Dependency para obtener servicio de ensamblaje de video
    """
    supabase_client = get_supabase_client()
    return VideoAssemblyService(supabase_client)


def validate_api_configuration():
    """
    Valida que todas las configuraciones necesarias estén presentes
    """
    errors = []

    if not settings.openai_configured:
        errors.append("OpenAI API key not configured")

    if not settings.supabase_configured:
        errors.append("Supabase credentials not configured")

    if errors:
        error_msg = "; ".join(errors)
        logger.error(f"API configuration errors: {error_msg}")
        raise Exception(f"Configuration errors: {error_msg}")

    return True