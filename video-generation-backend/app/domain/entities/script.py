"""
Domain entities for script management
"""
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum
from datetime import datetime


# --------------------------------------------------------------
#                  Tipos Auxiliares para Script
# --------------------------------------------------------------

class SegmentType(str, Enum):
    HOOK = "hook"
    CONTENIDO = "contenido"
    CTA = "cta"


class Tone(str, Enum):
    EDUCATIVO = "educativo"
    VIRAL = "viral"
    PROFESIONAL = "profesional"
    CASUAL = "casual"
    ENERGETICO = "energetico"


class Category(str, Enum):
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


@dataclass
class ScriptSegment:
    """Representa un segmento de un script."""
    text: str
    duration: int  # segundos
    type: SegmentType
    position: int  # orden en el script


# --------------------------------------------------------------
#                  Entidad Principal: Script
# --------------------------------------------------------------


@dataclass
class Script:
    """Entidad que representa un script de video."""
    id: Optional[str]
    original_text: str
    enhanced_text: Optional[str]
    target_duration: int  # segundos
    tone: Tone
    target_audience: str
    category: Category
    segments: List[ScriptSegment]
    keywords: List[str]
    applied_improvements: List[str]
    embedding: Optional[List[float]]  # 768 dimensiones
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    @property
    def original_length(self) -> int:
        """
        Retorna la longitud del texto original.

        Returns:
            int: Longitud del texto original.
        """
        return len(self.original_text)

    @property
    def improved_length(self) -> int:
        """
        Retorna la longitud del texto mejorado.

        Returns:
            int: Longitud del texto mejorado.
        """
        return len(self.enhanced_text) if self.enhanced_text else 0

    @property
    def estimated_duration(self) -> float:
        """
        Calcula la duración estimada basada en 2 palabras por segundo.

        Returns:
            float: Duración estimada en segundos.
        """
        if not self.enhanced_text:
            return 0.0

        palabras = len(self.enhanced_text.split())
        return palabras / 2.0  # 2 palabras por segundo

    @property
    def total_segments_duration(self) -> int:
        """
        Calcula la duración total de todos los segmentos.

        Returns:
            int: Duración total en segundos.
        """
        return sum(segmento.duration for segmento in self.segments)

    def add_segment(self, segmento: ScriptSegment) -> None:
        """
        Agrega un segmento al script.

        Args:
            segmento (ScriptSegment): El segmento a agregar.
        """
        segmento.position = len(self.segments)
        self.segments.append(segmento)

    def is_valid(self) -> bool:
        """
        Verifica si el script es válido.

        Returns:
            bool: True si el script es válido, False en caso contrario.
        """
        return (
            bool(self.original_text.strip()) and
            10 <= len(self.original_text) <= 2000 and
            15 <= self.target_duration <= 60 and
            bool(self.user_id)
        )

    def achieves_target_duration(self, tolerancia: int = 5) -> bool:
        """
        Verifica si la duración estimada está dentro del objetivo.

        Args:
            tolerancia (int): Tolerancia en segundos para considerar que se cumple el objetivo. Por defecto es 5 segundos.

        Returns:
            bool: True si la duración estimada está dentro del objetivo, False en caso contrario.
        """
        duracion = self.estimated_duration
        return abs(duracion - self.target_duration) <= tolerancia
