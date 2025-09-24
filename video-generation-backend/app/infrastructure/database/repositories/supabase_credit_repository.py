"""
Implementación del repositorio de créditos usando Supabase.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal

from app.domain.repositories.credit_repository import CreditRepository
from app.domain.entities.credit import CreditTransaction, CreditPackage, TransactionType, UserCreditBalance
from app.infrastructure.external.supabase.client import SupabaseClient
from app.infrastructure.database.models.profile_model import ProfileModel
from app.infrastructure.database.models.credit_transaction_model import CreditTransactionModel
from app.infrastructure.database.models.credit_package_model import CreditPackageModel

logger = logging.getLogger(__name__)


class SupabaseCreditRepository(CreditRepository):
    """Implementación del repositorio de créditos usando Supabase."""

    def __init__(self, supabase_client: SupabaseClient):
        self.client = supabase_client.client

    async def consume_credits(
        self,
        user_id: str,
        video_id: str,
        credits: int,
        description: str = "Video generation"
    ) -> UserCreditBalance:

        # Obtener balance actual
        balance = await self.get_user_credit_balance(user_id)
        credits_before = balance.credits_current

        if credits_before < credits:
            raise ValueError("Créditos insuficientes")

        # Calcular nuevo balance
        credits_after = credits_before - credits

        # Actualizar balance en la base de datos, al solo actualizar créditos, no es necesario un modelo
        self.client.table("profiles").update({
            "credits_current": credits_after,
            "credits_used_this_month": balance.credits_used_this_month + credits
        }).eq("id", user_id).execute()

        # Crear transacción
        transaction = CreditTransaction(
            id=None,
            user_id=user_id,
            video_id=video_id,
            transaction_type=TransactionType.USAGE,
            amount=-credits,
            credits_before=credits_before,
            credits_after=credits_after,
            price_paid_eur=Decimal("0.0"),
            description=description,
            created_at=datetime.utcnow()
        )

        await self.create_transaction(transaction)

        balance.credits_current = credits_after
        balance.credits_used_this_month += credits
        return balance

    async def add_credits(
        self,
        user_id: str,
        credits: int,
        price_eur: Decimal = Decimal('0'),
        stripe_payment_id: Optional[str] = None,
        pack_id: Optional[str] = None,
        description: str = "Compra de créditos"
    ) -> UserCreditBalance:

        # obtener balance actual
        balance = await self.get_user_credit_balance(user_id)
        credits_before = balance.credits_current
        credits_after = credits_before + credits

        # actualizar la tabla de usuarios
        self.client.table("profiles").update({
            "credits_current": credits_after,
            "total_credits_purchased": balance.total_credits_purchased + credits,
            # convertir a float para DB
            "total_spent_eur": float(balance.total_spent_eur + price_eur)
        }).eq("id", user_id).execute()

        # Crear transacción
        transaction = CreditTransaction(
            id=None,
            user_id=user_id,
            video_id=None,
            transaction_type=TransactionType.PURCHASE,
            amount=credits,
            credits_before=credits_before,
            credits_after=credits_after,
            stripe_payment_id=stripe_payment_id,
            credit_pack_id=pack_id,
            price_paid_eur=price_eur,
            description=description,
            created_at=datetime.utcnow()
        )

        await self.create_transaction(transaction)

        balance.credits_current = credits_after
        balance.total_credits_purchased += credits
        balance.total_spent_eur += price_eur
        return balance

    async def get_user_credit_balance(self, user_id: str) -> UserCreditBalance:
        try:
            result = self.client.table("profiles").select(
                "credits_current, credits_used_this_month, credits_limit_per_month, "
                "last_credits_reset, total_credits_purchased, total_spent_usd, subscription_tier"
            ).eq("id", user_id).single().execute()

            if not result.data:
                raise ValueError(f"Usuario {user_id} no encontrado")

            return ProfileModel(result.data).to_entity_user_credit_balance()

        except Exception as e:
            logger.error(f"Error obteniendo balance de créditos: {str(e)}")
            raise

    async def get_credit_history(
        self,
        user_id: str,
        limit: int = 50,
        transaction_type: Optional[str] = None
    ) -> List[CreditTransaction]:

        query = self.client.table("credit_transactions").select(
            "*").eq("user_id", user_id)

        if transaction_type:
            # si nos dan tipo, filtramos
            query = query.eq("type", transaction_type)

        query = query.order("created_at", desc=True).limit(limit)

        result = query.execute()
        return [CreditTransactionModel(tx).to_entity() for tx in result.data]

    async def get_available_packages(self) -> List[CreditPackage]:
        result = self.client.table("credit_packages").select("*").execute()
        return [CreditPackageModel(pkg).to_entity() for pkg in result.data]

    async def create_transaction(self, transaction: CreditTransaction) -> CreditTransaction:
        data = {
            "user_id": transaction.user_id,
            "video_id": transaction.video_id,
            "transaction_type": transaction.transaction_type.value,
            "amount": transaction.amount,
            "credits_before": transaction.credits_before,
            "credits_after": transaction.credits_after,
            "stripe_payment_id": transaction.stripe_payment_id,
            "stripe_refund_id": transaction.stripe_refund_id,
            "credit_pack_id": transaction.credit_pack_id,
            "price_paid_eur": float(transaction.price_paid_eur) if transaction.price_paid_eur else None,
            "description": transaction.description,
            "metadata": transaction.metadata,
            "created_at": (transaction.created_at or datetime.utcnow()).isoformat()
        }
        result = self.client.table(
            "credit_transactions").insert(data).execute()
        return CreditTransactionModel(result.data[0]).to_entity()

    async def get_monthly_usage_stats(self, user_id: str) -> Dict[str, Any]:
        balance = await self.get_user_credit_balance(user_id)
        return {
            "used_this_month": balance.credits_used_this_month,
            "limit_per_month": balance.credits_limit_per_month
        }

    async def reset_monthly_credits(self, user_ids: Optional[List[str]] = None) -> int:
        query = self.client.table("profiles")
        if user_ids:
            query = query.in_("id", user_ids)  # type: ignore
        result = query.update({
            "credits_used_this_month": 0,
            "last_credits_reset": datetime.utcnow()
        }).execute()
        return len(result.data)
