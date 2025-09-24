"""
Script repository interface
"""
from abc import abstractmethod
from typing import List, Optional
from datetime import datetime

from .base import BaseRepository
from ..entities.script import Script


class ScriptRepository(BaseRepository[Script]):
    """Interfaz del repositorio para scripts."""

    @abstractmethod
    async def get_by_user_id(self, user_id: str, limit: int = 10, offset: int = 0) -> List[Script]:
        """Obtiene scripts por ID de usuario."""
        pass

    @abstractmethod
    async def get_by_categoria(self, categoria: str, limit: int = 10) -> List[Script]:
        """Obtiene scripts por categoría."""
        pass

    @abstractmethod
    async def search_by_content(self, query: str, user_id: Optional[str] = None) -> List[Script]:
        """Busca scripts por contenido usando embeddings."""
        pass

    @abstractmethod
    async def get_similar_scripts(self, embedding: List[float], limit: int = 5) -> List[Script]:
        """Obtiene scripts similares usando búsqueda vectorial."""
        pass

    @abstractmethod
    async def get_recent_by_user(self, user_id: str, days: int = 30) -> List[Script]:
        """Obtiene scripts recientes de un usuario."""
        pass

    @abstractmethod
    async def update_embedding(self, script_id: str, embedding: List[float]) -> bool:
        """Actualiza el embedding de un script."""
        pass

    @abstractmethod
    async def get_scripts_without_embeddings(self, limit: int = 100) -> List[Script]:
        """Obtiene scripts que no tienen embeddings para procesamiento batch."""
        pass

    @abstractmethod
    async def get_popular_by_category(self, categoria: str, limit: int = 10) -> List[Script]:
        """Obtiene scripts populares por categoría."""
        pass

    @abstractmethod
    async def count_by_user(self, user_id: str, date_from: Optional[datetime] = None) -> int:
        """Cuenta scripts de un usuario desde una fecha."""
        pass