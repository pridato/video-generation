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
    async def create_video(self, entity: Video) -> Video:
        """
        Crea un nuevo video en la ddbb.

        Args:
            entity (Video): La entidad de video a crear.

        Returns:
            Video: La entidad de video creada con ID asignado.
        """
        pass

    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[Video]:
        """
        Obtiene un video por su ID.

        Args:
            id (str): El ID del video.

        Returns:
            Optional[Video]: La entidad de video si se encuentra, de lo contrario None.
        """
        pass

    @abstractmethod
    async def get_by_user_id(self, user_id: str, limit: int = 10, offset: int = 0) -> List[Video]:
        """
        Obtiene videos por ID de usuario.

        Args:
            user_id (str): El ID del usuario.
            limit (int): Número máximo de videos a retornar. 10 por defecto.
            offset (int): Número de videos a omitir. 0 por defecto.

        Returns:
            List[Video]: Lista de videos del usuario.
        """
        pass

    @abstractmethod
    async def update_state(self, video_id: str, state: VideoStatus, error_message: Optional[str] = None) -> bool:
        """
        Actualiza el estado de un video.

        Args:
            video_id (str): El ID del video a actualizar.
            state (VideoStatus): El nuevo estado del video.
            error_message (Optional[str]): Mensaje de error si aplica.

        Returns:
            bool: True si la actualización fue exitosa, False en caso contrario.
        """
        pass

    @abstractmethod
    async def set_video_url(self, video_id: str, url: str, duration: float) -> bool:
        """
        Establece la URL del video finalizado.

        Args:
            video_id (str): El ID del video a actualizar.
            url (str): La URL del video final.
            duration (float): La duración final del video.

        Returns:
            bool: True si la actualización fue exitosa, False en caso contrario.
        """
        pass

    @abstractmethod
    async def search_by_title(self, query: str, user_id: Optional[str] = None) -> List[Video]:
        """
        Busca videos por título.

        Args:
            query (str): El término de búsqueda en el título.
            user_id (Optional[str]): Filtra por ID de usuario si se proporciona.

        Returns:
            List[Video]: Lista de videos que coinciden con el término de búsqueda.
        """
        pass

    @abstractmethod
    async def get_user_video_stats(self, user_id: str) -> dict:
        """
        Obtiene estadísticas de videos de un usuario.

        Args:
            user_id (str): El ID del usuario.

        Returns:
            dict: Estadísticas del usuario, incluyendo conteo por estado y total de videos.
        """
        pass

    @abstractmethod
    async def count_by_user_and_month(self, user_id: str, year: int, month: int) -> int:
        """
        Cuenta videos generados por un usuario en un mes específico.

        Args:
            user_id (str): El ID del usuario.
            year (int): El año.
            month (int): El mes.

        Returns:
            int: Número de videos generados por el usuario en el mes especificado.
        """
        pass

    @abstractmethod
    async def get_processing_time_stats(self, days: int = 30) -> dict:
        """
        Obtiene estadísticas de tiempo de procesamiento.

        Args:
            days (int): Número de días hacia atrás para calcular las estadísticas. 30 por defecto.

        Returns:
            dict: Estadísticas de tiempo de procesamiento, incluyendo tiempo promedio, mínimo y máximo.
        """
        pass
