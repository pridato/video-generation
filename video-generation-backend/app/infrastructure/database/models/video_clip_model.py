from datetime import datetime
from typing import Dict, Any, Optional
from app.domain.entities.clip import VideoClip


class VideoClipModel:
    def __init__(self, data: dict):
        self.id = data['id']
        self.video_id = data['video_id']
        self.asset_clip_id = data['asset_clip_id']
        self.order_in_video = data['order_in_video']
        self.start_time = float(data['start_time'])
        self.end_time = float(data['end_time'])
        self.duration_used = float(data['duration_used'])
        self.relevance_score = float(data.get('relevance_score', 0.0))
        self.selection_reason = data.get('selection_reason', '')
        self.embedding_similarity = float(data['embedding_similarity']) if data.get(
            'embedding_similarity') is not None else None
        self.transformations = data.get('transformations', {})
        self.filters_applied = data.get('filters_applied', {})
        self.created_at = datetime.fromisoformat(data['created_at'].replace(
            'Z', '+00:00')) if data.get('created_at') else datetime.utcnow()

        # Campos adicionales opcionales
        self.clip_start_time = float(data.get('clip_start_time', 0.0))
        self.clip_end_time = float(data['clip_end_time']) if data.get(
            'clip_end_time') is not None else None
        self.performance_score = float(data['performance_score']) if data.get(
            'performance_score') is not None else None
        self.user_feedback = data.get('user_feedback')
        self.metadata = data.get('metadata', {})
        self.algorithm_version = data.get('algorithm_version')

    def to_entity(self) -> VideoClip:
        return VideoClip(
            id=self.id,
            video_id=self.video_id,
            asset_clip_id=self.asset_clip_id,
            order_in_video=self.order_in_video,
            start_time=self.start_time,
            end_time=self.end_time,
            duration_used=self.duration_used,
            relevance_score=self.relevance_score,
            selection_reason=self.selection_reason,
            embedding_similarity=self.embedding_similarity,
            clip_start_time=self.clip_start_time,
            clip_end_time=self.clip_end_time,
            transformations=self.transformations,
            filters_applied=self.filters_applied,
            performance_score=self.performance_score,
            user_feedback=self.user_feedback,
            metadata=self.metadata,
            algorithm_version=self.algorithm_version,
            created_at=self.created_at
        )
