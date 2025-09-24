"""
Base repository interface following Repository pattern
"""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Dict, Any

T = TypeVar('T')


class BaseRepository(ABC, Generic[T]):
    """Interfaz base para todos los repositorios."""

    @abstractmethod
    async def create(self, entity: T) -> T:
        """Crea una nueva entidad."""
        pass

    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[T]:
        """Obtiene una entidad por su ID."""
        pass

    @abstractmethod
    async def update(self, entity: T) -> T:
        """Actualiza una entidad existente."""
        pass

    @abstractmethod
    async def delete(self, id: str) -> bool:
        """Elimina una entidad por su ID."""
        pass

    @abstractmethod
    async def get_all(self, limit: int = 100, offset: int = 0) -> List[T]:
        """Obtiene todas las entidades con paginación."""
        pass

    @abstractmethod
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Cuenta el número de entidades que coinciden con los filtros."""
        pass

    @abstractmethod
    async def exists(self, id: str) -> bool:
        """Verifica si existe una entidad con el ID dado."""
        pass