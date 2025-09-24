"""
Entidades de dominio para gestión de clips de video.
"""
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# --------------------------------------------------------------
#                  Tipos Auxiliares para Clips
# --------------------------------------------------------------

class MotionIntensity(str, Enum):
    """Intensidad de movimiento en el clip."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SceneType(str, Enum):
    """Tipo de escena del clip."""
    CLOSE_UP = "close-up"
    MEDIUM = "medium"
    WIDE = "wide"
    MACRO = "macro"
    AERIAL = "aerial"
    POV = "pov"


class ProcessingStatus(str, Enum):
    """Estado de procesamiento del clip."""
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class VideoOrientation(str, Enum):
    """Orientación del video."""
    LANDSCAPE = "landscape"
    PORTRAIT = "portrait"
    SQUARE = "square"


# --------------------------------------------------------------
#                  Entidad Principal: AssetClip
# --------------------------------------------------------------

@dataclass
class AssetClip:
    """
    Entidad que representa un clip disponible en la biblioteca del sistema.
    """
    id: str
    filename: str
    file_url: str
    file_size: int  # bytes
    duration: float  # segundos
    resolution: str  # "1920x1080"
    format: str  # "mp4"

    # Categorización semántica (crítico para IA matching)
    concept_tags: List[str]  # ["coding", "keyboard", "typing"]
    emotion_tags: List[str]  # ["productive", "focused", "energetic"]
    scene_type: SceneType
    dominant_colors: List[str]  # ["#1E1E1E", "#00D9FF"]

    # Descripción e información
    description: Optional[str]
    keywords: List[str]
    embedding: Optional[List[float]]  # Vector de 384 dimensiones

    # Métricas de calidad y rendimiento
    quality_score: float  # 1-10
    motion_intensity: MotionIntensity
    audio_present: bool
    usage_count: int  # Cuántas veces se ha usado
    success_rate: float  # % de videos exitosos que lo usan (0-1)
    avg_relevance_score: float  # Promedio de relevance scores (0-1)

    # Compatibilidad para matching IA
    compatible_emotions: List[str]
    compatible_topics: List[str]
    best_for_segments: List[str]  # ["hook", "body", "cta"]

    # Metadatos técnicos
    fps: int
    bitrate: Optional[int]  # kbps
    codec: Optional[str]  # h264, h265
    has_transparency: bool
    orientation: VideoOrientation

    # Estado y organización
    processing_status: ProcessingStatus
    is_active: bool
    is_premium: bool
    category: Optional[str]  # coding, lifestyle, business
    subcategory: Optional[str]
    collection_name: Optional[str]

    # Información de origen
    source_url: Optional[str]
    license_type: str  # royalty_free, creative_commons, etc.
    credits_required: Optional[str]  # Créditos al autor

    # Análisis automático
    visual_analysis: Dict[str, Any]  # Resultado de análisis CV
    movement_analysis: Dict[str, Any]  # Análisis de movimiento

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]
    last_used_at: Optional[datetime]

    @property
    def is_high_quality(self) -> bool:
        """Verifica si es un clip de alta calidad."""
        return self.quality_score >= 7.0

    @property
    def is_popular(self) -> bool:
        """Verifica si es un clip popular."""
        return self.usage_count > 100 and self.success_rate > 0.7

    @property
    def duration_category(self) -> str:
        """Categoriza por duración."""
        if self.duration <= 5:
            return "short"
        elif self.duration <= 15:
            return "medium"
        else:
            return "long"

    @property
    def aspect_ratio(self) -> float:
        """Calcula el aspect ratio."""
        if "x" in self.resolution:
            width, height = self.resolution.split("x")
            return float(width) / float(height)
        return 16/9  # Default

    @property
    def file_size_mb(self) -> float:
        """Tamaño del archivo en MB."""
        return self.file_size / (1024 * 1024)

    def is_suitable_for_segment(self, segment_type: str) -> bool:
        """Verifica si es adecuado para un tipo de segmento."""
        return segment_type in self.best_for_segments

    def matches_emotion(self, target_emotion: str) -> bool:
        """Verifica si coincide con una emoción objetivo."""
        return target_emotion.lower() in [e.lower() for e in self.emotion_tags]

    def calculate_relevance_for_script(self, script_embedding: List[float]) -> float:
        """Calcula la relevancia para un script usando embeddings."""
        if not self.embedding or not script_embedding:
            return 0.0

        # Similitud coseno simplificada
        dot_product = sum(
            a * b for a, b in zip(self.embedding, script_embedding))
        magnitude_a = sum(a * a for a in self.embedding) ** 0.5
        magnitude_b = sum(b * b for b in script_embedding) ** 0.5

        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0

        return dot_product / (magnitude_a * magnitude_b)

    def update_usage_stats(self, success: bool, relevance_score: float) -> None:
        """Actualiza estadísticas de uso."""
        self.usage_count += 1
        self.last_used_at = datetime.utcnow()

        # Actualizar tasa de éxito (promedio móvil simple)
        if self.usage_count == 1:
            self.success_rate = 1.0 if success else 0.0
            self.avg_relevance_score = relevance_score
        else:
            # Promedio móvil con peso del 90% para datos históricos
            weight = 0.9
            self.success_rate = (self.success_rate * weight) + \
                (1.0 if success else 0.0) * (1 - weight)
            self.avg_relevance_score = (
                self.avg_relevance_score * weight) + (relevance_score * (1 - weight))


# --------------------------------------------------------------
#                  Entidad: VideoClip (Uso específico)
# --------------------------------------------------------------

@dataclass
class VideoClip:
    """
    Entidad que representa el uso específico de un clip en un video.
    """
    id: str
    video_id: str
    asset_clip_id: str

    # Configuración en el video final
    order_in_video: int  # 1, 2, 3...
    start_time: float  # Segundo donde empieza en el video final
    end_time: float  # Segundo donde termina en el video final
    duration_used: float  # Duración real usada del clip

    # Selección por IA
    relevance_score: float  # 0-1 score de relevancia
    selection_reason: str  # "hook", "content", "transition", "cta"
    embedding_similarity: Optional[float]  # Similitud con embedding del script

    # Configuración técnica aplicada
    clip_start_time: float  # Desde qué segundo del clip original
    clip_end_time: Optional[float]  # Hasta qué segundo del clip original

    # Transformaciones aplicadas
    transformations: Dict[str, Any]  # {"zoom": 1.2, "fade_in": 0.5}
    filters_applied: Dict[str, Any]  # {"brightness": 1.1, "contrast": 1.05}

    # Análisis de rendimiento
    performance_score: Optional[float]  # Score si está disponible
    user_feedback: Optional[str]  # "like", "dislike", "neutral"

    # Metadatos
    metadata: Dict[str, Any]
    algorithm_version: Optional[str]  # Versión del algoritmo de selección
    created_at: datetime

    @property
    def usage_percentage(self) -> float:
        """Qué porcentaje del clip original se usó."""
        if not self.clip_end_time:
            return 100.0

        clip_duration = self.clip_end_time - self.clip_start_time
        original_duration = self.duration_used  # Asumiendo que se pasa

        if original_duration == 0:
            return 0.0

        return (clip_duration / original_duration) * 100

    @property
    def is_primary_clip(self) -> bool:
        """Verifica si es un clip principal (larga duración en el video)."""
        return self.duration_used > 10.0  # Más de 10 segundos

    @property
    def is_transition_clip(self) -> bool:
        """Verifica si es un clip de transición."""
        return self.duration_used <= 3.0 and self.selection_reason == "transition"

    def calculate_efficiency_score(self) -> float:
        """Calcula un score de eficiencia del uso del clip."""
        factors = []

        # Factor de relevancia
        factors.append(self.relevance_score)

        # Factor de duración óptima
        optimal_duration = 8.0  # Duración óptima teórica
        duration_factor = 1.0 - \
            abs(self.duration_used - optimal_duration) / optimal_duration
        factors.append(max(0, duration_factor))

        # Factor de posición en el video (clips al principio son más importantes)
        position_factor = 1.0 - (self.order_in_video - 1) * 0.1
        factors.append(max(0.5, position_factor))

        # Promedio de todos los factores
        return sum(factors) / len(factors)


# --------------------------------------------------------------
#                  Entidad: ClipCollection
# --------------------------------------------------------------

@dataclass
class ClipCollection:
    """
    Entidad que representa una colección temática de clips.
    """
    id: str
    name: str
    description: Optional[str]
    category: str

    # Metadatos
    tags: List[str]
    theme_color: str
    icon: Optional[str]

    # Estado
    is_premium: bool
    is_active: bool
    display_order: int

    # Analytics
    usage_count: int
    average_rating: float

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]

    @property
    def is_popular(self) -> bool:
        """Verifica si es una colección popular."""
        return self.usage_count > 50 and self.average_rating > 4.0
