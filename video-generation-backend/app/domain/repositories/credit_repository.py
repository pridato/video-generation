"""
Interfaz del repositorio para gestión de créditos.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

from ..entities.credit import CreditTransaction, CreditPackage, UserCreditBalance


class CreditRepository(ABC):
    """Interfaz del repositorio para créditos."""

    @property
    def _model(self) -> type:
        return UserCreditBalance

    @abstractmethod
    async def consume_credits(
        self,
        user_id: str,
        video_id: str,
        credits: int,
        description: str = "Video generation"
    ) -> UserCreditBalance:
        """
        Consume créditos del usuario para generar un video.

        Args:
            user_id (str): ID del usuario.
            video_id (str): ID del video generado.
            credits (int): Número de créditos a consumir.
            description (str): Descripción de la transacción. Default es "Video generation".

        Returns:
            UserCreditBalance: Información del balance de créditos actualizado.
        """
        pass

    @abstractmethod
    async def add_credits(
        self,
        user_id: str,
        credits: int,
        price_eur: Decimal = Decimal('0'),
        stripe_payment_id: Optional[str] = None,
        pack_id: Optional[str] = None,
        description: str = "Compra de créditos"
    ) -> UserCreditBalance:
        """
        Agrega créditos al usuario (compra).

        Args:
            user_id (str): ID del usuario.
            credits (int): Número de créditos a agregar.
            price_eur (Decimal): Precio pagado en EUR.
            stripe_payment_id (Optional[str]): ID del pago en Stripe.
            pack_id (Optional[str]): ID del paquete de créditos comprado.

        Returns:
            UserCreditBalance: Información del balance de créditos actualizado.
        """
        pass

    @abstractmethod
    async def get_user_credit_balance(self, user_id: str) -> UserCreditBalance:
        """
        Obtiene el balance actual de créditos del usuario.

        Args:
            user_id (str): ID del usuario.

        Returns:
            UserCreditBalance: Información del balance de créditos del usuario.
        """
        pass

    @abstractmethod
    async def get_credit_history(
        self,
        user_id: str,
        limit: int = 50,
        transaction_type: Optional[str] = None
    ) -> List[CreditTransaction]:
        """
        Obtiene el historial de transacciones de créditos

        Args:
            user_id (str): ID del usuario.
            limit (int): Número máximo de transacciones a retornar.
            transaction_type (Optional[str]): Filtrar por tipo de transacción (compra, consumo, reembolso).

        Returns:
            List[CreditTransaction]: Lista de transacciones de créditos del usuario indicado.
        """
        pass

    @abstractmethod
    async def get_available_packages(self) -> List[CreditPackage]:
        """
        Obtiene los paquetes de créditos disponibles.

        Returns:
            List[CreditPackage]: Lista de paquetes de créditos.
        """
        pass

    @abstractmethod
    async def create_transaction(self, transaction: CreditTransaction) -> CreditTransaction:
        """
        Crea una nueva transacción de créditos.

        Args:
            transaction (CreditTransaction): Datos de la transacción a crear.

        Returns:
            CreditTransaction: Datos de la transacción creada.
        """
        pass

    @abstractmethod
    async def get_monthly_usage_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Obtiene estadísticas de uso mensual del usuario.

        Args:
            user_id (str): ID del usuario.

        Returns:
            Dict[str, Any]: Estadísticas de uso mensual.
        """
        pass

    @abstractmethod
    async def reset_monthly_credits(self, user_ids: Optional[List[str]] = None) -> int:
        """
        Resetea los créditos mensuales (tarea programada).

        Args:
            user_ids (Optional[List[str]]): Lista de IDs de usuarios a resetear. Si
                es None, resetea para todos los usuarios.

        Returns:
            int: Número de usuarios cuyo crédito mensual fue reseteado.
        """
        pass
