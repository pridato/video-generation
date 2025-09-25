"""
User repository interface
"""
from abc import abstractmethod
from re import A
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select

from .base import BaseRepository
from ..entities.user import User, SubscriptionTier, UserStatus


class UserRepository(BaseRepository[User]):
    """
    Repositorio para gestionar usuarios.
    Hereda CRUD básico + métodos específicos de usuario.
    """

    @property
    def _model(self) -> type:
        return User

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Busca un usuario por su email

        Args:
            email (str): Email del usuario a buscar.

        Returns:
            Optional[User]: Usuario encontrado o None si no existe.
        """
        pass

    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[User]:
        """
        Obtiene un usuario por ID de Supabase.

        Args:
            id (str): ID del usuario.

        Returns:
            Optional[User]: Usuario encontrado o None si no existe.
        """
        pass

    @abstractmethod
    async def get_by_stripe_customer_id(self, stripe_customer_id: str) -> Optional[User]:
        """
        Obtiene un usuario por ID de cliente de Stripe.

        Args:
            stripe_customer_id (str): ID de cliente de Stripe.

        Returns:
            Optional[User]: Usuario encontrado o None si no existe.
        """
        pass

    @abstractmethod
    async def update_subscription(self, user_id: str, subscription_tier: SubscriptionTier) -> bool:
        """
        Actualiza el tipo de suscripción de un usuario.

        Args:
            user_id (str): ID del usuario.
            tipo_suscripcion (SubscriptionTier): Nuevo tipo de suscripción.

        Returns:
            bool: True si la actualización fue exitosa, False en caso contrario.
        """
        pass

    @abstractmethod
    async def update_usage(self, user_id: str, generated_videos: int) -> bool:
        """
        Actualiza el contador de uso de un usuario.

        Args:
            user_id (str): ID del usuario.
            generated_videos (int): Número de videos generados a sumar.

        Returns:
            bool: True si la actualización fue exitosa, False en caso contrario.
        """
        pass

    @abstractmethod
    async def increment_monthly_usage(self, user_id: str) -> bool:
        """
        Incrementa el uso mensual de un usuario.

        Args:
            user_id (str): ID del usuario.

        Returns:
            bool: True si la actualización fue exitosa, False en caso contrario.
        """
        pass

    @abstractmethod
    async def reset_monthly_usage(self, user_ids: List[str]) -> bool:
        """
        Resetea el uso mensual de usuarios (para tarea programada).

        Args:
            user_ids (List[str]): Lista de IDs de usuarios.

        Returns:
            bool: True si la actualización fue exitosa, False en caso contrario.
        """
        pass

    @abstractmethod
    async def get_users_by_subscription(self, subscription_tier: SubscriptionTier) -> List[User]:
        """
        Obtiene usuarios por tipo de suscripción.

        Args:
            subscription_tier (SubscriptionTier): Tipo de suscripción.

        Returns:
            List[User]: Lista de usuarios con el tipo de suscripción dado.
        """
        pass

    @abstractmethod
    async def get_active_users(self, limit: int = 100) -> List[User]:
        """
        Obtiene usuarios activos.

        Args:
            limit (int): Número máximo de usuarios a retornar. 100 por defecto.

        Returns:
            List[User]: Lista de usuarios activos.
        """
        pass

    @abstractmethod
    async def get_inactive_users(self, days_inactive: int = 30) -> List[User]:
        """
        Obtiene usuarios inactivos por X días.

        Args:
            days_inactive (int): Número de días sin actividad para considerar inactivo. 30 por defecto.

        Returns:
            List[User]: Lista de usuarios inactivos.
        """
        pass

    @abstractmethod
    async def search_users(self, query: str, limit: int = 50) -> List[User]:
        """
        Busca usuarios por id, email o nombre.

        Args:
            query (str): Cadena de búsqueda.
            limit (int): Número máximo de resultados a retornar. 50 por defecto.

        Returns:
            List[User]: Lista de usuarios que coinciden con la búsqueda.
        """
        pass
