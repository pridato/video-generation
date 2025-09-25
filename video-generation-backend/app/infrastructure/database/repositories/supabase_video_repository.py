"""
Implementación del repositorio de videos usando Supabase.
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.domain.repositories.video_repository import VideoRepository
from app.domain.entities.video import Video, VideoStatus
from app.infrastructure.external.supabase.client import SupabaseClient
from app.infrastructure.database.models.video_model import VideoModel

logger = logging.getLogger(__name__)


class SupabaseVideoRepository(VideoRepository):
    """Implementación del repositorio de videos usando Supabase."""

    def __init__(self, supabase_client: SupabaseClient):
        self.client = supabase_client.client

    # ============= OPERACIONES CRUD =============

    async def create(self, entity: Video) -> Video:
        try:

            # Convertir entidad a datos para DB
            data = {
                "id": entity.id,
                "user_id": entity.user_id,
                "title": entity.title,
                "script": entity.script,
                "template_id": entity.template.id,
                "voice_id": entity.audio_config.voice.value,
                "status": entity.state.value,
                "video_url": entity.url_final_video,
                "thumbnail_url": entity.url_thumbnail,
                "duration": entity.target_duration,
                "actual_duration": entity.final_duration,
                "settings": {
                    **entity.template.configuration,
                    "description": entity.description,
                    "quality": entity.quality.value,
                    "target_duration": entity.target_duration,
                    "template_name": entity.template.name,
                    "is_premium": entity.template.is_premium
                },
                "voice_settings": {
                    "speed": entity.audio_config.speed,
                    "volume": entity.audio_config.volume,
                    "include_background_music": entity.audio_config.include_background_music
                },
                "clips_used": [
                    {
                        "id": clip.id,
                        "url": clip.url,
                        "duration": clip.duration,
                        "initial_position": clip.initial_position,
                        "latest_position": clip.latest_position,
                        "relevance_score": clip.relevance_score,
                        "metadata": clip.metadata
                    } for clip in entity.selected_clips
                ],
                "analytics": entity.stadistics,
                "error_message": entity.error_message,
                "audio_generated_url": entity.audio_config.url_generated_audio,
                "created_at": entity.created_at.isoformat(),
                "updated_at": entity.processed_at.isoformat() if entity.processed_at else None
            }

            # Insertar en la tabla "videos"
            result = self.client.table("videos").insert(data).execute()

            # si la inserción fue exitosa, retornar la entidad creada
            if result.data:
                logger.info(f"Video creado exitosamente: {entity.id}")
                return VideoModel(result.data[0]).to_entity()
            else:
                raise Exception("No se pudo crear el video")

        except Exception as e:
            logger.error(f"Error creando video: {str(e)}")
            raise

    async def get_by_id(self, id: str) -> Optional[Video]:
        try:
            # Consultar la tabla "videos" por ID
            result = self.client.table("videos").select(
                "*").eq("id", id).single().execute()

            # si la consulta fue exitosa, retornar la entidad encontrada
            if result.data:
                return VideoModel(result.data).to_entity()
            return None

        except Exception as e:
            logger.error(f"Error obteniendo video por ID {id}: {str(e)}")
            return None

    async def update(self, entity: Video) -> Video:
        raise NotImplementedError("Método no implementado")

    async def delete(self, id: str) -> bool:
        raise NotImplementedError("Método no implementado")

    # ============= CONSULTAS ESPECÍFICAS =============

    async def get_by_user_id(self, user_id: str, limit: int = 10, offset: int = 0) -> List[Video]:
        try:
            # Consultar la tabla "videos" por user_id con paginación y ordenado por fecha de creación descendente
            result = self.client.table("videos").select("*").eq(
                "user_id", user_id
            ).order("created_at", desc=True).limit(limit).offset(offset).execute()

            # si la consulta fue exitosa, retornar la lista de entidades encontradas
            return [VideoModel(video).to_entity() for video in result.data]

        except Exception as e:
            logger.error(
                f"Error obteniendo videos por usuario {user_id}: {str(e)}")
            return []

    async def update_state(self, video_id: str, state: VideoStatus, error_message: Optional[str] = None) -> bool:
        try:
            # Preparar los datos a actualizar
            update_data = {
                "status": state.value,
                "updated_at": datetime.utcnow().isoformat()
            }

            # Incluir mensaje de error si se proporciona
            if error_message:
                update_data["error_message"] = error_message

            # Actualizar el estado del video en la tabla "videos"
            result = self.client.table("videos").update(
                update_data).eq("id", video_id).execute()

            # Retornar True si la actualización fue exitosa
            success = bool(result.data)
            if success:
                logger.info(
                    f"Estado del video {video_id} actualizado a {state.value}")

            return success

        except Exception as e:
            logger.error(
                f"Error actualizando estado del video {video_id}: {str(e)}")
            return False

    async def set_video_url(self, video_id: str, url: str, duration: float) -> bool:
        try:
            # Actualizar la URL del video y la duración en la tabla "videos"
            result = self.client.table("videos").update({
                "video_url": url,
                "actual_duration": duration,
                "status": VideoStatus.COMPLETED.value,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", video_id).execute()

            # Retornar True si la actualización fue exitosa
            success = bool(result.data)
            if success:
                logger.info(f"URL del video {video_id} establecida: {url}")

            return success

        except Exception as e:
            logger.error(
                f"Error estableciendo URL del video {video_id}: {str(e)}")
            return False

    async def search_by_title(self, query: str, user_id: Optional[str] = None) -> List[Video]:
        try:
            # Construir la consulta con filtro por título (case insensitive)
            supabase_query = self.client.table("videos").select("*").ilike(
                "title", f"%{query}%"
            )

            # Filtrar por user_id si se proporciona
            if user_id:
                supabase_query = supabase_query.eq("user_id", user_id)

            # Ejecutar la consulta ordenada por fecha de creación descendente
            result = supabase_query.order("created_at", desc=True).execute()

            # Retornar la lista de entidades encontradas
            return [VideoModel(video).to_entity() for video in result.data]

        except Exception as e:
            logger.error(
                f"Error buscando videos por título '{query}': {str(e)}")
            return []

    async def get_user_video_stats(self, user_id: str) -> dict:
        try:
            # Consultar todos los videos del usuario
            result = self.client.table("videos").select(
                "status, actual_duration").eq("user_id", user_id).execute()

            # Si no hay datos, retornar estadísticas vacías
            if not result.data:
                return {
                    "total_videos": 0,
                    "completed_videos": 0,
                    "processing_videos": 0,
                    "failed_videos": 0,
                    "pending_videos": 0,
                    "success_rate": 0.0,
                    "avg_duration": 0.0,
                    "total_duration": 0.0
                }

            # Calcular estadísticas
            videos = result.data
            total_videos = len(videos)

            # Contar por estado
            completed = len([v for v in videos if v.get(
                "status") == VideoStatus.COMPLETED.value])
            processing = len([v for v in videos if v.get(
                "status") == VideoStatus.PROCESSING.value])
            failed = len([v for v in videos if v.get(
                "status") == VideoStatus.FAILED.value])
            pending = len([v for v in videos if v.get(
                "status") == VideoStatus.PENDING.value])

            # Duraciones de videos completados
            completed_durations = [
                v.get("actual_duration", 0) for v in videos
                if v.get("status") == VideoStatus.COMPLETED.value and v.get("actual_duration")
            ]

            # Duración total y promedio
            total_duration = sum(completed_durations)
            avg_duration = total_duration / \
                len(completed_durations) if completed_durations else 0

            # Tasa de éxito
            success_rate = (completed / total_videos *
                            100) if total_videos > 0 else 0

            return {
                "total_videos": total_videos,
                "completed_videos": completed,
                "processing_videos": processing,
                "failed_videos": failed,
                "pending_videos": pending,
                "success_rate": round(success_rate, 2),
                "avg_duration": round(avg_duration, 2),
                "total_duration": round(total_duration, 2)
            }

        except Exception as e:
            logger.error(
                f"Error obteniendo estadísticas del usuario {user_id}: {str(e)}")
            return {}

    async def count_by_user_and_month(self, user_id: str, year: int, month: int) -> int:
        try:
            # Crear rango de fechas para el mes
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)

            # Contar videos creados en el rango de fechas para el usuario filtrado
            result = self.client.table("videos").select("id").eq(
                "user_id", user_id
            ).gte(
                "created_at", start_date.isoformat()
            ).lt(
                "created_at", end_date.isoformat()
            ).execute()

            # Retornar la cantidad de videos encontrados
            return len(result.data)

        except Exception as e:
            logger.error(
                f"Error contando videos del usuario {user_id} en {month}/{year}: {str(e)}")
            return 0

    async def get_processing_time_stats(self, days: int = 30) -> dict:
        try:
            # Calcular la fecha límite
            fecha_limite = datetime.utcnow() - timedelta(days=days)

            # Consultar videos completados creados después de la fecha límite
            result = self.client.table("videos").select("created_at, updated_at").eq(
                "status", VideoStatus.COMPLETED.value
            ).gte(
                "created_at", fecha_limite.isoformat()
            ).execute()

            # Si no hay datos, retornar estadísticas vacías
            if not result.data:
                return {
                    "avg_processing_time": 0.0,
                    "min_processing_time": 0.0,
                    "max_processing_time": 0.0,
                    "total_videos_analyzed": 0,
                    "days_analyzed": days
                }

            # Calcular tiempos de procesamiento en segundos
            processing_times = []
            for video in result.data:
                if video.get("created_at") and video.get("updated_at"):
                    created = datetime.fromisoformat(
                        video["created_at"].replace('Z', '+00:00'))
                    updated = datetime.fromisoformat(
                        video["updated_at"].replace('Z', '+00:00'))
                    processing_time = (updated - created).total_seconds()
                    processing_times.append(processing_time)

            # Calcular estadísticas
            if processing_times:
                return {
                    "avg_processing_time": round(sum(processing_times) / len(processing_times), 2),
                    "min_processing_time": round(min(processing_times), 2),
                    "max_processing_time": round(max(processing_times), 2),
                    "total_videos_analyzed": len(processing_times),
                    "days_analyzed": days
                }
            else:
                # si no hay tiempos de procesamiento válidos devuelve estadísticas vacías
                return {
                    "avg_processing_time": 0.0,
                    "min_processing_time": 0.0,
                    "max_processing_time": 0.0,
                    "total_videos_analyzed": 0,
                    "days_analyzed": days
                }

        except Exception as e:
            logger.error(
                f"Error obteniendo estadísticas de procesamiento: {str(e)}")
            return {}
