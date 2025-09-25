"""
Dependency Injection Container 

🎯 PROPÓSITO:
- Gestiona la creación e inyección de dependencias  
- Implementa patrón Dependency Injection Container
- Centraliza la configuración de servicios
- Facilita testing con mocks

💡 CAMBIOS PRINCIPALES:
- Agregado ScriptRepository (en memoria)
- Corregida inicialización de repositorios
- Agregados mock services completos
- Mejorada gestión de errores
"""
import logging
from typing import Dict, Any

from .config import settings
from .database import get_db

# Domain repositories interfaces
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.video_repository import VideoRepository
from app.domain.repositories.script_repository import ScriptRepository
from app.domain.repositories.clip_repository import ClipRepository
from app.domain.repositories.credit_repository import CreditRepository

# Infrastructure implementations
from app.infrastructure.database.repositories.supabase_user_repository import SupabaseUserRepository
from app.infrastructure.database.repositories.supabase_video_repository import SupabaseVideoRepository
from app.infrastructure.database.repositories.supabase_clip_repository import SupabaseClipRepository
from app.infrastructure.database.repositories.supabase_credit_repository import SupabaseCreditRepository
from app.infrastructure.database.repositories.in_memory_script_repository import InMemoryScriptRepository
from app.infrastructure.external.supabase.client import SupabaseClient
from app.infrastructure.external.openai.service import OpenAIScriptService, OpenAIAudioService

# Application use cases
from app.application.use_cases.enhance_script import EnhanceScriptUseCase
from app.application.use_cases.generate_audio import GenerateAudioUseCase

logger = logging.getLogger(__name__)


class DependencyContainer:
    """Container de inyección de dependencias."""

    def __init__(self):
        self._instances: Dict[str, Any] = {}
        self._initialized = False

    def initialize(self) -> None:
        """Inicializa todas las dependencias."""
        if self._initialized:
            return

        logger.info("🚀 Inicializando dependency container...")

        # 1. Servicios externos (OpenAI, Supabase)
        self._init_external_services()

        # 2. Repositorios
        self._init_repositories()

        self._initialized = True
        logger.info("✅ Dependency container inicializado exitosamente")

    def _init_external_services(self) -> None:
        """
        Inicializa servicios externos como OpenAI y Supabase.
        """

        # OpenAI services
        if settings.openai_configured:
            self._instances['openai_script_service'] = OpenAIScriptService()
            self._instances['openai_audio_service'] = OpenAIAudioService()
            logger.info("✅ OpenAI services configurados")
        else:
            logger.warning("⚠️ OpenAI no configurado")

        # Supabase client
        if settings.supabase_configured:
            self._instances['supabase_client'] = SupabaseClient()
            logger.info("✅ Supabase client configurado")
        else:
            logger.warning("⚠️ Supabase no configurado")

    def _init_repositories(self) -> None:
        """
        Inicializa repositorios.
        """

        supabase_client = self._instances['supabase_client']

        self._instances['user_repository'] = SupabaseUserRepository(
            supabase_client)
        self._instances['video_repository'] = SupabaseVideoRepository(
            supabase_client)
        self._instances['clip_repository'] = SupabaseClipRepository(
            supabase_client)
        self._instances['credit_repository'] = SupabaseCreditRepository(
            supabase_client)

        logger.info("✅ Repositorios configurados")

    # ============= GETTERS PARA SERVICIOS =============

    def get_openai_script_service(self):
        """Obtiene el servicio de OpenAI para scripts."""
        return self._instances['openai_script_service']

    def get_openai_audio_service(self):
        """Obtiene el servicio de OpenAI para audio."""
        return self._instances['openai_audio_service']

    def get_supabase_client(self):
        """Obtiene el cliente de Supabase."""
        return self._instances['supabase_client']

    # ============= GETTERS PARA REPOSITORIOS =============

    def get_user_repository(self) -> UserRepository:
        """Obtiene el repositorio de usuarios."""
        return self._instances['user_repository']

    def get_video_repository(self) -> VideoRepository:
        """Obtiene el repositorio de videos."""
        return self._instances['video_repository']

    def get_clip_repository(self) -> ClipRepository:
        """Obtiene el repositorio de clips."""
        return self._instances['clip_repository']

    def get_credit_repository(self) -> CreditRepository:
        """Obtiene el repositorio de créditos."""
        return self._instances['credit_repository']

    # ============= GETTERS PARA USE CASES =============

    def get_enhance_script_use_case(self) -> EnhanceScriptUseCase:
        """Obtiene el caso de uso para mejorar scripts."""
        return EnhanceScriptUseCase(
            script_repository=self.get_script_repository(),
            user_repository=self.get_user_repository(),
            ai_service=self.get_openai_script_service()
        )

    def get_generate_audio_use_case(self) -> GenerateAudioUseCase:
        """Obtiene el caso de uso para generar audio."""
        return GenerateAudioUseCase(
            script_repository=self.get_script_repository(),
            user_repository=self.get_user_repository(),
            audio_service=self.get_openai_audio_service(),
            storage_service=self.get_supabase_client()
        )


# ============= INSTANCIA GLOBAL =============
container = DependencyContainer()


# ============= DEPENDENCY FUNCTIONS PARA FASTAPI =============

async def get_container() -> DependencyContainer:
    """Dependency para obtener el container."""
    if not container._initialized:
        container.initialize()
    return container


async def get_enhance_script_use_case(
    container_instance: DependencyContainer = Depends(get_container)
) -> EnhanceScriptUseCase:
    """Dependency para obtener el caso de uso de mejora de scripts."""
    return container_instance.get_enhance_script_use_case()


async def get_generate_audio_use_case(
    container_instance: DependencyContainer = Depends(get_container)
) -> GenerateAudioUseCase:
    """Dependency para obtener el caso de uso de generación de audio."""
    return container_instance.get_generate_audio_use_case()


async def get_user_repository(
    container_instance: DependencyContainer = Depends(get_container)
) -> UserRepository:
    """Dependency para obtener el repositorio de usuarios."""
    return container_instance.get_user_repository()


async def get_video_repository(
    container_instance: DependencyContainer = Depends(get_container)
) -> VideoRepository:
    """Dependency para obtener el repositorio de videos."""
    return container_instance.get_video_repository()


async def get_clip_repository(
    container_instance: DependencyContainer = Depends(get_container)
) -> ClipRepository:
    """Dependency para obtener el repositorio de clips."""
    return container_instance.get_clip_repository()


async def get_credit_repository(
    container_instance: DependencyContainer = Depends(get_container)
) -> CreditRepository:
    """Dependency para obtener el repositorio de créditos."""
    return container_instance.get_credit_repository()
