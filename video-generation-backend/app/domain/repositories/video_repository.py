"""
Video repository interface
"""
from abc import abstractmethod
from typing import List, Optional
from datetime import datetime

from .base import BaseRepository
from ..entities.video import Video, VideoStatus


class VideoRepository(BaseRepository[Video]):
    """Interfaz del repositorio para videos."""

    @abstractmethod
    async def get_by_user_id(self, user_id: str, limit: int = 10, offset: int = 0) -> List[Video]:
        """Obtiene videos por ID de usuario."""
        pass

    @abstractmethod
    async def get_by_script_id(self, script_id: str) -> List[Video]:
        """Obtiene videos asociados a un script."""
        pass

    @abstractmethod
    async def get_by_estado(self, estado: VideoStatus, limit: int = 100) -> List[Video]:
        """Obtiene videos por estado."""
        pass

    @abstractmethod
    async def get_pending_videos(self, limit: int = 50) -> List[Video]:
        """Obtiene videos pendientes de procesamiento."""
        pass

    @abstractmethod
    async def get_processing_videos(self) -> List[Video]:
        """Obtiene videos que están siendo procesados."""
        pass

    @abstractmethod
    async def get_failed_videos(self, limit: int = 100) -> List[Video]:
        """Obtiene videos que han fallado."""
        pass

    @abstractmethod
    async def update_estado(self, video_id: str, estado: VideoStatus, error_mensaje: Optional[str] = None) -> bool:
        """Actualiza el estado de un video."""
        pass

    @abstractmethod
    async def update_progreso(self, video_id: str, progreso: dict) -> bool:
        """Actualiza el progreso de procesamiento de un video."""
        pass

    @abstractmethod
    async def set_video_url(self, video_id: str, url: str, duracion: float) -> bool:
        """Establece la URL del video finalizado."""
        pass

    @abstractmethod
    async def get_recent_by_user(self, user_id: str, days: int = 30) -> List[Video]:
        """Obtiene videos recientes de un usuario."""
        pass

    @abstractmethod
    async def get_completed_videos(self, user_id: Optional[str] = None, limit: int = 10) -> List[Video]:
        """Obtiene videos completados."""
        pass

    @abstractmethod
    async def search_by_title(self, query: str, user_id: Optional[str] = None) -> List[Video]:
        """Busca videos por título."""
        pass

    @abstractmethod
    async def get_videos_by_template(self, template_id: str, limit: int = 10) -> List[Video]:
        """Obtiene videos que usan un template específico."""
        pass

    @abstractmethod
    async def get_user_video_stats(self, user_id: str) -> dict:
        """Obtiene estadísticas de videos de un usuario."""
        pass

    @abstractmethod
    async def count_by_user_and_month(self, user_id: str, year: int, month: int) -> int:
        """Cuenta videos generados por un usuario en un mes específico."""
        pass

    @abstractmethod
    async def get_processing_time_stats(self, days: int = 30) -> dict:
        """Obtiene estadísticas de tiempo de procesamiento."""
        pass

    @abstractmethod
    async def cleanup_old_failed_videos(self, days_old: int = 7) -> int:
        """Limpia videos fallidos antiguos."""
        pass
