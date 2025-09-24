from datetime import datetime
from app.domain.entities.clip import AssetClip, MotionIntensity, SceneType, ProcessingStatus, VideoOrientation


class AssetClipModel:
    def __init__(self, data: dict):
        self.id = data['id']
        self.filename = data['filename']
        self.file_url = data['file_url']
        self.file_size = data.get('file_size', 0)
        self.duration = data['duration']
        self.resolution = data.get('resolution', '1920x1080')
        self.format = data.get('format', 'mp4')
        self.concept_tags = data.get('concept_tags', [])
        self.emotion_tags = data.get('emotion_tags', [])
        self.scene_type = data.get('scene_type', 'medium')
        self.dominant_colors = data.get('dominant_colors', [])
        self.description = data.get('description')
        self.keywords = data.get('keywords', [])
        self.embedding = data.get('embedding')
        self.quality_score = data.get('quality_score', 5.0)
        self.motion_intensity = data.get('motion_intensity', 'medium')
        self.audio_present = data.get('audio_present', False)
        self.usage_count = data.get('usage_count', 0)
        self.success_rate = data.get('success_rate', 0.0)
        self.processing_status = data.get('processing_status', 'ready')
        self.is_active = data.get('is_active', True)
        self.is_premium = data.get('is_premium', False)
        self.category = data.get('category')
        self.subcategory = data.get('subcategory')
        self.collection_name = data.get('collection_name')
        self.compatible_emotions = data.get('compatible_emotions', [])
        self.compatible_topics = data.get('compatible_topics', [])
        self.best_for_segments = data.get('best_for_segments', [])
        self.avg_relevance_score = data.get('avg_relevance_score', 0.0)
        self.created_at = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00')) \
            if data.get('created_at') else datetime.utcnow()
        self.updated_at = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00')) \
            if data.get('updated_at') else None
        self.last_used_at = datetime.fromisoformat(data['last_used_at'].replace('Z', '+00:00')) \
            if data.get('last_used_at') else None

    def to_entity(self) -> AssetClip:
        return AssetClip(
            id=self.id,
            filename=self.filename,
            file_url=self.file_url,
            file_size=self.file_size,
            duration=self.duration,
            resolution=self.resolution,
            format=self.format,
            concept_tags=self.concept_tags,
            emotion_tags=self.emotion_tags,
            scene_type=SceneType(self.scene_type),
            dominant_colors=self.dominant_colors,
            description=self.description,
            keywords=self.keywords,
            embedding=self.embedding,
            quality_score=self.quality_score,
            motion_intensity=MotionIntensity(self.motion_intensity),
            audio_present=self.audio_present,
            usage_count=self.usage_count,
            success_rate=self.success_rate,
            avg_relevance_score=self.avg_relevance_score,
            compatible_emotions=self.compatible_emotions,
            compatible_topics=self.compatible_topics,
            best_for_segments=self.best_for_segments,
            fps=30,  # puedes mapear desde otro campo si lo tienes
            bitrate=None,
            codec=None,
            has_transparency=False,
            orientation=VideoOrientation.LANDSCAPE,
            processing_status=ProcessingStatus(self.processing_status),
            is_active=self.is_active,
            is_premium=self.is_premium,
            category=self.category,
            subcategory=self.subcategory,
            collection_name=self.collection_name,
            source_url=None,
            license_type='royalty_free',
            credits_required=None,
            visual_analysis={},
            movement_analysis={},
            created_at=self.created_at,
            updated_at=self.updated_at,
            last_used_at=self.last_used_at
        )
