"""
Se refiere a la entidad User.
"""

from datetime import datetime
from app.domain.entities.user import User, SubscriptionTier, UserStatus, User
from app.domain.entities.credit import UserCreditBalance


class ProfileModel:
    def __init__(self, data: dict):
        self.id: str = data["id"]
        self.email: str = data["email"]
        self.full_name = data.get('full_name')
        self.avatar_url = data.get('avatar_url')
        self.subscription_tier = data.get('subscription_tier', 'free')
        self.subscription_status = data.get('subscription_status', 'inactive')
        self.monthly_videos_used = data.get('monthly_videos_used', 0)
        self.total_videos_created = data.get('total_videos_created', 0)
        self.created_at = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00')) \
            if data.get('created_at') else None
        self.last_video_created_at = datetime.fromisoformat(data['last_video_created_at'].replace('Z', '+00:00')) \
            if data.get('last_video_created_at') else None
        self.stripe_customer_id = data.get('stripe_customer_id')
        self.brand_colors = data.get('brand_colors') or {}
        self.preferred_language = data.get('preferred_language', 'es')
        self.content_niche = data.get('content_niche')
        self.target_audience = data.get('target_audience')
        self.credits_current = data.get('credits_current', 5)
        self.credits_used_this_month = data.get('credits_used_this_month', 0)
        self.credits_limit_per_month = data.get('credits_limit_per_month', 5)
        self.last_credits_reset = datetime.fromisoformat(data['last_credits_reset'].replace('Z', '+00:00')) \
            if data.get('last_credits_reset') else None
        self.total_credits_purchased = data.get('total_credits_purchased', 0)
        self.total_spent_eur = data.get('total_spent_eur', 0)

    def to_entity(self) -> User:
        return User(
            id=self.id,
            email=self.email,
            name=self.full_name,
            avatar_url=self.avatar_url,
            subscription_tier=SubscriptionTier(self.subscription_tier.upper()),
            status=UserStatus.ACTIVE if self.subscription_status == 'active' else UserStatus.INACTIVE,
            videos_generated_current_month=self.monthly_videos_used,
            total_videos_generated=self.total_videos_created,
            registration_date=self.created_at,
            last_activity=self.last_video_created_at,
            stripe_customer_id=self.stripe_customer_id,
            preferences={
                "brand_colors": self.brand_colors,
                "preferred_language": self.preferred_language,
                "content_niche": self.content_niche,
                "target_audience": self.target_audience,
                "credits_current": self.credits_current,
                "credits_used_this_month": self.credits_used_this_month,
                "credits_limit_per_month": self.credits_limit_per_month,
                "last_credits_reset": self.last_credits_reset,
                "total_credits_purchased": self.total_credits_purchased,
                "total_spent_eur": self.total_spent_eur
            }
        )

    def to_entity_user_credit_balance(self) -> UserCreditBalance:
        return UserCreditBalance(
            user_id=self.id,
            credits_current=self.credits_current,
            credits_used_this_month=self.credits_used_this_month,
            credits_limit_per_month=self.credits_limit_per_month,
            last_credits_reset=self.last_credits_reset,
            total_credits_purchased=self.total_credits_purchased,
            total_spent_eur=self.total_spent_eur,
            can_purchase_more=True,
            days_until_reset=30,
        )
