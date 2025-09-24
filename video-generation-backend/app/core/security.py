import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import JWTError, jwt as jose_jwt

from .config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecurityManager:
    """Maneja la seguridad de la aplicación incluyendo JWT y passwords."""

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifica una contraseña contra su hash."""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Obtiene el hash de una contraseña."""
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Crea un token de acceso JWT."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire})
        encoded_jwt = jose_jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verifica un token JWT."""
        try:
            payload = jose_jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            return None

    @staticmethod
    def verify_supabase_token(token: str) -> Optional[Dict[str, Any]]:
        """Verifica un token de Supabase JWT."""
        try:
            # Decodificar el token sin verificación para obtener el header
            unverified_header = jwt.get_unverified_header(token)

            # Verificar el token usando el secret de Supabase
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )

            # Verificar que el token no haya expirado
            if payload.get("exp") and datetime.utcnow().timestamp() > payload["exp"]:
                return None

            return payload
        except (JWTError, Exception):
            return None

    @staticmethod
    def extract_user_from_token(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extrae información del usuario de un payload JWT."""
        if not payload:
            return None

        return {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role", "user"),
            "aud": payload.get("aud"),
            "exp": payload.get("exp")
        }


security = SecurityManager()