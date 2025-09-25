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
from typing import Dict, Any, Optional

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
        self._initialization_errors: Dict[str, str] = {}

    def initialize(self) -> None:
        """
        Inicializa todas las dependencias con validación estricta.

        Raises:
            RuntimeError: Si servicios críticos no se pueden inicializar
        """
        if self._initialized:
            return

        logger.info("🚀 Inicializando production dependency container...")

        try:
            # 1. Validar configuración crítica
            self._validate_configuration()

            # 2. Inicializar servicios externos
            self._init_external_services()

            # 3. Inicializar repositorios
            self._init_repositories()

            # 4. Verificar salud de servicios
            self._verify_services_health()

            self._initialized = True
            logger.info("✅ Production container inicializado exitosamente")

        except Exception as e:
            logger.error(f"❌ Error crítico inicializando container: {str(e)}")
            self._log_initialization_summary()
            raise RuntimeError(
                f"Falló inicialización del container: {str(e)}") from e

    def _validate_configuration(self) -> None:
        """Valida que la configuración esencial esté presente."""
        logger.info("🔍 Validando configuración...")

        required_configs = []

        # Validar OpenAI
        if not settings.OPENAI_API_KEY:
            required_configs.append("OPENAI_API_KEY")

        # Validar Supabase
        if not settings.SUPABASE_URL:
            required_configs.append("SUPABASE_URL")
        if not settings.SUPABASE_SERVICE_ROLE_KEY:
            required_configs.append("SUPABASE_SERVICE_ROLE_KEY")

        if required_configs:
            missing = ", ".join(required_configs)
            raise RuntimeError(f"Configuración crítica faltante: {missing}")

        logger.info("✅ Configuración validada correctamente")

    def _init_external_services(self) -> None:
        """Inicializa servicios externos con validación estricta."""
        logger.info("🔌 Inicializando servicios externos...")

        # OpenAI Services
        try:
            if not settings.openai_configured:
                raise ValueError("OpenAI no está configurado correctamente")

            self._instances['openai_script_service'] = OpenAIScriptService()
            self._instances['openai_audio_service'] = OpenAIAudioService()
            logger.info("✅ OpenAI services inicializados")

        except Exception as e:
            error_msg = f"Error inicializando OpenAI services: {str(e)}"
            self._initialization_errors['openai'] = error_msg
            logger.error(f"❌ {error_msg}")
            raise

        # Supabase Client
        try:
            if not settings.supabase_configured:
                raise ValueError("Supabase no está configurado correctamente")

            self._instances['supabase_client'] = SupabaseClient()
            logger.info("✅ Supabase client inicializado")

        except Exception as e:
            error_msg = f"Error inicializando Supabase client: {str(e)}"
            self._initialization_errors['supabase'] = error_msg
            logger.error(f"❌ {error_msg}")
            raise

    def _init_repositories(self) -> None:
        """Inicializa todos los repositorios."""
        logger.info("🗄️ Inicializando repositorios...")

        supabase_client = self._instances['supabase_client']

        try:
            # Repositorios persistentes (Supabase)
            self._instances['user_repository'] = SupabaseUserRepository(
                supabase_client)
            logger.info("✅ User repository inicializado")

            self._instances['video_repository'] = SupabaseVideoRepository(
                supabase_client)
            logger.info("✅ Video repository inicializado")

            self._instances['clip_repository'] = SupabaseClipRepository(
                supabase_client)
            logger.info("✅ Clip repository inicializado")

            # Credit repository (opcional)
            try:
                self._instances['credit_repository'] = SupabaseCreditRepository(
                    supabase_client)
                logger.info("✅ Credit repository inicializado")
            except Exception as e:
                logger.warning(f"⚠️ Credit repository no disponible: {str(e)}")
                self._instances['credit_repository'] = None

            # Script repository (en memoria - no persistente)
            self._instances['script_repository'] = InMemoryScriptRepository()
            logger.info("✅ Script repository (memoria) inicializado")

            logger.info("✅ Todos los repositorios inicializados")

        except Exception as e:
            error_msg = f"Error inicializando repositorios: {str(e)}"
            self._initialization_errors['repositories'] = error_msg
            logger.error(f"❌ {error_msg}")
            raise
