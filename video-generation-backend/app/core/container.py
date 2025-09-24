"""
Dependency injection container
"""
import logging
from functools import lru_cache
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings

# Domain repositories
from app.domain.repositories.script_repository import ScriptRepository
from app.domain.repositories.user_repository import UserRepository

# Infrastructure implementations
from app.infrastructure.database.repositories.script_repo import SQLScriptRepository
from app.infrastructure.database.repositories.user_repo import SQLUserRepository
from app.infrastructure.external.openai.service import OpenAIScriptService, OpenAIAudioService
from app.infrastructure.external.supabase.client import SupabaseClient

# Application use cases
from app.application.use_cases.enhance_script import EnhanceScriptUseCase
from app.application.use_cases.generate_audio import GenerateAudioUseCase

# Application interfaces
from app.application.interfaces.ai_service import AIService
from app.application.interfaces.audio_service import AudioService
from app.application.interfaces.storage_service import StorageService

logger = logging.getLogger(__name__)


class DependencyContainer:
    """Container de inyección de dependencias."""

    def __init__(self):
        self._instances = {}
        self._initialized = False

    def initialize(self) -> None:
        """Inicializa todas las dependencias."""
        if self._initialized:
            return

        logger.info("Inicializando dependency container...")

        # Inicializar servicios externos
        self._init_external_services()

        # Inicializar repositorios
        self._init_repositories()

        # Inicializar casos de uso
        self._init_use_cases()

        self._initialized = True
        logger.info("Dependency container inicializado exitosamente")

    def _init_external_services(self) -> None:
        """Inicializa servicios externos."""
        # OpenAI services
        if settings.openai_configured:
            self._instances['openai_script_service'] = OpenAIScriptService()
            self._instances['openai_audio_service'] = OpenAIAudioService()
        else:
            logger.warning("OpenAI no configurado - usando servicios mock")
            self._instances['openai_script_service'] = MockOpenAIScriptService()
            self._instances['openai_audio_service'] = MockOpenAIAudioService()

        # Supabase client
        if settings.supabase_configured:
            self._instances['supabase_client'] = SupabaseClient()
            self._instances['storage_service'] = SupabaseStorageService(self._instances['supabase_client'])
        else:
            logger.warning("Supabase no configurado - usando servicios mock")
            self._instances['supabase_client'] = MockSupabaseClient()
            self._instances['storage_service'] = MockStorageService()

    def _init_repositories(self) -> None:
        """Inicializa repositorios."""
        # Los repositorios necesitan una sesión de BD, que se inyecta por request
        # Aquí solo definimos las factories
        self._repository_factories = {
            'script_repository': lambda session: SQLScriptRepository(session),
            'user_repository': lambda session: SQLUserRepository(session)
        }

    def _init_use_cases(self) -> None:
        """Inicializa casos de uso."""
        # Los casos de uso se crean por request porque dependen de repositorios
        # que a su vez dependen de la sesión de BD
        pass

    def get_openai_script_service(self) -> OpenAIScriptService:
        """Obtiene el servicio de OpenAI para scripts."""
        return self._instances['openai_script_service']

    def get_openai_audio_service(self) -> OpenAIAudioService:
        """Obtiene el servicio de OpenAI para audio."""
        return self._instances['openai_audio_service']

    def get_supabase_client(self) -> SupabaseClient:
        """Obtiene el cliente de Supabase."""
        return self._instances['supabase_client']

    def get_storage_service(self) -> StorageService:
        """Obtiene el servicio de storage."""
        return self._instances['storage_service']

    def get_script_repository(self, session: Session) -> ScriptRepository:
        """Obtiene el repositorio de scripts."""
        return self._repository_factories['script_repository'](session)

    def get_user_repository(self, session: Session) -> UserRepository:
        """Obtiene el repositorio de usuarios."""
        return self._repository_factories['user_repository'](session)

    def get_enhance_script_use_case(self, session: Session) -> EnhanceScriptUseCase:
        """Obtiene el caso de uso para mejorar scripts."""
        return EnhanceScriptUseCase(
            script_repository=self.get_script_repository(session),
            user_repository=self.get_user_repository(session),
            ai_service=self.get_openai_script_service()
        )

    def get_generate_audio_use_case(self, session: Session) -> GenerateAudioUseCase:
        """Obtiene el caso de uso para generar audio."""
        return GenerateAudioUseCase(
            script_repository=self.get_script_repository(session),
            user_repository=self.get_user_repository(session),
            audio_service=self.get_openai_audio_service(),
            storage_service=self.get_storage_service()
        )


# Mock services para desarrollo/testing
class MockOpenAIScriptService:
    """Mock service para OpenAI scripts."""

    async def enhance_script(self, *args, **kwargs):
        return {
            "script_mejorado": "Script mejorado (mock)",
            "duracion_estimada": 30,
            "segmentos": [
                {"texto": "Hook mock", "duracion": 10, "tipo": "hook"},
                {"texto": "Contenido mock", "duracion": 20, "tipo": "contenido"}
            ],
            "keywords": ["mock", "test"],
            "mejoras": ["Mejora mock 1", "Mejora mock 2"]
        }

    async def generate_keywords(self, text: str, max_keywords: int = 10):
        return ["keyword1", "keyword2", "keyword3"]


class MockOpenAIAudioService:
    """Mock service para OpenAI audio."""

    async def generate_speech(self, *args, **kwargs):
        return b"mock audio data"

    async def transcribe_audio(self, *args, **kwargs):
        return "Mock transcription text"


class MockSupabaseClient:
    """Mock client para Supabase."""

    async def verify_jwt_token(self, token: str):
        return {
            "id": "mock-user-id",
            "email": "mock@example.com",
            "user_metadata": {},
            "app_metadata": {}
        }


class MockStorageService:
    """Mock service para storage."""

    async def upload_file(self, *args, **kwargs):
        return "https://mock-storage.com/file.mp3"

    async def download_file(self, *args, **kwargs):
        return b"mock file data"

    async def delete_file(self, *args, **kwargs):
        return True

    async def get_public_url(self, *args, **kwargs):
        return "https://mock-storage.com/public/file.mp3"

    async def create_signed_url(self, *args, **kwargs):
        return "https://mock-storage.com/signed/file.mp3"


class SupabaseStorageService(StorageService):
    """Implementación del servicio de storage usando Supabase."""

    def __init__(self, supabase_client: SupabaseClient):
        self.client = supabase_client

    async def upload_file(self, bucket: str, file_path: str, file_data: bytes, content_type: str = None):
        return await self.client.upload_file(bucket, file_path, file_data, content_type)

    async def download_file(self, bucket: str, file_path: str):
        return await self.client.download_file(bucket, file_path)

    async def delete_file(self, bucket: str, file_path: str):
        return await self.client.delete_file(bucket, file_path)

    async def get_public_url(self, bucket: str, file_path: str):
        return self.client.get_public_url(bucket, file_path)

    async def create_signed_url(self, bucket: str, file_path: str, expires_in: int = 3600):
        return await self.client.create_signed_url(bucket, file_path, expires_in)


# Instancia global del container
container = DependencyContainer()


# Dependency functions para FastAPI
async def get_container() -> DependencyContainer:
    """Dependency para obtener el container."""
    if not container._initialized:
        container.initialize()
    return container


async def get_enhance_script_use_case(
    db: Session = next(get_db()),
    container: DependencyContainer = get_container()
) -> EnhanceScriptUseCase:
    """Dependency para obtener el caso de uso de mejora de scripts."""
    return container.get_enhance_script_use_case(db)


async def get_generate_audio_use_case(
    db: Session = next(get_db()),
    container: DependencyContainer = get_container()
) -> GenerateAudioUseCase:
    """Dependency para obtener el caso de uso de generación de audio."""
    return container.get_generate_audio_use_case(db)


# Utilities para obtener servicios específicos
async def get_script_repository(
    db: Session = next(get_db()),
    container: DependencyContainer = get_container()
) -> ScriptRepository:
    """Dependency para obtener el repositorio de scripts."""
    return container.get_script_repository(db)


async def get_user_repository(
    db: Session = next(get_db()),
    container: DependencyContainer = get_container()
) -> UserRepository:
    """Dependency para obtener el repositorio de usuarios."""
    return container.get_user_repository(db)


# Health check functions
async def check_services_health() -> dict:
    """Verifica el estado de todos los servicios."""
    health_status = {
        "database": "unknown",
        "openai": "unknown",
        "supabase": "unknown",
        "overall": "unknown"
    }

    try:
        # Check database
        from app.core.database import db_manager
        if db_manager.engine:
            health_status["database"] = "healthy"
        else:
            health_status["database"] = "unhealthy"

        # Check OpenAI
        if settings.openai_configured:
            openai_service = container.get_openai_script_service()
            if hasattr(openai_service, 'client'):
                health_status["openai"] = "healthy"
            else:
                health_status["openai"] = "mock"
        else:
            health_status["openai"] = "not_configured"

        # Check Supabase
        if settings.supabase_configured:
            supabase_client = container.get_supabase_client()
            if await supabase_client.health_check():
                health_status["supabase"] = "healthy"
            else:
                health_status["supabase"] = "unhealthy"
        else:
            health_status["supabase"] = "not_configured"

        # Overall health
        critical_services = ["database"]
        if all(health_status[service] == "healthy" for service in critical_services):
            health_status["overall"] = "healthy"
        else:
            health_status["overall"] = "degraded"

    except Exception as e:
        logger.error(f"Error checking services health: {str(e)}")
        health_status["overall"] = "unhealthy"

    return health_status