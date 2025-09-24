"""
Entidad de dominio para la gestión de videos.
"""
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

# --------------------------------------------------------------
#                  Tipos Auxiliares para Video
# --------------------------------------------------------------


class VideoStatus(str, Enum):
    """
    Estado del procesamiento del video.
    """
    PENDING = "pendiente"
    PROCESSING = "procesando"
    COMPLETED = "completado"
    FAILED = "fallido"
    CANCELED = "cancelado"


class VoiceType(str, Enum):
    """
    Tipos de voz disponibles para la generación de audio.
    """
    ALLOY = "alloy"
    ECHO = "echo"
    FABLE = "fable"
    ONYX = "onyx"
    NOVA = "nova"
    SHIMMER = "shimmer"


class VideoQuality(str, Enum):
    """
    Calidad del video generado.
    """
    SD = "sd"      # 480p
    HD = "hd"      # 720p
    FHD = "fhd"    # 1080p


@dataclass
class AudioConfig:
    """
    Configuración de audio para el video.
    """
    voice: VoiceType
    speed: float  # 0.5x a 2x
    volume: float    # 0.0 - 1.0
    include_background_music: bool
    url_generated_audio: Optional[str] = None


@dataclass
class SelectedClip:
    """
    Representa un clip seleccionado para el video.
    """
    id: str
    url: str
    duration: float
    initial_position: float  # tiempo en segundos donde inicia en el video
    latest_position: float     # tiempo en segundos donde termina en el video
    relevance_score: float
    metadata: Dict[str, Any]


@dataclass
class TemplateVideo:
    """Configuración del template del video."""
    id: str
    name: str
    is_premium: bool
    configuration: Dict[str, Any]


@dataclass
class Video:
    """
    Entidad que representa un video generado.
    """
    id: str
    user_id: str
    script: str
    title: str
    description: Optional[str]
    template: TemplateVideo
    audio_config: AudioConfig
    selected_clips: List[SelectedClip]
    quality: VideoQuality
    target_duration: int  # segundos
    final_duration: Optional[float]  # duración real del video generado
    state: VideoStatus
    url_final_video: Optional[str]
    url_thumbnail: Optional[str]
    metadata: Dict[str, Any]  # Metadatos adicionales
    stadistics: Dict[str, Any]  # Stats de procesamiento
    error_message: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]

    @property
    def is_completed(self) -> bool:
        """
        Verifica si el video está completado.

        Returns:
            bool: True si el video está en estado COMPLETED y tiene una URL final, False en caso contrario.
        """
        return self.state == VideoStatus.COMPLETED and bool(self.url_final_video)

    @property
    def is_processing(self) -> bool:
        """
        Verifica si el video está en proceso.

        Returns:
            bool: True si el video está en estado PROCESSING, False en caso contrario.
        """
        return self.state == VideoStatus.PROCESSING

    @property
    def has_failed(self) -> bool:
        """
        Verifica si el procesamiento ha fallado.

        Returns:
            bool: True si el video está en estado FAILED, False en caso contrario.
        """
        return self.state == VideoStatus.FAILED

    @property
    def total_duration_clips(self) -> float:
        """
        Calcula la duración total de clips seleccionados.

        Returns:
            float: Duración total en segundos.
        """
        return sum(
            clip.latest_position - clip.initial_position
            for clip in self.selected_clips
        )

    @property
    def number_clips(self) -> int:
        """
        Retorna el número de clips seleccionados.

        Returns:
            int: Número de clips seleccionados.
        """
        return len(self.selected_clips)

    def mark_as_processing(self) -> None:
        """
        Marca el video como en procesamiento.
        """
        self.state = VideoStatus.PROCESSING

    def mark_as_completed(self, url_video: str, duration: float) -> None:
        """
        Marca el video como completado.

        Args:
            url_video (str): URL del video generado.
            duration (float): Duración final del video en segundos.
        """
        self.state = VideoStatus.COMPLETED
        self.url_final_video = url_video
        self.final_duration = duration
        self.processed_at = datetime.utcnow()

    def mark_as_failed(self, error: str) -> None:
        """
        Marca el video como fallido.

        Args:
            error (str): Mensaje de error.
        """
        self.state = VideoStatus.FAILED
        self.error_message = error

    def add_clip(self, clip: SelectedClip) -> None:
        """
        Agrega un clip al video.

        Args:
            clip (SelectedClip): Clip a agregar.
        """
        self.selected_clips.append(clip)

    def update_stadistics(self, stats: Dict[str, Any]) -> None:
        """
        Actualiza las estadísticas de procesamiento.

        Args:
            stats (Dict[str, Any]): Estadísticas a actualizar.
        """
        self.stadistics.update(stats)

    def is_valid_to_processing(self) -> bool:
        """
        Verifica si el video puede ser procesado.

        Returns:
            bool: True si el video está en estado PENDING y tiene los datos necesarios, False
        """
        return (
            self.state == VideoStatus.PENDING and
            bool(self.script) and
            bool(self.selected_clips) and
            bool(self.template.id)
        )
