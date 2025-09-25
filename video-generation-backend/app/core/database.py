from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator
import logging

from app.core.config import settings


logger = logging.getLogger(__name__)


class DatabaseManager:
    """Maneja las conexiones a la base de datos."""

    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.Base = declarative_base()

    def initialize(self, database_url: str = ""):
        """
        Inicializa la conexión a la base de datos.

        Args: 
            database_url (str): URL de la base de datos. Si no se proporciona, se usa la configuración por defecto.
        """

        database_url = database_url or settings.DATABASE_URL

        self.engine = create_async_engine(
            database_url,
            echo=settings.DEBUG,
            pool_size=10,
            max_overflow=20
        )

        self.AsyncSessionLocal = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )

        logger.info(f"Database initialized with URL: {database_url}")

    async def create_tables(self):
        """
        Crea las tablas en la base de datos.

        Raises:
            RuntimeError: Si la base de datos no ha sido inicializada.
        """
        if self.engine is None:
            raise RuntimeError(
                "Database not initialized. Call initialize() first.")

        async with self.engine.begin() as conn:
            await conn.run_sync(self.Base.metadata.create_all)

        logger.info("Database tables created")

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Obtiene una sesión de base de datos.

        Yields:
            AsyncGenerator[AsyncSession, None]: Generador asíncrono de sesiones de base de datos.
        """
        async with self.AsyncSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()


# Instancia global del manejador de base de datos
db_manager = DatabaseManager()

# Base para los modelos
Base = db_manager.Base


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Generador de dependencias para obtener una sesión de base de datos.

    Yields:
        AsyncGenerator[AsyncSession, None]: Generador asíncrono de sesiones de base de datos.
    """
    async for session in db_manager.get_session():
        yield session
