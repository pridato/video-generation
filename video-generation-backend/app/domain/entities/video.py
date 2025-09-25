"""
Entidad Video redefinida - Contiene scripts embedded

Esta entidad representa un video completo, incluyendo el script original,
el script mejorado por IA, el embedding del script, los clips seleccionados,
y toda la metadata relevante para el proceso de creación y análisis posterior.

"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# ============= ENUMS =============

class VideoStatus(str, Enum):
    """Estados del proceso de creación de video."""
    CREATED = "created"
    ENHANCING_SCRIPT = "enhancing_script"
    GENERATING_EMBEDDING = "generating_embedding"
    SELECTING_CLIPS = "selecting_clips"
    GENERATING_AUDIO = "generating_audio"
    ASSEMBLING_VIDEO = "assembling_video"
    COMPLETED = "completed"
    FAILED = "failed"


class VideoTone(str, Enum):
    """Tono del video."""
    EDUCATIVO = "educativo"
    VIRAL = "viral"
    PROFESIONAL = "profesional"
    CASUAL = "casual"
    ENERGETICO = "energetico"


class VideoCategory(str, Enum):
    """Categoría del contenido."""
    TECH = "tech"
    MARKETING = "marketing"
    EDUCATION = "education"
    ENTERTAINMENT = "entertainment"
    LIFESTYLE = "lifestyle"
    BUSINESS = "business"
    FITNESS = "fitness"
    FOOD = "food"
    TRAVEL = "travel"
    NEWS = "news"


class VoiceId(str, Enum):
    """Voces disponibles para TTS."""
    ALLOY = "alloy"
    ECHO = "echo"
    FABLE = "fable"
    ONYX = "onyx"
    NOVA = "nova"
    SHIMMER = "shimmer"


# ============= VALUE OBJECTS =============

@dataclass
class SelectedClip:
    """Representa un clip seleccionado para el video."""
    clip_id: str
    clip_url: str
    start_time: float  # Cuando aparece en el video final
    duration: float
    relevance_score: float  # 0-1, qué tan relevante es para el script
    position_in_video: int  # Orden de aparición


@dataclass
class ProcessingMetadata:
    """Metadata del proceso de creación."""
    steps_completed: List[str]
    processing_times: Dict[str, float]  # tiempo por paso en segundos
    openai_calls: int
    clips_considered: int
    clips_selected: int
    total_processing_time: Optional[float]
    error_count: int
    retry_count: int


@dataclass
class EngagementMetrics:
    """Métricas de engagement del video."""
    views: int = 0
    likes: int = 0
    shares: int = 0
    comments: int = 0
    watch_time_avg: Optional[float] = None  # porcentaje promedio visto
    click_through_rate: Optional[float] = None


# ============= ENTIDAD PRINCIPAL =============

@dataclass
class Video:
    """
    Entidad principal que representa un video completo.

    Contiene el script embedded y todos los datos necesarios
    para el proceso de creación y análisis posterior.
    """
    # Identificadores
    id: Optional[str]
    user_id: str

    # Script data (embedded)
    script_original: str
    script_enhanced: Optional[str] = None
    script_embedding: Optional[List[float]] = None

    # Video metadata
    title: str = ''
    description: Optional[str] = None
    target_duration: int = 0  # segundos
    actual_duration: Optional[float] = None

    # URLs de contenido
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    audio_url: Optional[str] = None

    # Clips y configuración
    clips_used: List[SelectedClip] = []
    tone: VideoTone = VideoTone.CASUAL
    category: VideoCategory = VideoCategory.TECH
    voice_id: VoiceId = VoiceId.NOVA
    template_config: Dict[str, Any] = {}

    # Processing status
    status: VideoStatus = VideoStatus.CREATED
    processing_metadata: Optional[ProcessingMetadata] = None
    error_message: Optional[str] = None

    # Quality y analytics
    quality_score: Optional[int] = None  # 0-100
    engagement_metrics: Optional[EngagementMetrics] = None

    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    def __post_init__(self):
        """Inicialización post-creación."""
        if self.clips_used is None:
            self.clips_used = []
        if self.template_config is None:
            self.template_config = {}
        if self.created_at is None:
            self.created_at = datetime.utcnow()

    # ============= COMPUTED PROPERTIES =============

    @property
    def is_completed(self) -> bool:
        """Indica si el video está completamente procesado."""
        return self.status == VideoStatus.COMPLETED

    @property
    def is_failed(self) -> bool:
        """Indica si el proceso falló."""
        return self.status == VideoStatus.FAILED

    @property
    def is_processing(self) -> bool:
        """Indica si el video está en proceso."""
        return self.status not in [VideoStatus.COMPLETED, VideoStatus.FAILED, VideoStatus.CREATED]

    @property
    def has_enhanced_script(self) -> bool:
        """Indica si el script fue mejorado por IA."""
        return self.script_enhanced is not None and len(self.script_enhanced.strip()) > 0

    @property
    def effective_script(self) -> Optional[str]:
        """Retorna el script a usar (enhanced si existe, sino original)."""
        return self.script_enhanced if self.has_enhanced_script else self.script_original

    @property
    def total_clips_duration(self) -> float:
        """Duración total de todos los clips seleccionados."""
        return sum(clip.duration for clip in self.clips_used)

    @property
    def average_clip_relevance(self) -> float:
        """Promedio de relevancia de clips seleccionados."""
        if not self.clips_used:
            return 0.0
        return sum(clip.relevance_score for clip in self.clips_used) / len(self.clips_used)

    @property
    def processing_progress(self) -> float:
        """Progreso del procesamiento (0-1)."""
        status_progress = {
            VideoStatus.CREATED: 0.0,
            VideoStatus.ENHANCING_SCRIPT: 0.2,
            VideoStatus.GENERATING_EMBEDDING: 0.3,
            VideoStatus.SELECTING_CLIPS: 0.5,
            VideoStatus.GENERATING_AUDIO: 0.7,
            VideoStatus.ASSEMBLING_VIDEO: 0.9,
            VideoStatus.COMPLETED: 1.0,
            VideoStatus.FAILED: 0.0
        }
        return status_progress.get(self.status, 0.0)

    # ============= BUSINESS METHODS =============

    def update_status(self, new_status: VideoStatus, error_message: Optional[str] = None) -> None:
        """Actualiza el estado del video."""
        self.status = new_status
        self.updated_at = datetime.utcnow()

        if error_message:
            self.error_message = error_message

        if new_status == VideoStatus.COMPLETED:
            self.completed_at = datetime.utcnow()

    def add_clip(self, clip: SelectedClip) -> None:
        """Agrega un clip seleccionado al video."""
        # Verificar que no existe ya
        existing = next(
            (c for c in self.clips_used if c.clip_id == clip.clip_id), None)
        if not existing:
            self.clips_used.append(clip)
            # Recalcular posiciones
            self.clips_used.sort(key=lambda c: c.start_time)
            for i, c in enumerate(self.clips_used):
                c.position_in_video = i

    def set_enhanced_script(self, enhanced_script: str, embedding: Optional[List[float]] = None) -> None:
        """Establece el script mejorado y opcionalmente su embedding."""
        self.script_enhanced = enhanced_script
        if embedding:
            self.script_embedding = embedding
        self.updated_at = datetime.utcnow()

    def set_content_urls(self, video_url: str, thumbnail_url: str, audio_url: str) -> None:
        """Establece las URLs del contenido generado."""
        self.video_url = video_url
        self.thumbnail_url = thumbnail_url
        self.audio_url = audio_url
        self.updated_at = datetime.utcnow()

    def calculate_quality_score(self) -> int:
        """Calcula un score de calidad basado en métricas disponibles."""
        score = 50  # Base score

        # Script quality
        if self.has_enhanced_script:
            score += 20

        # Clip relevance
        if self.clips_used:
            avg_relevance = self.average_clip_relevance
            score += int(avg_relevance * 20)

        # Duration accuracy
        if self.actual_duration and self.target_duration:
            duration_accuracy = 1 - \
                abs(self.actual_duration - self.target_duration) / \
                self.target_duration
            score += int(duration_accuracy * 10)

        self.quality_score = max(0, min(100, score))
        return self.quality_score

    def get_summary(self) -> Dict[str, Any]:
        """Retorna un resumen del video para APIs."""
        return {
            "id": self.id,
            "title": self.title,
            "status": self.status.value,
            "progress": self.processing_progress,
            "duration": {
                "target": self.target_duration,
                "actual": self.actual_duration
            },
            "script_preview": self.script_original[:100] + "..." if len(self.script_original) > 100 else self.script_original,
            "clips_count": len(self.clips_used),
            "quality_score": self.quality_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }
