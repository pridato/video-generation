from datetime import datetime
from typing import Dict, Any, List, Optional
from app.domain.entities.video import Video, SelectedClip, AudioConfig, TemplateVideo, VideoStatus, VideoQuality, VoiceType


class VideoModel:
    def __init__(self, data: dict):
        self.id = data['id']
        self.user_id = data['user_id']
        self.title = data['title']
        self.script = data['script']
        self.template_id = data['template_id']
        self.voice_id = data.get('voice_id')
        self.status = data.get('status', 'processing')
        self.video_url = data.get('video_url')
        self.thumbnail_url = data.get('thumbnail_url')
        self.duration = data.get('duration')
        self.settings = data.get('settings', {})
        self.analytics = data.get('analytics', {})
        self.enhanced_script = data.get('enhanced_script')
        self.final_script = data.get('final_script')
        self.clips_used = data.get('clips_used', [])
        self.voice_settings = data.get('voice_settings', {})
        self.background_music = data.get('background_music')
        self.sound_effects = data.get('sound_effects', [])
        self.actual_duration = data.get('actual_duration')
        self.file_size = data.get('file_size')
        self.processing_time = data.get('processing_time')
        self.quality_score = data.get('quality_score')
        self.subtitles_url = data.get('subtitles_url')
        self.error_message = data.get('error_message')
        self.retry_count = data.get('retry_count', 0)
        self.download_count = data.get('download_count', 0)
        self.share_count = data.get('share_count', 0)
        self.credits_consumed = data.get('credits_consumed', 1)
        self.processing_cost_usd = data.get('processing_cost_usd', 0)
        self.audio_generated_url = data.get('audio_generated_url')
        self.performance_score = data.get('performance_score')
        self.is_favorite = data.get('is_favorite', False)
        self.user_rating = data.get('user_rating')
        self.user_feedback = data.get('user_feedback')
        self.hashtags = data.get('hashtags', [])
        self.seo_keywords = data.get('seo_keywords', [])
        self.is_public = data.get('is_public', False)
        self.created_at = datetime.fromisoformat(data['created_at'].replace(
            'Z', '+00:00')) if data.get('created_at') else datetime.utcnow()
        self.updated_at = datetime.fromisoformat(data['updated_at'].replace(
            'Z', '+00:00')) if data.get('updated_at') else None

    def to_entity(self) -> Video:
        # AudioConfig
        audio_cfg = AudioConfig(
            voice=VoiceType(
                self.voice_id) if self.voice_id else VoiceType.ALLOY,
            speed=self.voice_settings.get('speed', 1.0),
            volume=self.voice_settings.get('volume', 1.0),
            include_background_music=bool(
                self.voice_settings.get('include_background_music', False)),
            url_generated_audio=self.audio_generated_url
        )

        # TemplateVideo
        template = TemplateVideo(
            id=self.template_id,
            name=self.settings.get('template_name', 'default'),
            is_premium=bool(self.settings.get('is_premium', False)),
            configuration=self.settings
        )

        # SelectedClips
        clips: List[SelectedClip] = []
        for clip_data in self.clips_used:
            clips.append(
                SelectedClip(
                    id=clip_data['id'],
                    url=clip_data.get('url', ''),
                    duration=float(clip_data.get('duration', 0)),
                    initial_position=float(
                        clip_data.get('initial_position', 0)),
                    latest_position=float(clip_data.get('latest_position', 0)),
                    relevance_score=float(clip_data.get('relevance_score', 0)),
                    metadata=clip_data.get('metadata', {})
                )
            )

        return Video(
            id=self.id,
            user_id=self.user_id,
            script=self.script,
            title=self.title,
            description=self.settings.get('description'),
            template=template,
            audio_config=audio_cfg,
            selected_clips=clips,
            quality=VideoQuality(self.settings.get('quality', 'HD')),
            target_duration=int(self.settings.get('target_duration', 60)),
            final_duration=self.actual_duration,
            state=VideoStatus(self.status),
            url_final_video=self.video_url,
            url_thumbnail=self.thumbnail_url,
            metadata=self.settings,
            stadistics=self.analytics,
            error_message=self.error_message,
            created_at=self.created_at,
            processed_at=self.updated_at
        )
