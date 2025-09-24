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
        """
        Verifica una contraseña contra su hash.

        Args:
            plain_password (str): La contraseña en texto plano.
            hashed_password (str): El hash de la contraseña.

        Returns:
            bool: True si la contraseña coincide con el hash, False en caso contrario.
        """
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """
        Obtiene el hash de una contraseña.

        Args:
            password (str): La contraseña en texto plano.

        Returns:
            str: El hash de la contraseña.
        """
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Crea un token de acceso JWT.

        Args:
            data (Dict[str, Any]): Datos a incluir en el payload del token.
            expires_delta (Optional[timedelta]): Tiempo de expiración del token.

        Returns:
            str: El token de acceso JWT.
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire})
        encoded_jwt = jose_jwt.encode(
            to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Verifica un token JWT.

        Args:
            token (str): El token JWT a verificar.

        Returns:
            Optional[Dict[str, Any]]: El payload del token si es válido, None en caso contrario.
        """
        try:
            payload = jose_jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            return None

    @staticmethod
    def verify_supabase_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Verifica un token de Supabase JWT.

        Args:
            token (str): El token JWT de Supabase a verificar.

        Returns:
            Optional[Dict[str, Any]]: El payload del token si es válido, None en caso contrario.
        """
        try:

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
        """
        Extrae información del usuario de un payload JWT.

        Args:
            payload (Dict[str, Any]): El payload del token JWT.

        Returns:
            Optional[Dict[str, Any]]: Un diccionario con la información del usuario o None
        """
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
