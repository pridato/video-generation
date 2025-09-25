from attrs import asdict
from app.domain.entities.clip import AssetClip, VideoClip
from app.domain.repositories.clip_repository import ClipRepository
from app.infrastructure.external.supabase.client import SupabaseClient
from app.infrastructure.database.models.asset_clip_model import AssetClipModel
from app.infrastructure.database.models.video_clip_model import VideoClipModel
from app.domain.entities.clip import AssetClip, VideoClip
from typing import List, Optional
import logging


logger = logging.getLogger(__name__)


class SupabaseClipRepository(ClipRepository):
    def __init__(self, supabase_client: SupabaseClient):
        self.client = supabase_client.client

    # ============= OPERACIONES CRUD =============

    async def create(self, entity: AssetClip) -> AssetClip:
        """
        Crea un nuevo clip de activo en la base de datos.

        Args:
            entity (AssetClip): El clip de activo a crear.

        Returns:
            AssetClip: El clip de activo creado con ID asignado.

        Example:
            clip = AssetClip(
                id=None,
                filename="education/coding_tutorial_5s.mp4",
                file_url="https://example.com/storage/education/coding_tutorial_5s.mp4",
                duration=5,
                concept_tags=["coding", "tutorial", "screen"],
                emotion_tags=["professional", "focused"],
                quality_score=8.5,
                usage_count=0,
                success_rate=0.0,
                avg_relevance_score=0.0,
                is_active=True,
                processing_status="ready",
                created_at=None,
                updated_at=None,
                embedding=[0.1, 0.2, ..., 0.768]
            )
            created_clip = await repository.create(clip)
            print(created_clip.id)  # UUID generado
        """
        try:
            clip_data = asdict(entity)
            # Convertir listas a formatos compatibles con Postgres
            clip_data['concept_tags'] = "{" + \
                ",".join(clip_data.get('concept_tags', [])) + "}"
            clip_data['emotion_tags'] = "{" + \
                ",".join(clip_data.get('emotion_tags', [])) + "}"

            result = self.client.table(
                "asset_clips").insert(clip_data).execute()
            # Ensure result.data[0] is a dict, not a model instance
            return AssetClipModel(dict(result.data[0])).to_entity()

        except Exception as e:
            logger.error(f"Error creando asset clip: {str(e)}")
            raise

    async def get_by_id(self, id: str) -> Optional[AssetClip]:
        """
        Obtiene un clip de activo por su ID.

        Args:
            id (str): ID del clip de activo a obtener.

        Returns:
            Optional[AssetClip]: El clip de activo si se encuentra, None en caso contrario.

        Example:
            clip = await repository.get_by_id("some-clip-id")
        """
        try:
            result = self.client.table("asset_clips").select(
                "*").eq("id", id).single().execute()

            if not result.data:
                return None

            return AssetClipModel(result.data).to_entity()

        except Exception as e:
            logger.error(f"Error obteniendo asset clip por ID: {str(e)}")
            return None

    async def update(self, entity: AssetClip) -> AssetClip:
        """
        Actualiza un clip de activo en la base de datos.

        Args:
            entity (AssetClip): El clip de activo a actualizar.

        Returns:
            AssetClip: El clip de activo actualizado.

        Example:
            clip = await repository.get_by_id("some-clip-id")
            clip.quality_score = 9.0
            updated_clip = await repository.update(clip)
        """
        try:
            clip_data = asdict(entity)
            # Convertir listas a formatos compatibles con Postgres
            clip_data['concept_tags'] = "{" + \
                ",".join(clip_data.get('concept_tags', [])) + "}"
            clip_data['emotion_tags'] = "{" + \
                ",".join(clip_data.get('emotion_tags', [])) + "}"
            result = self.client.table(
                "asset_clips").update(clip_data).eq("id", entity.id).execute()
            return AssetClipModel(dict(result.data[0])).to_entity()

        except Exception as e:
            logger.error(f"Error actualizando asset clip: {str(e)}")
            raise

    # ============= CONSULTAS ESPECÍFICAS =============

    async def search_by_embedding(self, embedding: List[float], limit: int = 20, target_duration: Optional[int] = None,
                                  emotion_filter: Optional[str] = None) -> List[AssetClip]:

        try:
            """
            Funcion search_asset_clips sql:

                Busca clips de video similares usando búsqueda semántica con pgvector

            Parámetros:
                query_embedding: Vector de embedding (768 dimensiones) del script de entrada
                target_duration: Duración objetivo en segundos (opcional, filtra ±50% tolerancia)
                emotion_filter: Etiqueta emocional para filtrar (opcional, ej: "energetic", "calm")
                max_results: Número máximo de resultados a retornar (default: 20)

            Retorna:
                id: UUID único del clip
                filename: Nombre del archivo (ej: "education/coding_tutorial_5s.mp4")
                file_url: URL completa del archivo en storage
                duration: Duración del clip en segundos (tipo numeric)
                concept_tags: Array de conceptos/tags (ej: ["coding", "tutorial", "screen"])
                emotion_tags: Array de emociones (ej: ["professional", "focused"])
                quality_score: Score de calidad del clip (0.0-10.0)
                usage_count: Número de veces que se ha usado el clip
                success_rate: Tasa de éxito en videos que usan este clip (0.0-1.0)
                similarity_score: Similitud semántica con el embedding de entrada (0.0-1.0)
                     donde 1.0 = idéntico y 0.0 = muy diferente
            """

            # Preparar parámetros para la función SQL
            params = {
                'query_embedding': embedding,
                'target_duration': target_duration,
                'emotion_filter': emotion_filter,
                'max_results': limit
            }

            # Llamar a la función SQL personalizada
            result = self.client.rpc(
                'search_asset_clips',
                params
            ).execute()

            if not result.data:
                logger.info("No se encontraron clips similares")
                return []

            # Convertir resultados a entidades
            clips = []
            for row in result.data:
                # Añadir similarity_score a los metadatos
                clip_data = dict(row)
                clip_data['similarity_score'] = clip_data.pop(
                    'similarity_score', 0.0)

                clips.append(AssetClipModel(clip_data).to_entity())

            logger.info(f"Encontrados {len(clips)} clips similares")
            return clips

        except Exception as e:
            logger.error(f"Error al buscar clips por embedding: {e}")
            return []

    async def get_by_category(self, category: str, limit: int = 50) -> List[AssetClip]:
        try:
            # obtener clips activos y procesados en la categoría dada, guardar en modelo y devolver entidad
            result = self.client.table("asset_clips").select("*").eq("category", category).eq("is_active", True).eq(
                "processing_status", "ready").order("quality_score", desc=True).limit(limit).execute()

            return [AssetClipModel(clip).to_entity() for clip in result.data]

        except Exception as e:
            logger.error(f"Error al obtener clips por categoría: {e}")
            return []

    async def get_by_tags(self, tags: List[str], limit: int = 50) -> List[AssetClip]:
        try:
            # Usar overlap operator para arrays
            tags_str = "{" + ",".join(tags) + "}"
            result = self.client.table("asset_clips").select("*").filter("concept_tags", "ov", tags_str).eq(
                "is_active", True).eq("processing_status", "ready").order("usage_count", desc=True).limit(limit).execute()

            return [AssetClipModel(clip).to_entity() for clip in result.data]

        except Exception as e:
            logger.error(f"Error obteniendo clips por tags: {str(e)}")
            return []

    async def update_usage_stats(self, clip_id: str, success: bool, relevance_score: float) -> bool:
        try:
            # Obtener stats actuales
            current = self.client.table("asset_clips").select(
                "usage_count, success_rate, avg_relevance_score").eq("id", clip_id).single().execute()

            if not current.data:
                return False  # Clip no encontrado

            # Calcular nuevos valores
            usage_count = current.data.get("usage_count", 0) + 1
            current_success_rate = current.data.get("success_rate", 0.0)
            current_avg_relevance = current.data.get(
                "avg_relevance_score", 0.0)

            # Calcular nuevos promedios (promedio móvil simple)
            success_rate = ((current_success_rate * (usage_count - 1)
                             ) + (1.0 if success else 0.0)) / usage_count
            avg_relevance = (
                (current_avg_relevance * (usage_count - 1)) + relevance_score) / usage_count

            # Actualizar
            result = self.client.table("asset_clips").update({
                "usage_count": usage_count,
                "success_rate": success_rate,
                "avg_relevance_score": avg_relevance,
                "last_used_at": "now()"
            }).eq("id", clip_id).execute()

            return len(result.data) > 0

        except Exception as e:
            logger.error(f"Error actualizando stats del clip: {str(e)}")
            return False

    async def create_video_clip_usage(self, video_clip: VideoClip) -> VideoClip:
        try:
            clip_data = {
                "id": video_clip.id,
                "video_id": video_clip.video_id,
                "asset_clip_id": video_clip.asset_clip_id,
                "order_in_video": video_clip.order_in_video,
                "start_time": video_clip.start_time,
                "end_time": video_clip.end_time,
                "duration_used": video_clip.duration_used,
                "relevance_score": video_clip.relevance_score,
                "selection_reason": video_clip.selection_reason,
                "embedding_similarity": video_clip.embedding_similarity,
                "transformations": video_clip.transformations,
                "filters_applied": video_clip.filters_applied,
                "metadata": video_clip.metadata,
                "created_at": video_clip.created_at.isoformat()
            }

            result = self.client.table(
                "video_clips").insert(clip_data).execute()
            # Ensure result.data[0] is a dict, not a model instance
            return VideoClipModel(dict(result.data[0])).to_entity()

        except Exception as e:
            logger.error(f"Error creando video clip usage: {str(e)}")
            raise

    async def get_video_clips(self, video_id: str) -> List[VideoClip]:
        try:
            result = self.client.table("video_clips").select(
                "*").eq("video_id", video_id).order("order_in_video").execute()

            return [VideoClipModel(clip).to_entity() for clip in result.data]

        except Exception as e:
            logger.error(f"Error obteniendo clips del video: {str(e)}")
            return []
