from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import logging

from .config import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Maneja las conexiones a la base de datos."""

    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.Base = declarative_base()

    def initialize(self, database_url: str = None):
        """Inicializa la conexión a la base de datos."""
        if not database_url:
            # Para desarrollo local con SQLite
            database_url = "sqlite:///./video_generation.db"

        self.engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False} if "sqlite" in database_url else {}
        )

        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        logger.info(f"Database initialized with URL: {database_url}")

    def create_tables(self):
        """Crea las tablas en la base de datos."""
        self.Base.metadata.create_all(bind=self.engine)
        logger.info("Database tables created")

    def get_session(self) -> Generator[Session, None, None]:
        """Obtiene una sesión de base de datos."""
        if not self.SessionLocal:
            raise RuntimeError("Database not initialized. Call initialize() first.")

        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()


# Instancia global del manejador de base de datos
db_manager = DatabaseManager()

# Base para los modelos
Base = db_manager.Base


def get_db() -> Generator[Session, None, None]:
    """Dependency para obtener una sesión de base de datos."""
    yield from db_manager.get_session()