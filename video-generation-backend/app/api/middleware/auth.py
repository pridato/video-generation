"""
Authentication middleware for JWT token validation
"""
import logging
from typing import Optional
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import security
from app.infrastructure.external.supabase.client import SupabaseClient

logger = logging.getLogger(__name__)

# HTTPBearer scheme for JWT tokens
bearer_scheme = HTTPBearer(
    scheme_name="JWT",
    description="JWT Token from Supabase Authentication",
    auto_error=False
)


class AuthMiddleware:
    """Middleware para autenticación JWT con Supabase."""

    def __init__(self):
        self.supabase_client = SupabaseClient()

    async def verify_token(self, credentials: Optional[HTTPAuthorizationCredentials]) -> dict:
        """
        Verifica el token JWT y retorna información del usuario.

        Args:
            credentials: Credenciales HTTP Bearer

        Returns:
            dict: Información del usuario

        Raises:
            HTTPException: Si el token es inválido
        """
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de autenticación requerido",
                headers={"WWW-Authenticate": "Bearer"}
            )

        token = credentials.credentials

        try:
            # Verificar token con Supabase
            user_data = await self.supabase_client.verify_jwt_token(token)

            if not user_data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido o expirado",
                    headers={"WWW-Authenticate": "Bearer"}
                )

            # Extraer información del usuario
            user_info = {
                "user_id": user_data.get("id"),
                "email": user_data.get("email"),
                "user_metadata": user_data.get("user_metadata", {}),
                "app_metadata": user_data.get("app_metadata", {}),
                "aud": user_data.get("aud"),
                "token": token
            }

            logger.debug(f"Usuario autenticado: {user_info['email']}")
            return user_info

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error verificando token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Error verificando token de autenticación",
                headers={"WWW-Authenticate": "Bearer"}
            )

    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
        """
        Dependency para obtener el usuario actual autenticado.

        Args:
            credentials: Credenciales automáticamente extraídas

        Returns:
            dict: Información del usuario actual
        """
        return await self.verify_token(credentials)

    async def get_optional_user(self, credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> Optional[dict]:
        """
        Dependency para obtener el usuario actual (opcional).

        Args:
            credentials: Credenciales automáticamente extraídas (opcional)

        Returns:
            Optional[dict]: Información del usuario o None
        """
        if not credentials:
            return None

        try:
            return await self.verify_token(credentials)
        except HTTPException:
            return None

    def require_roles(self, required_roles: list[str]):
        """
        Dependency factory para verificar roles específicos.

        Args:
            required_roles: Lista de roles requeridos

        Returns:
            Dependency function
        """
        async def check_roles(user: dict = Depends(self.get_current_user)) -> dict:
            user_roles = user.get("app_metadata", {}).get("roles", [])

            if not any(role in user_roles for role in required_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Se requiere uno de estos roles: {', '.join(required_roles)}"
                )

            return user

        return check_roles

    def require_subscription(self, required_tiers: list[str]):
        """
        Dependency factory para verificar tipos de suscripción.

        Args:
            required_tiers: Lista de tipos de suscripción requeridos

        Returns:
            Dependency function
        """
        async def check_subscription(user: dict = Depends(self.get_current_user)) -> dict:
            subscription_tier = user.get("user_metadata", {}).get("subscription_tier", "gratuito")

            if subscription_tier not in required_tiers:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=f"Se requiere suscripción: {', '.join(required_tiers)}"
                )

            return user

        return check_subscription


# Instancia global del middleware de auth
auth_middleware = AuthMiddleware()

# Dependencies comunes
get_current_user = auth_middleware.get_current_user
get_optional_user = auth_middleware.get_optional_user

# Roles específicos
require_admin = auth_middleware.require_roles(["admin"])
require_moderator = auth_middleware.require_roles(["admin", "moderator"])

# Suscripciones específicas
require_premium = auth_middleware.require_subscription(["premium", "empresarial"])
require_paid = auth_middleware.require_subscription(["basico", "premium", "empresarial"])


async def get_user_id(user: dict = Depends(get_current_user)) -> str:
    """
    Dependency para obtener solo el ID del usuario.

    Args:
        user: Usuario autenticado

    Returns:
        str: ID del usuario
    """
    return user["user_id"]


async def get_user_email(user: dict = Depends(get_current_user)) -> str:
    """
    Dependency para obtener solo el email del usuario.

    Args:
        user: Usuario autenticado

    Returns:
        str: Email del usuario
    """
    return user["email"]