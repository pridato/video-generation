"""
Entidad de dominio para la gestión de usuarios.
"""
from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from enum import Enum

# --------------------------------------------------------------
#                  Tipos Auxiliares para Usuario
# --------------------------------------------------------------


class SubscriptionTier(str, Enum):
    """
    Niveles de suscripción disponibles.
    """
    FREE = "gratuito"
    BASIC = "basico"
    PREMIUM = "premium"
    BUSINESS = "empresarial"


class UserStatus(str, Enum):
    """
    Estado del usuario en el sistema.
    """
    ACTIVE = "activo"
    INACTIVE = "inactivo"
    SUSPENDED = "suspendido"
    BLOCKED = "bloqueado"


@dataclass
class UserLimits:
    """
    Limites de uso por tipo de suscripción.
    """
    videos_per_month: int
    max_video_duration: int  # segundos
    templates_premium: bool
    priority_support: bool
    advanced_analytics: bool


# --------------------------------------------------------------
#                  Entidad Principal: Usuario
# --------------------------------------------------------------


@dataclass
class User:
    """Entidad que representa un usuario del sistema."""
    id: str  # UUID de Supabase
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    subscription_tier: SubscriptionTier
    status: UserStatus
    videos_generated_current_month: int
    total_videos_generated: int
    registration_date: datetime
    last_activity: Optional[datetime]
    stripe_customer_id: Optional[str]
    preferences: dict  # JSON con preferencias del usuario

    @property
    def limits(self) -> UserLimits:
        """
        Retorna los límites basados en el tipo de suscripción.

        Returns:
            UserLimits: Límites correspondientes al tipo de suscripción.
        """
        limits_per_tier = {
            SubscriptionTier.FREE: UserLimits(
                videos_per_month=3,
                max_video_duration=30,
                templates_premium=False,
                priority_support=False,
                advanced_analytics=False
            ),
            SubscriptionTier.BASIC: UserLimits(
                videos_per_month=10,
                max_video_duration=60,
                templates_premium=False,
                priority_support=False,
                advanced_analytics=False
            ),
            SubscriptionTier.PREMIUM: UserLimits(
                videos_per_month=50,
                max_video_duration=120,
                templates_premium=True,
                priority_support=True,
                advanced_analytics=True
            ),
            SubscriptionTier.BUSINESS: UserLimits(
                videos_per_month=200,
                max_video_duration=300,
                templates_premium=True,
                priority_support=True,
                advanced_analytics=True
            )
        }
        return limits_per_tier[self.subscription_tier]

    def can_generate_video(self) -> bool:
        """
        Verifica si el usuario puede generar un video.

        Returns:
            bool: True si puede generar un video, False en caso contrario.
        """
        return (
            self.status == UserStatus.ACTIVE and
            self.videos_generated_current_month < self.limits.videos_per_month
        )

    def can_use_duration(self, duration: int) -> bool:
        """
        Verifica si el usuario puede usar la duración solicitada.

        Args:
            duration (int): Duración del video en segundos.

        Returns:
            bool: True si puede usar la duración, False en caso contrario.
        """
        return duration <= self.limits.max_video_duration

    def increase_monthly_usage(self) -> None:
        """
        Incrementa el contador de videos generados este mes.
        """
        self.videos_generated_current_month += 1
        self.total_videos_generated += 1
        self.last_activity = datetime.utcnow()

    def is_premium(self) -> bool:
        """
        Verifica si el usuario tiene suscripción premium o superior.

        Returns:
            bool: True si es premium o empresarial, False en caso contrario.
        """
        return self.subscription_tier in [SubscriptionTier.PREMIUM, SubscriptionTier.BUSINESS]

    def update_activity(self) -> None:
        """
        Actualiza la fecha de última actividad.
        """
        self.last_activity = datetime.utcnow()
