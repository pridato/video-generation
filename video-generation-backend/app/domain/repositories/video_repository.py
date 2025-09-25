"""
Video Repository Interface - Definición de la interfaz para operaciones CRUD y consultas específicas de videos.

"""

from abc import abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime

from .base import BaseRepository
from ..entities.video import Video, VideoStatus, VideoCategory, VideoTone


class VideoRepository(BaseRepository[Video]):
    """Interfaz del repositorio para videos con scripts embedded."""

    @property
    def _model(self) -> type:
        return Video

    # ============= CONSULTAS POR USUARIO =============

    @abstractmethod
    async def get_by_user_id(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        status_filter: Optional[VideoStatus] = None
    ) -> List[Video]:
        """
        Obtiene videos de un usuario con filtros opcionales.

        Args:
            user_id (str): ID del usuario
            limit (int): Máximo videos a retornar
            offset (int): Videos a omitir (paginación)
            status_filter (Optional[VideoStatus]): Filtrar por estado específico

        Returns:
            List[Video]: Lista de videos del usuario

        Example:
            user_videos = await video_repository.get_by_user_id(
                user_id="user123",
                limit=10,
                status_filter=VideoStatus.COMPLETED
            )
            for video in user_videos:
                print(video.title)
        """
        pass

    @abstractmethod
    async def count_by_user(
        self,
        user_id: str,
        status_filter: Optional[VideoStatus] = None,
        date_from: Optional[datetime] = None
    ) -> int:
        """
        Cuenta videos de un usuario con filtros.

        Args:
            user_id (str): ID del usuario
            status_filter (Optional[VideoStatus]): Filtrar por estado
            date_from (Optional[datetime]): Contar desde fecha específica

        Returns:
            int: Número total de videos

        Example:
            total_videos = await video_repository.count_by_user(
                user_id="user123",
                status_filter=VideoStatus.FAILED
            )
            print(f"Total de videos fallidos: {total_videos}")
        """
        pass

    # ============= BÚSQUEDAS Y FILTROS =============

    @abstractmethod
    async def search_by_script_content(
        self,
        query: str,
        user_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Video]:
        """
        Busca videos por contenido del script (original o enhanced).

        Args:
            query (str): Texto a buscar
            user_id (Optional[str]): Filtrar por usuario específico
            limit (int): Máximo resultados

        Returns:
            List[Video]: Videos que coinciden con la búsqueda

        Example:
            search_results = await video_repository.search_by_script_content(
                query="tecnología avanzada",
                user_id="user123",
                limit=5
            )
            for video in search_results:
                print(video.title)
        """
        pass

    @abstractmethod
    async def get_by_category(
        self,
        category: VideoCategory,
        limit: int = 20,
        user_id: Optional[str] = None
    ) -> List[Video]:
        """
        Obtiene videos por categoría.

        Args:
            category (VideoCategory): Categoría a filtrar
            limit (int): Máximo videos
            user_id (Optional[str]): Filtrar por usuario específico

        Returns:
            List[Video]: Videos de la categoría especificada

        Example:
            tech_videos = await video_repository.get_by_category(
                category=VideoCategory.TECH,
                limit=10
            )
            for video in tech_videos:
                print(video.title)
        """
        pass

    @abstractmethod
    async def get_similar_videos(
        self,
        embedding: List[float],
        limit: int = 5,
        exclude_video_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[Video]:
        """
        Encuentra videos similares usando embeddings.

        Args:
            embedding (List[float]): Vector de embedding para comparar
            limit (int): Máximo videos similares
            exclude_video_id (Optional[str]): Excluir video específico (útil para "relacionados")
            user_id (Optional[str]): Filtrar por usuario específico

        Returns:
            List[Video]: Videos similares ordenados por similitud

        Example:
            similar_videos = await video_repository.get_similar_videos(
                embedding=some_embedding_vector,
                limit=5,
                exclude_video_id="video123"
            )
            for video in similar_videos:
                print(video.title)
        """
        pass

    # ============= GESTIÓN DE ESTADO =============

    @abstractmethod
    async def update_status(
        self,
        video_id: str,
        status: VideoStatus,
        error_message: Optional[str] = None
    ) -> bool:
        """
        Actualiza el estado de un video.

        Args:
            video_id (str): ID del video
            status (VideoStatus): Nuevo estado
            error_message (Optional[str]): Mensaje de error si aplica

        Returns:
            True si se actualizó correctamente

        Example:
            success = await video_repository.update_status(
                video_id="video123",
                status=VideoStatus.COMPLETED
            )
            if success:
                print("Estado actualizado exitosamente")
        """
        pass

    @abstractmethod
    async def get_videos_by_status(
        self,
        status: VideoStatus,
        limit: int = 100
    ) -> List[Video]:
        """
        Obtiene videos por estado específico.

        Útil para:
        - Procesar videos pendientes
        - Reintentar videos fallidos
        - Cleanup de videos antiguos

        Args:
            status (VideoStatus): Estado a filtrar
            limit (int): Máximo videos

        Returns:
            List[Video]: Videos en el estado especificado

        Example:
            processing_videos = await video_repository.get_videos_by_status(
                status=VideoStatus.SELECTING_CLIPS,
                limit=50
            )
            for video in processing_videos:
                print(video.title)
        """
        pass

    # ============= ANALYTICS Y MÉTRICAS =============

    @abstractmethod
    async def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Obtiene estadísticas de videos de un usuario.

        Args:
            user_id (str): ID del usuario

        Returns:
            Dict[str, Any]: Diccionario con estadísticas:
            {
                "total_videos": int,
                "completed_videos": int, 
                "failed_videos": int,
                "processing_videos": int,
                "avg_quality_score": float,
                "total_duration": float,
                "categories_used": List[str],
                "most_used_tone": str
            }

        Example:
            stats = await video_repository.get_user_statistics("user123")
            print(f"Total videos: {stats['total_videos']}")
        """
        pass

    @abstractmethod
    async def get_trending_videos(
        self,
        category: Optional[VideoCategory] = None,
        days: int = 30,
        limit: int = 10
    ) -> List[Video]:
        """
        Obtiene videos trending/populares.

        Basado en:
        - Engagement metrics
        - Quality scores
        - Fecha de creación

        Args:
            category (Optional[VideoCategory]): Filtrar por categoría específica
            days (int): Considerar videos de últimos X días
            limit (int): Máximo videos

        Returns:
            List[Video]: Videos trending ordenados por popularidad

        Example:
            trending_videos = await video_repository.get_trending_videos(
                category=VideoCategory.TECH,
                days=15,
                limit=5
            )
            for video in trending_videos:
                print(video.title)
        """
        pass

    # ============= EMBEDDINGS Y CACHE =============

    @abstractmethod
    async def update_embedding(self, video_id: str, embedding: List[float]) -> bool:
        """
        Actualiza el embedding de un video.

        Args:
            video_id (str): ID del video
            embedding (List[float]): Vector de embedding

        Returns:
            bool: True si se actualizó correctamente

        Example:
            success = await video_repository.update_embedding(
                video_id="video123",
                embedding=new_embedding_vector
            )
            if success:
                print("Embedding actualizado exitosamente")
        """
        pass

    @abstractmethod
    async def get_videos_without_embeddings(self, limit: int = 50) -> List[Video]:
        """
        Obtiene videos que no tienen embeddings.

        Para procesamiento batch de embeddings.

        Args:
            limit (int): Máximo videos

        Returns:
            List[Video]: Videos sin embeddings

        Example:
            videos_no_embedding = await video_repository.get_videos_without_embeddings(limit=20)
            for video in videos_no_embedding:
                print(video.title)
        """
        pass

    # ============= CLEANUP Y MANTENIMIENTO =============

    @abstractmethod
    async def cleanup_failed_videos(self, days_old: int = 7) -> int:
        """
        Limpia videos fallidos antiguos.

        Args:
            days_old (int): Videos fallidos más antiguos que X días

        Returns:
            int: Número de videos eliminados

        Example:
            deleted_count = await video_repository.cleanup_failed_videos(days_old=30)
            print(f"Videos fallidos eliminados: {deleted_count}")
        """
        pass

    @abstractmethod
    async def get_processing_health(self) -> Dict[str, Any]:
        """
        Obtiene métricas de salud del procesamiento.

        Returns:
            Dict[str, Any]: Métricas de salud del procesamiento
                "videos_processing": int,
                "avg_processing_time": float,
                "success_rate": float,
                "bottleneck_step": str,
                "oldest_processing_video": datetime
            }

        Example:
            health_metrics = await video_repository.get_processing_health()
            print(f"Videos en procesamiento: {health_metrics['videos_processing']}")
        """
        pass
