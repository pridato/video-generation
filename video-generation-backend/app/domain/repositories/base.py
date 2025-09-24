"""
Base repository interface following Repository pattern
"""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Dict, Any
from sqlalchemy import func, select
from sqlalchemy.orm import Session

T = TypeVar('T')  # Tipo genérico para las entidades


class BaseRepository(ABC, Generic[T]):
    """
    Repositorio base con operaciones CRUD comunes.
    Evita duplicar código en todos los repositorios específicos.

    Args:
        T: Tipo de la entidad que maneja el repositorio.
    """

    def __init__(self, session: Session):
        """
        Inicializa el repositorio con una sesión de base de datos.

        Raises:
            ValueError: Si la sesión no es proporcionada.
        """
        self.session = session
        if not self.session:
            raise ValueError("Session must be provided")

    @property
    @abstractmethod
    def _model(self) -> type:
        """Modelo de la entidad específica"""
        pass

    def create(self, entity: T) -> T:
        """
        Crea una nueva entidad.

        Args:
            entity (T): La entidad a crear.

        Returns:
            T: La entidad creada con ID asignado.
        """
        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        return entity

    async def get_by_id(self, id: str) -> Optional[T]:
        """
        Obtiene una entidad por su ID.

        Args:
            id (str): ID de la entidad a obtener.

        Returns:
            Optional[T]: La entidad si se encuentra, None en caso contrario.
        """
        return self.session.get(self._model, id)

    async def get_all(self, limit: int = 100, offset: int = 0) -> List[T]:
        """
        Obtiene todas las entidades con paginación.

        Args:
            limit (int): Número máximo de entidades a retornar. 100 por defecto.
            offset (int): Número de entidades a omitir. 0 por defecto.

        Returns:
            List[T]: Lista de entidades.
        """
        result = self.session.execute(
            select(self._model).limit(limit).offset(offset))
        return list(result.scalars())

    async def update(self, entity: T) -> T:
        """
        Actualiza una entidad existente.

        Args:
            entity (T): La entidad a actualizar.

        Returns:
            T: La entidad actualizada.
        """
        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        return entity

    async def delete(self, id: str) -> bool:
        """
        Elimina una entidad por su ID.

        Args:
            id (str): ID de la entidad a eliminar.

        Returns:
            bool: True si la entidad fue eliminada, False si no se encontró.
        """
        entity = await self.get_by_id(id)
        if entity:
            self.session.delete(entity)
            self.session.commit()
            return True
        return False

    async def exists(self, id: str) -> bool:
        """
        Verifica si existe una entidad con el ID dado.

        Args:
            id (str): ID de la entidad a verificar.

        Returns:
            bool: True si la entidad existe, False en caso contrario.
        """
        entity = await self.get_by_id(id)
        return entity is not None

    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Cuenta el número de entidades que coinciden con los filtros.

        Args:
            filters (Optional[Dict[str, Any]]): Diccionario de filtros para aplicar.

        Returns:
            int: Número de entidades que coinciden con los filtros.
        """
        query = select(func.count()).select_from(self._model)
        if filters:
            for attr, value in filters.items():
                query = query.where(getattr(self._model, attr) == value)
        result = self.session.execute(query).scalar_one()
        return result or 0
