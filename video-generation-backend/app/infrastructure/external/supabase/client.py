"""
Supabase client adapter for authentication and storage
"""
import logging
from typing import Dict, Any, Optional, List
from supabase import create_client, Client
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Cliente adaptador para Supabase."""

    def __init__(self):
        """Inicializa el cliente de Supabase."""
        if not settings.supabase_configured:
            raise ValueError("Supabase no configurado correctamente")

        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )

    async def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verifica un JWT token de Supabase.

        Args:
            token: Token JWT a verificar

        Returns:
            Dict con información del usuario o None si es inválido
        """
        try:
            # Usar el token para obtener información del usuario
            response = self.client.auth.get_user(jwt=token)

            if response.user:
                return {
                    "id": response.user.id,
                    "email": response.user.email,
                    "user_metadata": response.user.user_metadata,
                    "app_metadata": response.user.app_metadata,
                    "aud": response.user.aud,
                    "created_at": response.user.created_at,
                    "confirmed_at": response.user.confirmed_at,
                    "last_sign_in_at": response.user.last_sign_in_at
                }
            return None

        except Exception as e:
            logger.error(f"Error verificando JWT token: {str(e)}")
            return None

    async def get_user_by_id(self, user_id: str, token: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene información de un usuario por ID.

        Args:
            user_id: ID del usuario
            token: Token de autenticación

        Returns:
            Dict con información del usuario o None
        """
        try:
            # Establecer el token de sesión
            self.client.auth.set_session(token, "")

            response = self.client.auth.get_user()

            if response.user and response.user.id == user_id:
                return {
                    "id": response.user.id,
                    "email": response.user.email,
                    "user_metadata": response.user.user_metadata,
                    "app_metadata": response.user.app_metadata
                }
            return None

        except Exception as e:
            logger.error(f"Error obteniendo usuario: {str(e)}")
            return None

    async def upload_file(
        self,
        bucket: str,
        file_path: str,
        file_data: bytes,
        content_type: str = None
    ) -> Optional[str]:
        """
        Sube un archivo al storage de Supabase.

        Args:
            bucket: Nombre del bucket
            file_path: Ruta del archivo en el bucket
            file_data: Datos del archivo
            content_type: Tipo de contenido

        Returns:
            URL pública del archivo o None si falla
        """
        try:
            # Subir archivo
            response = self.client.storage.from_(bucket).upload(
                file_path,
                file_data,
                file_options={"content-type": content_type} if content_type else None
            )

            if response:
                # Obtener URL pública
                public_url = self.client.storage.from_(bucket).get_public_url(file_path)
                logger.info(f"Archivo subido exitosamente: {public_url}")
                return public_url

            return None

        except Exception as e:
            logger.error(f"Error subiendo archivo: {str(e)}")
            return None

    async def download_file(self, bucket: str, file_path: str) -> Optional[bytes]:
        """
        Descarga un archivo del storage de Supabase.

        Args:
            bucket: Nombre del bucket
            file_path: Ruta del archivo en el bucket

        Returns:
            Datos del archivo o None si falla
        """
        try:
            response = self.client.storage.from_(bucket).download(file_path)

            if response:
                logger.info(f"Archivo descargado: {file_path}")
                return response

            return None

        except Exception as e:
            logger.error(f"Error descargando archivo: {str(e)}")
            return None

    async def delete_file(self, bucket: str, file_path: str) -> bool:
        """
        Elimina un archivo del storage.

        Args:
            bucket: Nombre del bucket
            file_path: Ruta del archivo

        Returns:
            True si se eliminó exitosamente
        """
        try:
            response = self.client.storage.from_(bucket).remove([file_path])

            if response:
                logger.info(f"Archivo eliminado: {file_path}")
                return True

            return False

        except Exception as e:
            logger.error(f"Error eliminando archivo: {str(e)}")
            return False

    async def list_files(self, bucket: str, folder: str = "") -> List[Dict[str, Any]]:
        """
        Lista archivos en un bucket/folder.

        Args:
            bucket: Nombre del bucket
            folder: Carpeta (opcional)

        Returns:
            Lista de archivos
        """
        try:
            response = self.client.storage.from_(bucket).list(folder)

            if response:
                return [
                    {
                        "name": file.get("name"),
                        "size": file.get("metadata", {}).get("size"),
                        "updated_at": file.get("updated_at"),
                        "created_at": file.get("created_at"),
                        "content_type": file.get("metadata", {}).get("mimetype")
                    }
                    for file in response
                ]

            return []

        except Exception as e:
            logger.error(f"Error listando archivos: {str(e)}")
            return []

    async def create_signed_url(
        self,
        bucket: str,
        file_path: str,
        expires_in: int = 3600
    ) -> Optional[str]:
        """
        Crea una URL firmada para acceso temporal a un archivo.

        Args:
            bucket: Nombre del bucket
            file_path: Ruta del archivo
            expires_in: Tiempo de expiración en segundos

        Returns:
            URL firmada o None si falla
        """
        try:
            response = self.client.storage.from_(bucket).create_signed_url(
                file_path,
                expires_in
            )

            if response:
                logger.info(f"URL firmada creada para: {file_path}")
                return response.get("signedURL")

            return None

        except Exception as e:
            logger.error(f"Error creando URL firmada: {str(e)}")
            return None

    async def health_check(self) -> bool:
        """
        Verifica la conectividad con Supabase.

        Returns:
            True si la conexión es exitosa
        """
        try:
            # Hacer una llamada básica para verificar conectividad
            response = self.client.auth.get_session()
            return True  # Si no hay excepción, la conexión funciona

        except Exception as e:
            logger.error(f"Health check de Supabase falló: {str(e)}")
            return False

    def get_public_url(self, bucket: str, file_path: str) -> str:
        """
        Obtiene la URL pública de un archivo.

        Args:
            bucket: Nombre del bucket
            file_path: Ruta del archivo

        Returns:
            URL pública del archivo
        """
        return self.client.storage.from_(bucket).get_public_url(file_path)

    async def create_bucket(self, bucket_name: str, public: bool = False) -> bool:
        """
        Crea un nuevo bucket de storage.

        Args:
            bucket_name: Nombre del bucket
            public: Si el bucket es público

        Returns:
            True si se creó exitosamente
        """
        try:
            response = self.client.storage.create_bucket(bucket_name, public=public)

            if response:
                logger.info(f"Bucket creado: {bucket_name}")
                return True

            return False

        except Exception as e:
            logger.error(f"Error creando bucket: {str(e)}")
            return False