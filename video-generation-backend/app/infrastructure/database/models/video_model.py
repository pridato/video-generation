"""
Video Model - Mapea entre BD y entidad de dominio
"""

import json
from typing import List, Optional, Dict, Any
from datetime import datetime
from dataclasses import asdict

from app.domain.entities.video import (
    Video, VideoStatus, VideoTone, VideoCategory, VoiceId,
    SelectedClip, ProcessingMetadata, EngagementMetrics
)


class VideoModel:
    """
    Modelo para mapear datos de Supabase hacia entidad Video de dominio.

    Maneja la conversión entre tipos de BD (JSONB, VARCHAR, etc.) 
    y objetos Python (dataclasses, enums, etc.).
    """

    def __init__(self, db_row: Dict[str, Any]):
        """
        Inicializa el modelo con una fila de la BD.

        Args:
            db_row: Diccionario con datos de la fila de BD
        """
        self.db_row = db_row

    def to_entity(self) -> Video:
        """
        Convierte datos de BD a entidad de dominio.

        Returns:
            Video: Entidad de dominio completamente hidratada
        """
        try:
            # Parse clips_used (JSONB -> List[SelectedClip])
            clips_used = []
            if self.db_row.get('clips_used'):
                clips_data = self._parse_jsonb(self.db_row['clips_used'])
                clips_used = [
                    SelectedClip(
                        clip_id=clip['clip_id'],
                        clip_url=clip['clip_url'],
                        start_time=float(clip['start_time']),
                        duration=float(clip['duration']),
                        relevance_score=float(clip['relevance_score']),
                        position_in_video=int(clip['position_in_video'])
                    )
                    for clip in clips_data
                ]

            # Parse processing_metadata (JSONB -> ProcessingMetadata)
            processing_metadata = None
            if self.db_row.get('processing_metadata'):
                metadata_data = self._parse_jsonb(
                    self.db_row['processing_metadata'])
                processing_metadata = ProcessingMetadata(
                    steps_completed=metadata_data.get('steps_completed', []),
                    processing_times=metadata_data.get('processing_times', {}),
                    openai_calls=metadata_data.get('openai_calls', 0),
                    clips_considered=metadata_data.get('clips_considered', 0),
                    clips_selected=metadata_data.get('clips_selected', 0),
                    total_processing_time=metadata_data.get(
                        'total_processing_time'),
                    error_count=metadata_data.get('error_count', 0),
                    retry_count=metadata_data.get('retry_count', 0)
                )

            # Parse engagement_metrics (JSONB -> EngagementMetrics)
            engagement_metrics = None
            if self.db_row.get('engagement_metrics'):
                metrics_data = self._parse_jsonb(
                    self.db_row['engagement_metrics'])
                engagement_metrics = EngagementMetrics(
                    views=metrics_data.get('views', 0),
                    likes=metrics_data.get('likes', 0),
                    shares=metrics_data.get('shares', 0),
                    comments=metrics_data.get('comments', 0),
                    watch_time_avg=metrics_data.get('watch_time_avg'),
                    click_through_rate=metrics_data.get('click_through_rate')
                )

            # Parse template_config (JSONB -> Dict)
            template_config = {}
            if self.db_row.get('template_config'):
                template_config = self._parse_jsonb(
                    self.db_row['template_config'])

            # Parse script_embedding (VECTOR -> List[float])
            script_embedding = None
            if self.db_row.get('script_embedding'):
                # pgvector devuelve como string "[0.1,0.2,0.3]" o como lista
                embedding_raw = self.db_row['script_embedding']
                if isinstance(embedding_raw, str):
                    # Limpiar y parsear string vector
                    embedding_str = embedding_raw.strip('[]')
                    script_embedding = [float(x.strip())
                                        for x in embedding_str.split(',')]
                elif isinstance(embedding_raw, list):
                    script_embedding = [float(x) for x in embedding_raw]

            # Crear entidad Video
            return Video(
                # Identificadores
                id=self.db_row.get('id'),
                user_id=self.db_row['user_id'],

                # Script data
                script_original=self.db_row['script_original'],
                script_enhanced=self.db_row.get('script_enhanced'),
                script_embedding=script_embedding,

                # Video metadata
                title=self.db_row['title'],
                description=self.db_row.get('description'),
                target_duration=int(self.db_row['target_duration']),
                actual_duration=float(self.db_row['actual_duration']) if self.db_row.get(
                    'actual_duration') else None,

                # URLs
                video_url=self.db_row.get('video_url'),
                thumbnail_url=self.db_row.get('thumbnail_url'),
                audio_url=self.db_row.get('audio_url'),

                # Clips y configuración
                clips_used=clips_used,
                tone=VideoTone(self.db_row['tone']),
                category=VideoCategory(self.db_row['category']),
                voice_id=VoiceId(self.db_row.get('voice_id', 'nova')),
                template_config=template_config,

                # Processing status
                status=VideoStatus(self.db_row['status']),
                processing_metadata=processing_metadata,
                error_message=self.db_row.get('error_message'),

                # Quality y analytics
                quality_score=self.db_row.get('quality_score'),
                engagement_metrics=engagement_metrics,

                # Timestamps
                created_at=self._parse_timestamp(
                    self.db_row.get('created_at')),
                updated_at=self._parse_timestamp(
                    self.db_row.get('updated_at')),
                completed_at=self._parse_timestamp(
                    self.db_row.get('completed_at'))
            )

        except Exception as e:
            raise ValueError(
                f"Error convirtiendo DB row a Video entity: {str(e)}") from e

    @staticmethod
    def from_entity(video: Video) -> Dict[str, Any]:
        """
        Convierte entidad de dominio a datos para BD.

        Args:
            video: Entidad Video de dominio

        Returns:
            Dict con datos preparados para insertar/actualizar en BD
        """
        try:
            # Convertir clips_used a JSONB
            clips_data = []
            if video.clips_used:
                clips_data = [
                    {
                        'clip_id': clip.clip_id,
                        'clip_url': clip.clip_url,
                        'start_time': clip.start_time,
                        'duration': clip.duration,
                        'relevance_score': clip.relevance_score,
                        'position_in_video': clip.position_in_video
                    }
                    for clip in video.clips_used
                ]

            # Convertir processing_metadata a JSONB
            processing_metadata_data = None
            if video.processing_metadata:
                processing_metadata_data = {
                    'steps_completed': video.processing_metadata.steps_completed,
                    'processing_times': video.processing_metadata.processing_times,
                    'openai_calls': video.processing_metadata.openai_calls,
                    'clips_considered': video.processing_metadata.clips_considered,
                    'clips_selected': video.processing_metadata.clips_selected,
                    'total_processing_time': video.processing_metadata.total_processing_time,
                    'error_count': video.processing_metadata.error_count,
                    'retry_count': video.processing_metadata.retry_count
                }

            # Convertir engagement_metrics a JSONB
            engagement_metrics_data = None
            if video.engagement_metrics:
                engagement_metrics_data = {
                    'views': video.engagement_metrics.views,
                    'likes': video.engagement_metrics.likes,
                    'shares': video.engagement_metrics.shares,
                    'comments': video.engagement_metrics.comments,
                    'watch_time_avg': video.engagement_metrics.watch_time_avg,
                    'click_through_rate': video.engagement_metrics.click_through_rate
                }

            # Convertir embedding a formato para pgvector
            script_embedding = None
            if video.script_embedding:
                # pgvector acepta arrays de Python directamente
                script_embedding = video.script_embedding

            return {
                'id': video.id,
                'user_id': video.user_id,

                # Script data
                'script_original': video.script_original,
                'script_enhanced': video.script_enhanced,
                'script_embedding': script_embedding,

                # Video metadata
                'title': video.title,
                'description': video.description,
                'target_duration': video.target_duration,
                'actual_duration': video.actual_duration,

                # URLs
                'video_url': video.video_url,
                'thumbnail_url': video.thumbnail_url,
                'audio_url': video.audio_url,

                # Configuration
                'clips_used': clips_data,
                'tone': video.tone.value,
                'category': video.category.value,
                'voice_id': video.voice_id.value,
                'template_config': video.template_config,

                # Processing status
                'status': video.status.value,
                'processing_metadata': processing_metadata_data,
                'error_message': video.error_message,

                # Quality y analytics
                'quality_score': video.quality_score,
                'engagement_metrics': engagement_metrics_data,

                # Timestamps
                'created_at': video.created_at.isoformat() if video.created_at else None,
                'updated_at': video.updated_at.isoformat() if video.updated_at else None,
                'completed_at': video.completed_at.isoformat() if video.completed_at else None
            }

        except Exception as e:
            raise ValueError(
                f"Error convirtiendo Video entity a DB data: {str(e)}") from e

    def _parse_jsonb(self, jsonb_data: Any) -> Dict[str, Any]:
        """
        Parsea datos JSONB de Supabase.

        Args:
            jsonb_data: Datos JSONB (puede ser dict, string, etc.)

        Returns:
            Dict parseado
        """
        if jsonb_data is None:
            return {}

        if isinstance(jsonb_data, dict):
            return jsonb_data

        if isinstance(jsonb_data, str):
            try:
                return json.loads(jsonb_data)
            except json.JSONDecodeError:
                return {}

        return {}

    def _parse_timestamp(self, timestamp_data: Any) -> Optional[datetime]:
        """
        Parsea timestamps de Supabase.

        Args:
            timestamp_data: Timestamp en formato string o datetime

        Returns:
            datetime object o None
        """
        if timestamp_data is None:
            return None

        if isinstance(timestamp_data, datetime):
            return timestamp_data

        if isinstance(timestamp_data, str):
            try:
                # Manejar diferentes formatos de timestamp
                if timestamp_data.endswith('Z'):
                    return datetime.fromisoformat(timestamp_data.replace('Z', '+00:00'))
                else:
                    return datetime.fromisoformat(timestamp_data)
            except ValueError:
                return None

        return None

    def validate_db_row(self) -> bool:
        """
        Valida que la fila de BD tenga los campos requeridos.

        Returns:
            True si es válida, False si no
        """
        required_fields = [
            'user_id', 'script_original', 'title',
            'target_duration', 'tone', 'category', 'status'
        ]

        for field in required_fields:
            if field not in self.db_row or self.db_row[field] is None:
                return False

        return True

    def get_summary_data(self) -> Dict[str, Any]:
        """
        Retorna datos resumidos para listados/APIs.

        Returns:
            Dict con datos esenciales del video
        """
        return {
            'id': self.db_row.get('id'),
            'title': self.db_row.get('title'),
            'status': self.db_row.get('status'),
            'target_duration': self.db_row.get('target_duration'),
            'actual_duration': self.db_row.get('actual_duration'),
            'quality_score': self.db_row.get('quality_score'),
            'created_at': self.db_row.get('created_at'),
            'completed_at': self.db_row.get('completed_at'),
            'video_url': self.db_row.get('video_url'),
            'thumbnail_url': self.db_row.get('thumbnail_url')
        }
