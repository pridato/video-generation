from datetime import datetime
from decimal import Decimal
from app.domain.entities.credit import CreditTransaction, TransactionType


class CreditTransactionModel:
    def __init__(self, data: dict):
        self.id = data.get('id')
        self.user_id = data['user_id']
        self.video_id = data.get('video_id')
        self.transaction_type = data['transaction_type']
        self.amount = data['amount']
        self.credits_before = data['credits_before']
        self.credits_after = data['credits_after']
        self.stripe_payment_id = data.get('stripe_payment_id')
        self.stripe_refund_id = data.get('stripe_refund_id')
        self.credit_pack_id = data.get('credit_pack_id')
        self.price_paid_eur = Decimal(str(data.get('price_paid_eur', 0)))
        self.description = data.get('description')
        self.metadata = data.get('metadata') or {}
        self.created_at = datetime.fromisoformat(data['created_at'].replace(
            'Z', '+00:00')) if data.get('created_at') else None

    def to_entity(self) -> CreditTransaction:
        return CreditTransaction(
            id=self.id,
            user_id=self.user_id,
            video_id=self.video_id,
            transaction_type=TransactionType(self.transaction_type),
            amount=self.amount,
            credits_before=self.credits_before,
            credits_after=self.credits_after,
            stripe_payment_id=self.stripe_payment_id,
            stripe_refund_id=self.stripe_refund_id,
            credit_pack_id=self.credit_pack_id,
            price_paid_eur=self.price_paid_eur,
            description=self.description,
            metadata=self.metadata,
            created_at=self.created_at
        )
