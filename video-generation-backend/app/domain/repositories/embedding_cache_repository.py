"""
Embedding Cache Repository Interface

"""

from abc import ABC, abstractmethod
from typing import List, Optional


class EmbeddingCacheRepository(ABC):
    """Repositorio para cache de embeddings - versión simple."""

    @abstractmethod
    async def get_embedding(self, text_hash: str) -> Optional[List[float]]:
        """
        Obtiene embedding del cache.

        Args:
            text_hash (str): Hash SHA-256 del texto

        Returns:
            List[float]: Vector de embedding o None si no existe

        Example:
            data = await repository.get_embedding("some_text_hash")
        """
        pass

    @abstractmethod
    async def store_embedding(self, text_hash: str, embedding: List[float], text_preview: Optional[str] = None) -> bool:
        """
        Guarda embedding en cache.

        Args:
            text_hash (str): Hash SHA-256 del texto
            embedding (List[float]): Vector de embedding
            text_preview (Optional[str]): Primeros 100 chars del texto (debug)

        Returns:
            True si se guardó correctamente

        Example:
            success = await repository.store_embedding("some_text_hash", [0.1, 0.2, 0.3], "This is a preview...")
        """
        pass

    @abstractmethod
    async def has_embedding(self, text_hash: str) -> bool:
        """
        Verifica si existe embedding en cache.

        Args:
            text_hash (str): Hash del texto

        Returns:
            True si existe en cache

        Example:
            exists = await repository.has_embedding("some_text_hash")
        """
        pass

    @abstractmethod
    async def increment_usage(self, text_hash: str) -> bool:
        """
        Incrementa contador de uso.

        Args:
            text_hash (str): Hash del texto

        Returns:
            True si se actualizó

        Example:
            success = await repository.increment_usage("some_text_hash")
        """
        pass

    @abstractmethod
    async def cleanup_old_embeddings(self, days_old: int = 90) -> int:
        """
        Limpia embeddings no usados.

        Args:
            days_old (int): Días sin uso para eliminar. Default 90

        Returns:
            int: Número de embeddings eliminados

        Example:
            removed_count = await repository.cleanup_old_embeddings(60)
        """
        pass

    @abstractmethod
    async def get_cache_stats(self) -> dict:
        """
        Obtiene estadísticas del cache.

        Returns:
            {
                "total_embeddings": int,
                "total_usage": int,  
                "avg_usage_per_embedding": float
            }

        Example:
            stats = await repository.get_cache_stats()
            print(stats)
        """
        pass
