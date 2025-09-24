from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from .base import BaseRepository
from ..entities.clip import AssetClip, VideoClip


class ClipRepository(BaseRepository[AssetClip]):
    """Interfaz del repositorio para clips."""

    @abstractmethod
    async def search_by_embedding(self, embedding: List[float], limit: int = 20) -> List[AssetClip]:
        """Busca clips similares usando embeddings."""
        pass

    @abstractmethod
    async def get_by_category(self, category: str, limit: int = 50) -> List[AssetClip]:
        """Obtiene clips por categoría."""
        pass

    @abstractmethod
    async def get_by_tags(self, tags: List[str], limit: int = 50) -> List[AssetClip]:
        """Obtiene clips por tags."""
        pass

    @abstractmethod
    async def update_usage_stats(self, clip_id: str, success: bool, relevance_score: float) -> bool:
        """Actualiza estadísticas de uso del clip."""
        pass

    # Para VideoClips
    @abstractmethod
    async def create_video_clip_usage(self, video_clip: VideoClip) -> VideoClip:
        """Registra el uso de un clip en un video."""
        pass

    @abstractmethod
    async def get_video_clips(self, video_id: str) -> List[VideoClip]:
        """Obtiene clips usados en un video."""
        pass
