from abc import ABC, abstractmethod
from typing import List, Optional
from .base import BaseRepository
from ..entities.clip import AssetClip, VideoClip


class ClipRepository(BaseRepository[AssetClip]):
    """Interfaz del repositorio para clips."""

    @property
    def _model(self) -> type:
        return AssetClip

    @abstractmethod
    async def search_by_embedding(self, embedding: List[float], limit: int = 20, target_duration: Optional[int] = None,
                                  emotion_filter: Optional[str] = None) -> List[AssetClip]:
        """
        Busca clips similares usando embedding vectorial (pgvector + distancia coseno).

        Args:
            embedding: Vector de 384/768 dims del script
            limit: Máximo clips a retornar (default: 20)
            target_duration: Filtrar por duración similar en segundos (±50%)
            emotion_filter: Filtrar por emoción específica ("energetic", "calm", etc.)

        Returns:
            Lista de AssetClips ordenados por similitud (1.0 = idéntico, 0.0 = muy diferente).
            Solo incluye clips activos y procesados.

        Raises:
            Exception: Error en DB o procesamiento de resultados
        """
        pass

    @abstractmethod
    async def get_by_category(self, category: str, limit: int = 50) -> List[AssetClip]:
        """
        Obtiene clips por categoría ordenados por "quality_score" es decir calidad.

        Args:
            category (str): Categoría de los clips.
            limit (int): Número máximo de resultados a retornar.

        Returns:
            List[AssetClip]: Lista de clips en la categoría dada.
        """
        pass

    @abstractmethod
    async def get_by_tags(self, tags: List[str], limit: int = 50) -> List[AssetClip]:
        """
        Obtiene clips por tags.

        Args:
            tags (List[str]): Lista de tags.
            limit (int): Número máximo de resultados a retornar.

        Returns:
            List[AssetClip]: Lista de clips que coinciden con los tags dados.
        """
        pass

    @abstractmethod
    async def update_usage_stats(self, clip_id: str, success: bool, relevance_score: float) -> bool:
        """
        Actualiza estadísticas de uso del clip.

        Args:
            clip_id (str): ID del clip.
            success (bool): Si el clip fue usado exitosamente.
            relevance_score (float): Puntuación de relevancia del clip.

        Returns:
            bool: True si la actualización fue exitosa, False en caso contrario.
        """
        pass

    # Para VideoClips
    @abstractmethod
    async def create_video_clip_usage(self, video_clip: VideoClip) -> VideoClip:
        """
        Registra el uso de un clip en un video.

        Args:
            video_clip (VideoClip): Entidad VideoClip a registrar.

        Returns:
            VideoClip: Entidad VideoClip registrada con ID asignado.
        """
        pass

    @abstractmethod
    async def get_video_clips(self, video_id: str) -> List[VideoClip]:
        """
        Obtiene clips usados en un video.

        Args:
            video_id (str): ID del video.

        Returns:
            List[VideoClip]: Lista de VideoClips asociados al video.
        """
        pass
