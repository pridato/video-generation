"""
Implementación Supabase del repositorio de videos

"""

import logging
import uuid
from typing import List, Optional, Dict, Any, cast
from datetime import datetime, timedelta

from app.domain.repositories.video_repository import VideoRepository
from app.domain.entities.video import Video, VideoStatus, VideoCategory, VideoTone
from app.infrastructure.external.supabase.client import SupabaseClient
from app.infrastructure.database.models.video_model import VideoModel
from app.infrastructure.database.models.embedding_cache_model import EmbeddingCacheModel

logger = logging.getLogger(__name__)


class SupabaseVideoRepository(VideoRepository):
    """Implementación del repositorio de videos usando Supabase."""

    def __init__(self, supabase_client: SupabaseClient):
        self.client = supabase_client.client

    # ============= OPERACIONES CRUD BÁSICAS =============

    async def create(self, entity: Video) -> Video:
        try:
            # Generar ID si no existe
            if not entity.id:
                entity.id = str(uuid.uuid4())

            # Convertir entidad a datos de BD
            data = VideoModel.from_entity(entity)

            # Insert en BD
            result = self.client.table("videos").insert(data).execute()

            if getattr(result, 'status_code', 200) >= 400:
                logger.error(
                    f"❌ Error creando video: {getattr(result, 'data', None)}")
                raise RuntimeError(
                    f"Error creando video: {getattr(result, 'data', None)}")

            if not result.data:
                raise RuntimeError(
                    "No se recibieron datos después de crear video")

            # Convertir resultado a entidad
            created_video = VideoModel(result.data[0]).to_entity()

            logger.info(f"✅ Video creado: {created_video.id}")
            return created_video

        except Exception as e:
            logger.error(f"❌ Error creando video: {str(e)}")
            raise

    async def update(self, entity: Video) -> Video:
        try:
            if not entity.id:
                raise ValueError("Video debe tener ID para actualizar")

            # Actualizar timestamp
            entity.updated_at = datetime.utcnow()

            # Convertir a datos de BD
            data = VideoModel.from_entity(entity)

            # Update en BD
            result = self.client.table("videos").update(
                data).eq("id", entity.id).execute()

            if getattr(result, 'error', None):
                logger.error(
                    f"❌ Error actualizando video: {getattr(result, 'error', None)}")
                raise RuntimeError(
                    f"Error actualizando video: {getattr(result, 'error', None)}")

            if not result.data:
                raise RuntimeError(
                    f"Video {entity.id} no encontrado para actualizar")

            updated_video = VideoModel(result.data[0]).to_entity()

            logger.info(f"✅ Video actualizado: {entity.id}")
            return updated_video

        except Exception as e:
            logger.error(f"❌ Error actualizando video: {str(e)}")
            raise

    async def get_by_id(self, id: str) -> Optional[Video]:
        """Obtiene un video por su ID."""
        try:
            result = self.client.table("videos").select(
                "*").eq("id", id).single().execute()

            if not result.data:
                return None

            return VideoModel(result.data).to_entity()

        except Exception as e:
            logger.error(f"❌ Error obteniendo video {id}: {str(e)}")
            return None

    async def delete(self, id: str) -> bool:
        """Elimina un video."""
        try:
            result = self.client.table("videos").delete().eq(
                "id", id).execute()

            if getattr(result, 'error', None):
                logger.error(
                    f"❌ Error eliminando video: {getattr(result, 'error', None)}")
                return False

            deleted = bool(result.data and len(result.data) > 0)
            if deleted:
                logger.info(f"🗑️ Video eliminado: {id}")

            return deleted

        except Exception as e:
            logger.error(f"❌ Error eliminando video: {str(e)}")
            return False

    # ============= CONSULTAS POR USUARIO =============

    async def get_by_user_id(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        status_filter: Optional[VideoStatus] = None
    ) -> List[Video]:
        """Obtiene videos de un usuario con filtros opcionales."""
        try:
            query = self.client.table("videos").select(
                "*").eq("user_id", user_id)

            # Aplicar filtro de estado si se especifica
            if status_filter:
                query = query.eq("status", status_filter.value)

            # Ordenar por fecha de creación (más recientes primero)
            query = query.order("created_at", desc=True)

            # Aplicar paginación
            query = query.limit(limit).offset(offset)

            result = query.execute()

            if not result.data:
                return []

            videos = []
            for row in result.data:
                try:
                    video = VideoModel(row).to_entity()
                    videos.append(video)
                except Exception as e:
                    logger.warning(
                        f"⚠️ Error parseando video {row.get('id')}: {str(e)}")
                    continue

            logger.info(
                f"📹 Obtenidos {len(videos)} videos para usuario {user_id}")
            return videos

        except Exception as e:
            logger.error(f"❌ Error obteniendo videos del usuario: {str(e)}")
            return []

    async def count_by_user(
        self,
        user_id: str,
        status_filter: Optional[VideoStatus] = None,
        date_from: Optional[datetime] = None
    ) -> int:
        """Cuenta videos de un usuario con filtros."""
        try:
            count_result = self.client.table("embeddings_cache").select(
                "text_hash", count=cast(Any, "exact")
            ).execute()

            query = self.client.table("videos").select(
                "id", count=cast(Any, "exact")).eq("user_id", user_id)

            if status_filter:
                query = query.eq("status", status_filter.value)

            if date_from:
                query = query.gte("created_at", date_from.isoformat())

            result = query.execute()

            return int(result.count or 0) if hasattr(result, 'count') else 0

        except Exception as e:
            logger.error(f"❌ Error contando videos del usuario: {str(e)}")
            return 0

    # ============= BÚSQUEDAS Y FILTROS =============

    async def search_by_script_content(
        self,
        query: str,
        user_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Video]:
        """Busca videos por contenido del script."""
        try:
            # Construir query de búsqueda
            search_query = self.client.table("videos").select("*")

            # Búsqueda en script_original y script_enhanced usando ilike
            search_condition = f"script_original.ilike.%{query}%,script_enhanced.ilike.%{query}%"
            search_query = search_query.or_(search_condition)

            # Filtrar por usuario si se especifica
            if user_id:
                search_query = search_query.eq("user_id", user_id)

            # Ordenar por relevancia (videos completados primero, luego por fecha)
            search_query = search_query.order(
                "status").order("created_at", desc=True)
            search_query = search_query.limit(limit)

            result = search_query.execute()

            if not result.data:
                return []

            videos = []
            for row in result.data:
                try:
                    video = VideoModel(row).to_entity()
                    videos.append(video)
                except Exception as e:
                    logger.warning(
                        f"⚠️ Error parseando video en búsqueda: {str(e)}")
                    continue

            logger.info(
                f"🔍 Búsqueda '{query}': {len(videos)} videos encontrados")
            return videos

        except Exception as e:
            logger.error(f"❌ Error en búsqueda por contenido: {str(e)}")
            return []

    async def get_by_category(
        self,
        category: VideoCategory,
        limit: int = 20,
        user_id: Optional[str] = None
    ) -> List[Video]:
        """Obtiene videos por categoría."""
        try:
            query = self.client.table("videos").select(
                "*").eq("category", category.value)

            if user_id:
                query = query.eq("user_id", user_id)

            # Ordenar por calidad y fecha
            query = query.order("quality_score", desc=True)
            query = query.order("created_at", desc=True)
            query = query.limit(limit)

            result = query.execute()

            if not result.data:
                return []

            videos = [VideoModel(row).to_entity() for row in result.data]

            logger.info(
                f"📂 Obtenidos {len(videos)} videos de categoría {category.value}")
            return videos

        except Exception as e:
            logger.error(f"❌ Error obteniendo videos por categoría: {str(e)}")
            return []

    async def get_similar_videos(
        self,
        embedding: List[float],
        limit: int = 5,
        exclude_video_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[Video]:
        """Encuentra videos similares usando embeddings."""
        try:
            # Construir query base
            query = self.client.table("videos").select("*")

            # Filtrar videos que tengan embedding
            query = query.not_.is_("script_embedding", "null")

            # Excluir video específico si se especifica
            if exclude_video_id:
                query = query.neq("id", exclude_video_id)

            # Filtrar por usuario si se especifica
            if user_id:
                query = query.eq("user_id", user_id)

            # Usar función de PostgreSQL para similitud de vectores (requiere pgvector)
            # Nota: Esto requiere tener pgvector instalado y configurado
            embedding_str = f"[{','.join(map(str, embedding))}]"

            # Usar RPC para similitud coseno
            similarity_result = self.client.rpc("find_similar_videos", {
                "query_embedding": embedding_str,
                "similarity_threshold": 0.7,
                "max_results": limit,
                "exclude_id": exclude_video_id,
                "user_filter": user_id
            }).execute()

            if not similarity_result.data:
                logger.info("🔍 No se encontraron videos similares")
                return []

            # Convertir resultados a entidades
            videos = []
            for row in similarity_result.data:
                try:
                    video = VideoModel(row).to_entity()
                    videos.append(video)
                except Exception as e:
                    logger.warning(
                        f"⚠️ Error parseando video similar: {str(e)}")
                    continue

            logger.info(f"🎯 Encontrados {len(videos)} videos similares")
            return videos

        except Exception as e:
            logger.warning(
                f"⚠️ Búsqueda por embeddings falló, usando fallback: {str(e)}")

            # Fallback: buscar por categoría como aproximación
            if user_id:
                user_videos = await self.get_by_user_id(user_id, limit=100)
                if user_videos:
                    # Obtener categorías más comunes del usuario
                    categories = [v.category for v in user_videos]
                    if categories:
                        most_common_category = max(
                            set(categories), key=categories.count)
                        return await self.get_by_category(most_common_category, limit)

            return []

    # ============= GESTIÓN DE ESTADO =============

    async def update_status(
        self,
        video_id: str,
        status: VideoStatus,
        error_message: Optional[str] = None
    ) -> bool:
        """Actualiza el estado de un video."""
        try:
            update_data = {
                "status": status.value,
                "updated_at": datetime.utcnow().isoformat()
            }

            if error_message:
                update_data["error_message"] = error_message

            if status == VideoStatus.COMPLETED:
                update_data["completed_at"] = datetime.utcnow().isoformat()

            result = self.client.table("videos").update(
                update_data).eq("id", video_id).execute()

            if getattr(result, 'error', None):
                logger.error(
                    f"❌ Error actualizando estado: {getattr(result, 'error', None)}")
                return False

            success = result.data and len(result.data) > 0
            if success:
                logger.info(
                    f"🔄 Video {video_id} estado actualizado: {status.value}")

            return bool(success)

        except Exception as e:
            logger.error(f"❌ Error actualizando estado de video: {str(e)}")
            return False

    async def get_videos_by_status(self, status: VideoStatus, limit: int = 100) -> List[Video]:
        """Obtiene videos por estado específico."""
        try:
            result = self.client.table("videos").select("*").eq(
                "status", status.value
            ).order("created_at").limit(limit).execute()

            if not result.data:
                return []

            videos = []
            for row in result.data:
                try:
                    video = VideoModel(row).to_entity()
                    videos.append(video)
                except Exception as e:
                    logger.warning(
                        f"⚠️ Error parseando video con estado {status.value}: {str(e)}")
                    continue

            logger.info(
                f"📊 Obtenidos {len(videos)} videos con estado {status.value}")
            return videos

        except Exception as e:
            logger.error(f"❌ Error obteniendo videos por estado: {str(e)}")
            return []

    # ============= ANALYTICS Y MÉTRICAS =============

    async def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """Obtiene estadísticas de videos de un usuario."""
        try:
            # Obtener todos los videos del usuario
            all_videos_result = self.client.table("videos").select(
                "*").eq("user_id", user_id).execute()

            if not all_videos_result.data:
                return {
                    "total_videos": 0,
                    "completed_videos": 0,
                    "failed_videos": 0,
                    "processing_videos": 0,
                    "avg_quality_score": 0,
                    "total_duration": 0,
                    "categories_used": [],
                    "most_used_tone": None
                }

            videos = all_videos_result.data
            total_videos = len(videos)

            # Contar por estado
            completed_videos = len([v for v in videos if v.get(
                "status") == VideoStatus.COMPLETED.value])
            failed_videos = len([v for v in videos if v.get(
                "status") == VideoStatus.FAILED.value])
            processing_videos = len([v for v in videos if v.get("status") not in [
                VideoStatus.COMPLETED.value, VideoStatus.FAILED.value, VideoStatus.CREATED.value
            ]])

            # Calcular calidad promedio
            quality_scores = [v.get("quality_score")
                              for v in videos if v.get("quality_score") is not None]
            filtered_quality_scores = [
                score for score in quality_scores if score is not None]
            avg_quality_score = sum(filtered_quality_scores) / len(
                filtered_quality_scores) if filtered_quality_scores else 0

            # Calcular duración total
            durations = [v.get("actual_duration", 0) or v.get(
                "target_duration", 0) for v in videos]
            total_duration = sum(durations)

            # Categorías usadas
            categories = list(set([v.get("category")
                              for v in videos if v.get("category")]))

            # Tono más usado
            tones = [v.get("tone") for v in videos if v.get("tone")]
            most_used_tone = max(
                set(tones), key=tones.count) if tones else None

            return {
                "total_videos": total_videos,
                "completed_videos": completed_videos,
                "failed_videos": failed_videos,
                "processing_videos": processing_videos,
                "avg_quality_score": round(avg_quality_score, 1),
                "total_duration": round(total_duration, 1),
                "categories_used": categories,
                "most_used_tone": most_used_tone
            }

        except Exception as e:
            logger.error(
                f"❌ Error obteniendo estadísticas del usuario: {str(e)}")
            return {}

    async def get_trending_videos(
        self,
        category: Optional[VideoCategory] = None,
        days: int = 30,
        limit: int = 10
    ) -> List[Video]:
        """Obtiene videos trending/populares."""
        try:
            # Fecha límite
            date_limit = datetime.utcnow() - timedelta(days=days)

            query = self.client.table("videos").select("*")

            # Filtrar por fecha
            query = query.gte("created_at", date_limit.isoformat())

            # Filtrar por categoría si se especifica
            if category:
                query = query.eq("category", category.value)

            # Solo videos completados
            query = query.eq("status", VideoStatus.COMPLETED.value)

            # Ordenar por métricas de engagement y calidad
            query = query.order("quality_score", desc=True)
            query = query.order("created_at", desc=True)
            query = query.limit(limit)

            result = query.execute()

            if not result.data:
                return []

            videos = [VideoModel(row).to_entity() for row in result.data]

            logger.info(f"🔥 Obtenidos {len(videos)} videos trending")
            return videos

        except Exception as e:
            logger.error(f"❌ Error obteniendo videos trending: {str(e)}")
            return []

    # ============= EMBEDDINGS Y CACHE =============

    async def update_embedding(self, video_id: str, embedding: List[float]) -> bool:
        """Actualiza el embedding de un video."""
        try:
            result = self.client.table("videos").update({
                "script_embedding": embedding,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", video_id).execute()

            if getattr(result, 'error', None):
                logger.error(
                    f"❌ Error actualizando embedding: {getattr(result, 'error', None)}")
                return False

            success = result.data and len(result.data) > 0
            if success:
                logger.info(f"🤖 Embedding actualizado para video {video_id}")

            return bool(success)

        except Exception as e:
            logger.error(f"❌ Error actualizando embedding: {str(e)}")
            return False

    async def get_videos_without_embeddings(self, limit: int = 50) -> List[Video]:
        """Obtiene videos que no tienen embeddings."""
        try:
            result = self.client.table("videos").select("*").is_(
                "script_embedding", "null"
            ).not_.is_("script_enhanced", "null").limit(limit).execute()

            if not result.data:
                return []

            videos = [VideoModel(row).to_entity() for row in result.data]

            logger.info(f"🔍 Encontrados {len(videos)} videos sin embeddings")
            return videos

        except Exception as e:
            logger.error(f"❌ Error obteniendo videos sin embeddings: {str(e)}")
            return []

    # ============= CLEANUP Y MANTENIMIENTO =============

    async def cleanup_failed_videos(self, days_old: int = 7) -> int:
        """Limpia videos fallidos antiguos."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)

            # Obtener videos fallidos antiguos
            failed_videos = self.client.table("videos").select("id").eq(
                "status", VideoStatus.FAILED.value
            ).lt("created_at", cutoff_date.isoformat()).execute()

            if not failed_videos.data:
                return 0

            count = len(failed_videos.data)

            # Eliminar videos fallidos
            result = self.client.table("videos").delete().eq(
                "status", VideoStatus.FAILED.value
            ).lt("created_at", cutoff_date.isoformat()).execute()

            if getattr(result, 'error', None):
                logger.error(
                    f"❌ Error en cleanup: {getattr(result, 'error', None)}")
                return 0

            logger.info(f"🧹 Limpiados {count} videos fallidos antiguos")
            return count

        except Exception as e:
            logger.error(f"❌ Error en cleanup: {str(e)}")
            return 0

    async def get_processing_health(self) -> Dict[str, Any]:
        """Obtiene métricas de salud del procesamiento."""
        try:
            # Contar videos por estado
            states_result = self.client.rpc("count_videos_by_status").execute()
            states_data = states_result.data if states_result.data else {}

            # Videos en procesamiento
            processing_count = sum([
                states_data.get(VideoStatus.ENHANCING_SCRIPT.value, 0),
                states_data.get(VideoStatus.GENERATING_EMBEDDING.value, 0),
                states_data.get(VideoStatus.SELECTING_CLIPS.value, 0),
                states_data.get(VideoStatus.GENERATING_AUDIO.value, 0),
                states_data.get(VideoStatus.ASSEMBLING_VIDEO.value, 0)
            ])

            # Calcular tasa de éxito
            completed = states_data.get(VideoStatus.COMPLETED.value, 0)
            failed = states_data.get(VideoStatus.FAILED.value, 0)
            total_finished = completed + failed
            success_rate = (
                completed / total_finished) if total_finished > 0 else 0

            # Video más antiguo en procesamiento
            oldest_processing = self.client.table("videos").select("created_at").in_(
                "status", [s.value for s in [
                    VideoStatus.ENHANCING_SCRIPT,
                    VideoStatus.GENERATING_EMBEDDING,
                    VideoStatus.SELECTING_CLIPS,
                    VideoStatus.GENERATING_AUDIO,
                    VideoStatus.ASSEMBLING_VIDEO
                ]]
            ).order("created_at").limit(1).execute()

            oldest_processing_date = None
            if oldest_processing.data:
                oldest_processing_date = oldest_processing.data[0]["created_at"]

            return {
                "videos_processing": processing_count,
                "success_rate": round(success_rate * 100, 1),  # Porcentaje
                "completed_videos": completed,
                "failed_videos": failed,
                "oldest_processing_video": oldest_processing_date
            }

        except Exception as e:
            logger.error(
                f"❌ Error obteniendo health de procesamiento: {str(e)}")
            return {
                "videos_processing": 0,
                "success_rate": 0,
                "completed_videos": 0,
                "failed_videos": 0,
                "oldest_processing_video": None
            }
