"""
Implementación Supabase del cache de embeddings

"""

import logging
from typing import List, Optional, cast, Any
from datetime import datetime, timedelta

from app.domain.repositories.embedding_cache_repository import EmbeddingCacheRepository
from app.infrastructure.external.supabase.client import SupabaseClient
from app.infrastructure.database.models.embedding_cache_model import EmbeddingCacheModel

logger = logging.getLogger(__name__)


class SupabaseEmbeddingCacheRepository(EmbeddingCacheRepository):
    """Implementación del repositorio de embedding cache usando Supabase."""

    def __init__(self, supabase_client: SupabaseClient):
        self.client = supabase_client.client

    async def get_embedding(self, text_hash: str) -> Optional[List[float]]:
        try:
            # Obtener del cache
            result = self.client.table("embeddings_cache").select(
                "*").eq("text_hash", text_hash).single().execute()

            if not result.data:
                return None  # No existe en cache

            # Parsear resultado y devolver embedding (vector)
            model = EmbeddingCacheModel(result.data)
            embedding = model.get_embedding()

            if embedding:
                # Incrementar usage_count en background (fire-and-forget)
                try:
                    self.client.table("embeddings_cache").update({
                        "usage_count": result.data.get("usage_count", 0) + 1,
                        "last_used_at": datetime.utcnow().isoformat()
                    }).eq("text_hash", text_hash).execute()
                except Exception as e:
                    logger.warning(
                        f"Error incrementando usage count: {str(e)}")

                logger.info(f"✅ Cache hit para hash {text_hash[:8]}...")

            return embedding

        except Exception as e:
            logger.error(f"❌ Error obteniendo embedding del cache: {str(e)}")
            return None

    async def store_embedding(self, text_hash: str, embedding: List[float], text_preview: Optional[str] = None) -> bool:
        try:
            # Preparar datos
            data = EmbeddingCacheModel.create_insert_data(
                text_hash, embedding, text_preview)

            # Insertar con ON CONFLICT DO NOTHING (evita duplicados)
            result = self.client.table("embeddings_cache").upsert(
                data,
                on_conflict="text_hash"
            ).execute()

            # Verificar errores
            if getattr(result, 'status_code', 200) >= 400:
                logger.error(
                    f"❌ Error guardando embedding: {getattr(result, 'data', None)}")
                return False

            logger.info(f"✅ Embedding cacheado para hash {text_hash[:8]}...")
            return True

        except Exception as e:
            logger.error(f"❌ Error guardando embedding en cache: {str(e)}")
            return False

    async def has_embedding(self, text_hash: str) -> bool:
        try:
            # Verificar existencia
            result = self.client.table("embeddings_cache").select(
                "text_hash").eq("text_hash", text_hash).single().execute()
            return result.data is not None  # True si existe

        except Exception as e:
            logger.error(f"❌ Error verificando embedding en cache: {str(e)}")
            return False

    async def increment_usage(self, text_hash: str) -> bool:
        try:
            # Incrementar usage_count (llamamos a funcion SQL) y actualizar last_used_at
            result = self.client.table("embeddings_cache").update({
                "usage_count": self.client.rpc("increment_usage_count", {"hash": text_hash}),
                "last_used_at": datetime.utcnow().isoformat()
            }).eq("text_hash", text_hash).execute()

            if getattr(result, 'status_code', 200) >= 400 or not getattr(result, 'data', None):
                logger.error(
                    f"❌ Error incrementando usage: {getattr(result, 'data', None)}")
                return False

            return True

        except Exception as e:
            logger.error(f"❌ Error incrementando usage: {str(e)}")
            return False

    async def cleanup_old_embeddings(self, days_old: int = 90) -> int:
        try:
            # Calcular fecha de corte
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)

            # Obtener embeddings antiguos primero
            old_embeddings = self.client.table("embeddings_cache").select("text_hash").lt(
                "last_used_at", cutoff_date.isoformat()
            ).execute()

            if not old_embeddings.data:
                return 0  # No hay embeddings antiguos

            count = len(old_embeddings.data)

            # Eliminar embeddings antiguos
            result = self.client.table("embeddings_cache").delete().lt(
                "last_used_at", cutoff_date.isoformat()
            ).execute()

            if getattr(result, 'status_code', 200) >= 400:
                logger.error(
                    f"❌ Error en cleanup: {getattr(result, 'data', None)}")
                return 0

            logger.info(
                f"🧹 Limpiados {count} embeddings antiguos (>{days_old} días)")
            return count

        except Exception as e:
            logger.error(f"❌ Error en cleanup: {str(e)}")
            return 0

    async def get_cache_stats(self) -> dict:
        try:
            # Contar total de embeddings
            count_result = self.client.table("embeddings_cache").select(
                "text_hash", count=cast(Any, "exact")
            ).execute()

            # Sumar total de embeddings
            total_embeddings: int = count_result.count or 0

            # Sumar usage_count total (RPC que devuelve lista con dict)
            usage_result = self.client.rpc("sum_usage_counts").execute()
            total_usage: int = (
                int(usage_result.data[0].get("sum", 0))
                if usage_result.data and isinstance(usage_result.data, list)
                else 0
            )

            # Calcular promedio
            avg_usage: float = (
                total_usage / total_embeddings if total_embeddings > 0 else 0.0
            )

            return {
                "total_embeddings": total_embeddings,
                "total_usage": total_usage,
                "avg_usage_per_embedding": round(avg_usage, 2)
            }

        except Exception as e:
            logger.error(f"❌ Error obteniendo stats del cache: {str(e)}")
            return {
                "total_embeddings": 0,
                "total_usage": 0,
                "avg_usage_per_embedding": 0
            }

    # ============= MÉTODOS AUXILIARES =============

    async def get_or_create_embedding(self, text: str, embedding_generator) -> List[float]:
        """
        Obtiene embedding del cache o lo genera si no existe.

        Args:
            text: Texto para el embedding
            embedding_generator: Función async que genera embedding

        Returns:
            Vector de embedding
        """
        text_hash = EmbeddingCacheModel.generate_text_hash(text)

        # Intentar obtener del cache
        cached_embedding = await self.get_embedding(text_hash)
        if cached_embedding:
            return cached_embedding

        # No existe en cache, generar nuevo
        logger.info(
            f"🤖 Generando nuevo embedding para hash {text_hash[:8]}...")
        new_embedding = await embedding_generator(text)

        # Guardar en cache
        await self.store_embedding(text_hash, new_embedding, text[:100])

        return new_embedding

    async def batch_store_embeddings(self, embeddings_data: List[dict]) -> int:
        """
        Guarda múltiples embeddings en batch.

        Args:
            embeddings_data: Lista de dicts con keys: text_hash, embedding, text_preview

        Returns:
            Número de embeddings guardados exitosamente
        """
        if not embeddings_data:
            return 0

        try:
            # Preparar datos para batch insert
            batch_data = []
            for item in embeddings_data:
                data = EmbeddingCacheModel.create_insert_data(
                    item['text_hash'],
                    item['embedding'],
                    item.get('text_preview')
                )
                batch_data.append(data)

            # Batch insert
            result = self.client.table("embeddings_cache").upsert(
                batch_data,
                on_conflict="text_hash"
            ).execute()

            if getattr(result, 'status_code', 200) >= 400:
                logger.error(
                    f"❌ Error en batch insert: {getattr(result, 'data', None)}")
                return 0

            success_count = len(
                result.data) if result.data else len(batch_data)
            logger.info(
                f"✅ Batch insert: {success_count} embeddings guardados")
            return success_count

        except Exception as e:
            logger.error(f"❌ Error en batch store: {str(e)}")
            return 0
