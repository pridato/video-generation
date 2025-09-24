"""
Entidad de dominio para la gestión de clips de video.
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

# --------------------------------------------------------------
#                  Tipos Auxiliares para Créditos
# --------------------------------------------------------------


class TransactionType(str, Enum):
    """Tipos de transacciones de créditos."""
    PURCHASE = "purchase"
    USAGE = "usage"
    GIFT = "gift"
    MONTHLY_RESET = "monthly_reset"
    REFUND = "refund"


@dataclass
class CreditTransaction:
    """Entidad que representa una transacción de créditos."""
    id: Optional[str]
    user_id: str
    video_id: Optional[str]
    transaction_type: TransactionType
    amount: int  # positivo = suma, negativo = resta
    credits_before: int
    credits_after: int
    stripe_payment_id: Optional[str] = None
    stripe_refund_id: Optional[str] = None
    credit_pack_id: Optional[str] = None
    price_paid_eur: Optional[Decimal] = None
    description: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: Optional[datetime] = None

    def __post_init__(self):
        """
        Asegura que el campo metadata sea un diccionario.
        """
        if self.metadata is None:
            self.metadata = {}

# --------------------------------------------------------------
#                  Entidad Principal: CreditTransaction
# --------------------------------------------------------------


@dataclass
class CreditPackage:
    """Entidad que representa un paquete de créditos para compra."""
    id: str  # pack_10, pack_25, etc.
    name: str
    description: Optional[str]
    credits: int
    price_eur: Decimal
    discount_percentage: float = 0.0
    is_popular: bool = False
    is_active: bool = True
    display_order: int = 0
    stripe_price_id: Optional[str] = None
    marketing_label: Optional[str] = None
    theme_color: str = "#007bff"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @property
    def price_per_credit(self) -> Decimal:
        """
        Calcula el precio por crédito.

        Returns:
            Decimal: Precio por crédito.
        """
        if self.credits == 0:
            return Decimal('0')
        return self.price_eur / self.credits

    @property
    def savings_vs_base(self) -> Decimal:
        """
        Calcula el ahorro vs precio base ($1 por crédito).

        Returns:
            Decimal: Ahorro en euros.
        """
        base_price = Decimal('1.0') * self.credits
        return base_price - self.price_eur


@dataclass
class UserCreditBalance:
    """Balance actual de créditos de un usuario."""
    user_id: str
    credits_current: int
    credits_used_this_month: int
    credits_limit_per_month: int
    last_credits_reset: Optional[datetime]
    total_credits_purchased: int
    total_spent_eur: Decimal
    can_purchase_more: bool
    days_until_reset: int

    @property
    def credits_remaining(self) -> int:
        """
        Créditos disponibles para usar.

        Returns:
            int: Créditos restantes.
        """
        return max(0, self.credits_limit_per_month - self.credits_used_this_month)

    @property
    def usage_percentage(self) -> float:
        """
        Porcentaje de uso del límite mensual.

        Returns:
            float: Porcentaje de uso.
        """
        if self.credits_limit_per_month == 0:
            return 0.0
        return (self.credits_used_this_month / self.credits_limit_per_month) * 100
