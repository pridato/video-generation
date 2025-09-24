"""
Storage Service Interface
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any


class StorageService(ABC):
    """Interfaz para servicios de almacenamiento."""

    @abstractmethod
    async def upload_file(
        self,
        bucket: str,
        file_path: str,
        file_data: bytes,
        content_type: Optional[str] = None
    ) -> Optional[str]:
        """Sube un archivo al almacenamiento."""
        pass

    @abstractmethod
    async def download_file(self, bucket: str, file_path: str) -> Optional[bytes]:
        """Descarga un archivo del almacenamiento."""
        pass

    @abstractmethod
    async def delete_file(self, bucket: str, file_path: str) -> bool:
        """Elimina un archivo del almacenamiento."""
        pass

    @abstractmethod
    async def get_public_url(self, bucket: str, file_path: str) -> str:
        """Obtiene la URL pública de un archivo."""
        pass

    @abstractmethod
    async def create_signed_url(
        self,
        bucket: str,
        file_path: str,
        expires_in: int = 3600
    ) -> Optional[str]:
        """Crea una URL firmada para acceso temporal."""
        pass