from torch import ge
from app.domain.repositories.user_repository import UserRepository
from app.infrastructure.external.supabase.client import SupabaseClient
from app.domain.entities.user import SubscriptionTier, User
from app.infrastructure.database.models.profile_model import ProfileModel
from typing import Optional
import logging
from typing import List

logger = logging.getLogger(__name__)


class SupabaseUserRepository(UserRepository):
    def __init__(self, supabase_client: SupabaseClient):
        self.client = supabase_client.client

    async def get_by_email(self, email: str) -> Optional[User]:
        try:
            # buscamos el usuario por email
            result = self.client.table("profiles").select(
                "*").eq("email", email).single().execute()

            # si no hay datos, retornamos None
            if not result.data:
                return None

            # convertimos el resultado a entidad User
            return ProfileModel(result.data).to_entity()
        except Exception as e:
            logger.error(f"Error obteniendo usuario: {str(e)}")
            return None

    async def get_by_id(self, id: str) -> Optional[User]:
        try:
            result = self.client.table("profiles").select(
                "*").eq("id", id).single().execute()
            if not result.data:
                return None
            return ProfileModel(result.data).to_entity()
        except Exception as e:
            logger.error(f"Error obteniendo usuario: {str(e)}")
            return None

    async def get_by_stripe_customer_id(self, stripe_customer_id: str) -> Optional[User]:
        try:
            # buscamos el usuario por stripe_customer_id
            result = self.client.table("profiles").select(
                "*").eq("stripe_customer_id", stripe_customer_id).single().execute()
            # si no hay datos, retornamos None
            if not result.data:
                return None

            # convertimos el resultado a entidad User
            return ProfileModel(result.data).to_entity()
        except Exception as e:
            logger.error(f"Error obteniendo usuario: {str(e)}")
            return None

    async def update_subscription(self, user_id: str, subscription_tier: SubscriptionTier) -> bool:
        try:
            # actualizamos el campo subscription_tier del usuario
            result = self.client.table("profiles").update({
                "subscription_tier": subscription_tier.value.lower()
            }).eq("id", user_id).execute()

            # devolvemos True si se actualizó al menos un registro
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error actualizando suscripción: {str(e)}")
            return False

    async def update_usage(self, user_id: str, generated_videos: int) -> bool:
        try:
            # obtener user para consultar videos generados totales
            user = await self.get_by_id(user_id)
            if not user:
                return False

            total_videos_created = user.total_videos_generated + generated_videos

            # actualizamos el campo total_videos_created del usuario
            result = self.client.table("profiles").update({
                "total_videos_created": total_videos_created
            }).eq("id", user_id).execute()

            # devolvemos True si se actualizó al menos un registro
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error actualizando uso: {str(e)}")
            return False

    async def increment_monthly_usage(self, user_id: str) -> bool:
        try:
            # obtener user para consultar videos generados mensuales
            user = await self.get_by_id(user_id)
            if not user:
                return False

            monthly_videos_used = user.videos_generated_current_month + 1

            # actualizamos el campo monthly_videos_used del usuario
            result = self.client.table("profiles").update({
                "monthly_videos_used": monthly_videos_used
            }).eq("id", user_id).execute()

            # devolvemos True si se actualizó al menos un registro
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error incrementando uso mensual: {str(e)}")
            return False

    async def reset_monthly_usage(self, user_ids: List[str]) -> bool:
        try:
            # reseteamos el campo monthly_videos_used a 0 para los usuarios dados
            result = self.client.table("profiles").update({
                "monthly_videos_used": 0
            }).in_("id", user_ids).execute()

            # devolvemos True si se actualizó al menos un registro
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error reseteando uso mensual: {str(e)}")
            return False

    async def get_users_by_subscription(self, subscription_tier: SubscriptionTier) -> List[User]:
        try:
            # buscamos usuarios por tipo de suscripción
            result = self.client.table("profiles").select(
                "*").eq("subscription_tier", subscription_tier.value.lower()).execute()

            # convertimos los resultados a entidades User
            return [ProfileModel(data).to_entity() for data in result.data] if result.data else []
        except Exception as e:
            logger.error(
                f"Error obteniendo usuarios por suscripción: {str(e)}")
            return []

    async def get_active_users(self, limit: int = 100) -> List[User]:
        try:
            # buscamos usuarios activos si last_video_created_at es menor a 30 días
            from datetime import datetime, timedelta
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            result = self.client.table("profiles").select(
                "*").gt("last_video_created_at", thirty_days_ago.isoformat()).limit(limit).execute()

            # convertimos los resultados a entidades User
            return [ProfileModel(data).to_entity() for data in result.data] if result.data else []
        except Exception as e:
            logger.error(f"Error obteniendo usuarios activos: {str(e)}")
            return []

    async def get_inactive_users(self, days_inactive: int = 30) -> List[User]:
        try:
            # buscamos usuarios inactivos si last_video_created_at es mayor a X días
            from datetime import datetime, timedelta
            cutoff_date = datetime.utcnow() - timedelta(days=days_inactive)
            result = self.client.table("profiles").select(
                "*").lt("last_video_created_at", cutoff_date.isoformat()).execute()

            # convertimos los resultados a entidades User
            return [ProfileModel(data).to_entity() for data in result.data] if result.data else []
        except Exception as e:
            logger.error(f"Error obteniendo usuarios inactivos: {str(e)}")
            return []

    async def search_users(self, query: str, limit: int = 50) -> List[User]:
        try:
            # buscamos usuarios por cualquier tipo de filtro dentro de la query (id, email, full_name)
            result = self.client.table("profiles").select(
                "*").or_(
                f"id.ilike.%{query}%, email.ilike.%{query}%, full_name.ilike.%{query}%"
            ).limit(limit).execute()

            # convertimos los resultados a entidades User
            return [ProfileModel(data).to_entity() for data in result.data] if result.data else []
        except Exception as e:
            logger.error(f"Error buscando usuarios: {str(e)}")
            return []
