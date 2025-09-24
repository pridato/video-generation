"""
Domain entities for video management
"""
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class EstadoVideo(str, Enum):
    PENDIENTE = "pendiente"
    PROCESANDO = "procesando"
    COMPLETADO = "completado"
    FALLIDO = "fallido"
    CANCELADO = "cancelado"


class TipoVoz(str, Enum):
    ALLOY = "alloy"
    ECHO = "echo"
    FABLE = "fable"
    ONYX = "onyx"
    NOVA = "nova"
    SHIMMER = "shimmer"


class CalidadVideo(str, Enum):
    SD = "sd"      # 480p
    HD = "hd"      # 720p
    FHD = "fhd"    # 1080p


@dataclass
class AudioConfig:
    """Configuración de audio para el video."""
    voz: TipoVoz
    velocidad: float  # 0.5 - 2.0
    volumen: float    # 0.0 - 1.0
    incluir_musica_fondo: bool
    url_audio_generado: Optional[str] = None


@dataclass
class ClipSeleccionado:
    """Representa un clip seleccionado para el video."""
    id: str
    url: str
    duracion: float
    posicion_inicio: float  # tiempo en segundos donde inicia en el video
    posicion_fin: float     # tiempo en segundos donde termina en el video
    relevancia_score: float
    metadatos: Dict[str, Any]


@dataclass
class TemplateVideo:
    """Configuración del template del video."""
    id: str
    nombre: str
    es_premium: bool
    configuracion: Dict[str, Any]  # Configuración específica del template


@dataclass
class Video:
    """Entidad que representa un video generado."""
    id: str
    usuario_id: str
    script_id: str
    titulo: str
    descripcion: Optional[str]
    template: TemplateVideo
    audio_config: AudioConfig
    clips_seleccionados: List[ClipSeleccionado]
    calidad: CalidadVideo
    duracion_objetivo: int  # segundos
    duracion_final: Optional[float]  # duración real del video generado
    estado: EstadoVideo
    url_video_final: Optional[str]
    url_thumbnail: Optional[str]
    metadatos: Dict[str, Any]  # Metadatos adicionales
    estadisticas: Dict[str, Any]  # Stats de procesamiento
    error_mensaje: Optional[str]
    created_at: datetime
    procesado_at: Optional[datetime]

    @property
    def esta_completado(self) -> bool:
        """Verifica si el video está completado."""
        return self.estado == EstadoVideo.COMPLETADO and bool(self.url_video_final)

    @property
    def esta_procesando(self) -> bool:
        """Verifica si el video está en proceso."""
        return self.estado == EstadoVideo.PROCESANDO

    @property
    def ha_fallado(self) -> bool:
        """Verifica si el procesamiento ha fallado."""
        return self.estado == EstadoVideo.FALLIDO

    @property
    def duracion_total_clips(self) -> float:
        """Calcula la duración total de clips seleccionados."""
        return sum(
            clip.posicion_fin - clip.posicion_inicio
            for clip in self.clips_seleccionados
        )

    @property
    def numero_clips(self) -> int:
        """Retorna el número de clips seleccionados."""
        return len(self.clips_seleccionados)

    def marcar_como_procesando(self) -> None:
        """Marca el video como en procesamiento."""
        self.estado = EstadoVideo.PROCESANDO

    def marcar_como_completado(self, url_video: str, duracion: float) -> None:
        """Marca el video como completado."""
        self.estado = EstadoVideo.COMPLETADO
        self.url_video_final = url_video
        self.duracion_final = duracion
        self.procesado_at = datetime.utcnow()

    def marcar_como_fallido(self, error: str) -> None:
        """Marca el video como fallido."""
        self.estado = EstadoVideo.FALLIDO
        self.error_mensaje = error

    def agregar_clip(self, clip: ClipSeleccionado) -> None:
        """Agrega un clip al video."""
        self.clips_seleccionados.append(clip)

    def actualizar_estadisticas(self, stats: Dict[str, Any]) -> None:
        """Actualiza las estadísticas de procesamiento."""
        self.estadisticas.update(stats)

    def es_valido_para_procesamiento(self) -> bool:
        """Verifica si el video puede ser procesado."""
        return (
            self.estado == EstadoVideo.PENDIENTE and
            bool(self.script_id) and
            bool(self.clips_seleccionados) and
            bool(self.template.id)
        )