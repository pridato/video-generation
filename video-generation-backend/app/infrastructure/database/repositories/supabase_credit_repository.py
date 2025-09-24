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
    ) -> Dict[str, Any]:
        try:
            result = self.client.rpc(
                'consume_credits',
                {
                    'p_user_id': user_id,
                    'p_video_id': video_id,
                    'p_credits': credits,
                    'p_description': description
                }
            ).execute()

            if result.data:
                response_data = result.data
                logger.info(
                    f"Créditos consumidos exitosamente: {credits} para usuario {user_id}")
                return response_data
            else:
                raise ValueError("Error consumiendo créditos")

        except Exception as e:
            logger.error(f"Error consumiendo créditos: {str(e)}")
            raise

    async def add_credits(
        self,
        user_id: str,
        credits: int,
        price_eur: Decimal = Decimal('0'),
        stripe_payment_id: Optional[str] = None,
        pack_id: Optional[str] = None
    ) -> Dict[str, Any]:
        try:
            result = self.client.rpc(
                'add_credits',
                {
                    'p_user_id': user_id,
                    'p_credits': credits,
                    'p_price_usd': float(price_usd),
                    'p_stripe_payment_id': stripe_payment_id,
                    'p_pack_id': pack_id
                }
            ).execute()

            if result.data:
                logger.info(
                    f"Créditos agregados exitosamente: {credits} para usuario {user_id}")
                return result.data
            else:
                raise ValueError("Error agregando créditos")

        except Exception as e:
            logger.error(f"Error agregando créditos: {str(e)}")
            raise

    async def get_user_credit_balance(self, user_id: str) -> UserCreditBalance:
        """Obtiene el balance de créditos del usuario."""
        try:
            result = self.client.table('profiles').select(
                'credits_current, credits_used_this_month, credits_limit_per_month, '
                'last_credits_reset, total_credits_purchased, total_spent_usd, subscription_tier'
            ).eq('id', user_id).single().execute()

            if not result.data:
                raise ValueError(f"Usuario {user_id} no encontrado")

            data = result.data

            # Calcular días hasta el próximo reset
            last_reset = datetime.fromisoformat(
                data['last_credits_reset'].replace('Z', '+00:00'))
            next_reset = last_reset.replace(day=1) + timedelta(days=32)
            # Primer día del siguiente mes
            next_reset = next_reset.replace(day=1)
            days_until_reset = (next_reset - datetime.now()).days

            return UserCreditBalance(
                user_id=user_id,
                credits_current=data['credits_current'],
                credits_used_this_month=data['credits_used_this_month'],
                credits_limit_per_month=data['credits_limit_per_month'],
                last_credits_reset=last_reset,
                total_credits_purchased=data['total_credits_purchased'],
                total_spent_usd=Decimal(str(data['total_spent_usd'] or 0)),
                can_purchase_more=data['subscription_tier'] != 'free',
                days_until_reset=max(0, days_until_reset)
            )

        except Exception as e:
            logger.error(f"Error obteniendo balance de créditos: {str(e)}")
            raise

    async def get_credit_history(
        self,
        user_id: str,
        limit: int = 50,
        transaction_type: Optional[str] = None
    ) -> List[CreditTransaction]:
        """Obtiene el historial de transacciones."""
        try:
            query = self.client.table('credit_transactions').select(
                '*'
            ).eq('user_id', user_id).order('created_at', desc=True).limit(limit)

            if transaction_type:
                query = query.eq('transaction_type', transaction_type)

            result = query.execute()

            transactions = []
            for row in result.data:
                transaction = CreditTransaction(
                    id=row['id'],
                    user_id=row['user_id'],
                    video_id=row['video_id'],
                    transaction_type=TransactionType(row['transaction_type']),
                    amount=row['amount'],
                    credits_before=row['credits_before'],
                    credits_after=row['credits_after'],
                    stripe_payment_id=row['stripe_payment_id'],
                    stripe_refund_id=row['stripe_refund_id'],
                    credit_pack_id=row['credit_pack_id'],
                    price_paid_usd=Decimal(str(row['price_paid_usd'] or 0)),
                    description=row['description'],
                    metadata=row['metadata'] or {},
                    created_at=datetime.fromisoformat(
                        row['created_at'].replace('Z', '+00:00'))
                )
                transactions.append(transaction)

            return transactions

        except Exception as e:
            logger.error(f"Error obteniendo historial de créditos: {str(e)}")
            raise

    async def get_available_packages(self) -> List[CreditPackage]:
        """Obtiene los paquetes disponibles."""
        try:
            result = self.client.table('credit_packages').select(
                '*'
            ).eq('is_active', True).order('display_order').execute()

            packages = []
            for row in result.data:
                package = CreditPackage(
                    id=row['id'],
                    name=row['name'],
                    description=row['description'],
                    credits=row['credits'],
                    price_usd=Decimal(str(row['price_usd'])),
                    discount_percentage=float(row['discount_percentage'] or 0),
                    is_popular=row['is_popular'],
                    is_active=row['is_active'],
                    display_order=row['display_order'],
                    stripe_price_id=row['stripe_price_id'],
                    marketing_label=row['marketing_label'],
                    theme_color=row['theme_color'],
                    created_at=datetime.fromisoformat(
                        row['created_at'].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(row['updated_at'].replace(
                        'Z', '+00:00')) if row['updated_at'] else None
                )
                packages.append(package)

            return packages

        except Exception as e:
            logger.error(f"Error obteniendo paquetes de créditos: {str(e)}")
            raise

    async def create_transaction(self, transaction: CreditTransaction) -> CreditTransaction:
        """Crea una nueva transacción manualmente."""
        try:
            data = {
                'user_id': transaction.user_id,
                'video_id': transaction.video_id,
                'transaction_type': transaction.transaction_type.value,
                'amount': transaction.amount,
                'credits_before': transaction.credits_before,
                'credits_after': transaction.credits_after,
                'stripe_payment_id': transaction.stripe_payment_id,
                'stripe_refund_id': transaction.stripe_refund_id,
                'credit_pack_id': transaction.credit_pack_id,
                'price_paid_usd': float(transaction.price_paid_usd) if transaction.price_paid_usd else None,
                'description': transaction.description,
                'metadata': transaction.metadata
            }

            result = self.client.table(
                'credit_transactions').insert(data).execute()

            if result.data:
                row = result.data[0]
                transaction.id = row['id']
                transaction.created_at = datetime.fromisoformat(
                    row['created_at'].replace('Z', '+00:00'))
                logger.info(
                    f"Transacción de créditos creada: {transaction.id}")
                return transaction
            else:
                raise ValueError("Error creando transacción")

        except Exception as e:
            logger.error(f"Error creando transacción de créditos: {str(e)}")
            raise

    async def get_monthly_usage_stats(self, user_id: str) -> Dict[str, Any]:
        """Obtiene estadísticas de uso mensual."""
        try:
            # Obtener datos del usuario
            user_result = self.client.table('profiles').select(
                'credits_used_this_month, credits_limit_per_month, monthly_videos_used, '
                'total_videos_created, subscription_tier, last_credits_reset'
            ).eq('id', user_id).single().execute()

            if not user_result.data:
                raise ValueError(f"Usuario {user_id} no encontrado")

            user_data = user_result.data

            # Obtener transacciones del mes actual
            start_of_month = datetime.now().replace(
                day=1, hour=0, minute=0, second=0, microsecond=0)

            transactions_result = self.client.table('credit_transactions').select(
                'transaction_type, amount, created_at'
            ).eq('user_id', user_id).gte('created_at', start_of_month.isoformat()).execute()

            # Procesar estadísticas
            monthly_purchases = 0
            monthly_usage = 0
            monthly_spent = 0

            for tx in transactions_result.data:
                if tx['transaction_type'] == 'purchase':
                    monthly_purchases += tx['amount']
                elif tx['transaction_type'] == 'usage':
                    monthly_usage += abs(tx['amount'])

            # Obtener videos generados este mes
            videos_result = self.client.table('videos').select(
                'id, created_at, credits_consumed'
            ).eq('user_id', user_id).gte('created_at', start_of_month.isoformat()).execute()

            monthly_videos = len(videos_result.data)
            total_credits_spent_videos = sum(
                v.get('credits_consumed', 1) for v in videos_result.data)

            return {
                'user_id': user_id,
                'subscription_tier': user_data['subscription_tier'],
                'credits_used_this_month': user_data['credits_used_this_month'],
                'credits_limit_per_month': user_data['credits_limit_per_month'],
                'credits_remaining': user_data['credits_limit_per_month'] - user_data['credits_used_this_month'],
                'usage_percentage': (user_data['credits_used_this_month'] / user_data['credits_limit_per_month']) * 100,
                'monthly_videos_generated': monthly_videos,
                'monthly_purchases': monthly_purchases,
                'total_videos_all_time': user_data['total_videos_created'],
                'last_reset_date': user_data['last_credits_reset'],
                'transactions_this_month': len(transactions_result.data)
            }

        except Exception as e:
            logger.error(f"Error obteniendo estadísticas mensuales: {str(e)}")
            raise

    async def reset_monthly_credits(self, user_ids: Optional[List[str]] = None) -> int:
        """Resetea créditos mensuales usando la función de Supabase."""
        try:
            # Si se proporcionan user_ids específicos, resetear solo esos
            if user_ids:
                reset_count = 0
                for user_id in user_ids:
                    # Obtener datos actuales del usuario
                    user_result = self.client.table('profiles').select(
                        'credits_current, credits_limit_per_month'
                    ).eq('id', user_id).single().execute()

                    if user_result.data:
                        user_data = user_result.data

                        # Resetear créditos
                        self.client.table('profiles').update({
                            'credits_current': user_data['credits_limit_per_month'],
                            'credits_used_this_month': 0,
                            'monthly_videos_used': 0,
                            'last_credits_reset': datetime.now().isoformat()
                        }).eq('id', user_id).execute()

                        # Crear transacción de reset
                        await self.create_transaction(CreditTransaction(
                            id=None,
                            user_id=user_id,
                            video_id=None,
                            transaction_type=TransactionType.MONTHLY_RESET,
                            amount=user_data['credits_limit_per_month'] -
                            user_data['credits_current'],
                            credits_before=user_data['credits_current'],
                            credits_after=user_data['credits_limit_per_month'],
                            description="Monthly credits reset"
                        ))

                        reset_count += 1

                return reset_count
            else:
                # Usar la función de PostgreSQL para reset masivo
                result = self.client.rpc('reset_monthly_credits').execute()
                logger.info("Reset mensual de créditos ejecutado")
                return result.data or 0

        except Exception as e:
            logger.error(f"Error en reset mensual de créditos: {str(e)}")
            raise
