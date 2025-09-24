"""
Modelo de paquete de créditos para la base de datos.
"""

from datetime import datetime
from decimal import Decimal
from app.domain.entities.credit import CreditPackage


class CreditPackageModel:
    def __init__(self, data: dict):
        self.id = data['id']
        self.name = data['name']
        self.description = data.get('description')
        self.credits = data['credits']
        self.price_eur = Decimal(str(data['price_eur']))
        self.discount_percentage = float(data.get('discount_percentage') or 0)
        self.is_popular = data.get('is_popular', False)
        self.is_active = data.get('is_active', True)
        self.display_order = data.get('display_order', 0)
        self.stripe_price_id = data.get('stripe_price_id')
        self.marketing_label = data.get('marketing_label')
        self.theme_color = data.get('theme_color', '#007bff')
        self.created_at = datetime.fromisoformat(data['created_at'].replace(
            'Z', '+00:00')) if data.get('created_at') else None
        self.updated_at = datetime.fromisoformat(data['updated_at'].replace(
            'Z', '+00:00')) if data.get('updated_at') else None

    def to_entity(self) -> CreditPackage:
        return CreditPackage(
            id=self.id,
            name=self.name,
            description=self.description,
            credits=self.credits,
            price_eur=self.price_eur,
            discount_percentage=self.discount_percentage,
            is_popular=self.is_popular,
            is_active=self.is_active,
            display_order=self.display_order,
            stripe_price_id=self.stripe_price_id,
            marketing_label=self.marketing_label,
            theme_color=self.theme_color,
            created_at=self.created_at,
            updated_at=self.updated_at
        )
