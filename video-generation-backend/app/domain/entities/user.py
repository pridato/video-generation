"""
Domain entities for user management
"""
from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from enum import Enum


class TipoSuscripcion(str, Enum):
    GRATUITO = "gratuito"
    BASICO = "basico"
    PREMIUM = "premium"
    EMPRESARIAL = "empresarial"


class EstadoUsuario(str, Enum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    SUSPENDIDO = "suspendido"
    BLOQUEADO = "bloqueado"


@dataclass
class LimitesUsuario:
    """Limites de uso por tipo de suscripción."""
    videos_por_mes: int
    duracion_maxima_video: int  # segundos
    templates_premium: bool
    soporte_prioritario: bool
    analytics_avanzado: bool


@dataclass
class Usuario:
    """Entidad que representa un usuario del sistema."""
    id: str  # UUID de Supabase
    email: str
    nombre: Optional[str]
    avatar_url: Optional[str]
    tipo_suscripcion: TipoSuscripcion
    estado: EstadoUsuario
    videos_generados_mes_actual: int
    total_videos_generados: int
    fecha_registro: datetime
    ultima_actividad: Optional[datetime]
    stripe_customer_id: Optional[str]
    preferencias: dict  # JSON con preferencias del usuario

    @property
    def limites(self) -> LimitesUsuario:
        """Retorna los límites basados en el tipo de suscripción."""
        limites_por_tipo = {
            TipoSuscripcion.GRATUITO: LimitesUsuario(
                videos_por_mes=3,
                duracion_maxima_video=30,
                templates_premium=False,
                soporte_prioritario=False,
                analytics_avanzado=False
            ),
            TipoSuscripcion.BASICO: LimitesUsuario(
                videos_por_mes=10,
                duracion_maxima_video=60,
                templates_premium=False,
                soporte_prioritario=False,
                analytics_avanzado=False
            ),
            TipoSuscripcion.PREMIUM: LimitesUsuario(
                videos_por_mes=50,
                duracion_maxima_video=120,
                templates_premium=True,
                soporte_prioritario=True,
                analytics_avanzado=True
            ),
            TipoSuscripcion.EMPRESARIAL: LimitesUsuario(
                videos_por_mes=200,
                duracion_maxima_video=300,
                templates_premium=True,
                soporte_prioritario=True,
                analytics_avanzado=True
            )
        }
        return limites_por_tipo[self.tipo_suscripcion]

    def puede_generar_video(self) -> bool:
        """Verifica si el usuario puede generar un video."""
        return (
            self.estado == EstadoUsuario.ACTIVO and
            self.videos_generados_mes_actual < self.limites.videos_por_mes
        )

    def puede_usar_duracion(self, duracion: int) -> bool:
        """Verifica si el usuario puede usar la duración solicitada."""
        return duracion <= self.limites.duracion_maxima_video

    def incrementar_uso_mensual(self) -> None:
        """Incrementa el contador de videos generados este mes."""
        self.videos_generados_mes_actual += 1
        self.total_videos_generados += 1
        self.ultima_actividad = datetime.utcnow()

    def es_premium(self) -> bool:
        """Verifica si el usuario tiene suscripción premium o superior."""
        return self.tipo_suscripcion in [TipoSuscripcion.PREMIUM, TipoSuscripcion.EMPRESARIAL]

    def actualizar_actividad(self) -> None:
        """Actualiza la fecha de última actividad."""
        self.ultima_actividad = datetime.utcnow()