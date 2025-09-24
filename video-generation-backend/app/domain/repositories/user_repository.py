"""
User repository interface
"""
from abc import abstractmethod
from typing import List, Optional
from datetime import datetime

from .base import BaseRepository
from ..entities.user import User, SubscriptionTier, UserStatus


class UserRepository(BaseRepository[User]):
    """Interfaz del repositorio para usuarios."""

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """Obtiene un usuario por email."""
        pass

    @abstractmethod
    async def get_by_supabase_id(self, supabase_id: str) -> Optional[User]:
        """Obtiene un usuario por ID de Supabase."""
        pass

    @abstractmethod
    async def get_by_stripe_customer_id(self, stripe_customer_id: str) -> Optional[User]:
        """Obtiene un usuario por ID de cliente de Stripe."""
        pass

    @abstractmethod
    async def update_subscription(self, user_id: str, tipo_suscripcion: SubscriptionTier) -> bool:
        """Actualiza el tipo de suscripción de un usuario."""
        pass

    @abstractmethod
    async def update_usage(self, user_id: str, videos_generados: int) -> bool:
        """Actualiza el contador de uso de un usuario."""
        pass

    @abstractmethod
    async def increment_monthly_usage(self, user_id: str) -> bool:
        """Incrementa el uso mensual de un usuario."""
        pass

    @abstractmethod
    async def reset_monthly_usage(self, user_ids: List[str]) -> bool:
        """Resetea el uso mensual de usuarios (para tarea programada)."""
        pass

    @abstractmethod
    async def get_users_by_subscription(self, tipo_suscripcion: SubscriptionTier) -> List[User]:
        """Obtiene usuarios por tipo de suscripción."""
        pass

    @abstractmethod
    async def get_active_users(self, limit: int = 100) -> List[User]:
        """Obtiene usuarios activos."""
        pass

    @abstractmethod
    async def get_inactive_users(self, days_inactive: int = 30) -> List[User]:
        """Obtiene usuarios inactivos por X días."""
        pass

    @abstractmethod
    async def update_last_activity(self, user_id: str, timestamp: datetime) -> bool:
        """Actualiza la última actividad de un usuario."""
        pass

    @abstractmethod
    async def change_user_status(self, user_id: str, estado: UserStatus) -> bool:
        """Cambia el estado de un usuario."""
        pass

    @abstractmethod
    async def get_user_stats(self, user_id: str) -> dict:
        """Obtiene estadísticas de un usuario."""
        pass

    @abstractmethod
    async def search_users(self, query: str, limit: int = 50) -> List[User]:
        """Busca usuarios por email o nombre."""
        pass
