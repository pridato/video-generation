"""
Domain entities for script management
"""
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum
from datetime import datetime


class TipoSegmento(str, Enum):
    HOOK = "hook"
    CONTENIDO = "contenido"
    CTA = "cta"


class Tono(str, Enum):
    EDUCATIVO = "educativo"
    VIRAL = "viral"
    PROFESIONAL = "profesional"
    CASUAL = "casual"
    ENERGETICO = "energetico"


class Categoria(str, Enum):
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
class SegmentoScript:
    """Representa un segmento de un script."""
    texto: str
    duracion: int  # segundos
    tipo: TipoSegmento
    posicion: int  # orden en el script


@dataclass
class Script:
    """Entidad que representa un script de video."""
    id: Optional[str]
    texto_original: str
    texto_mejorado: Optional[str]
    duracion_objetivo: int  # segundos
    tono: Tono
    audiencia_objetivo: str
    categoria: Categoria
    segmentos: List[SegmentoScript]
    palabras_clave: List[str]
    mejoras_aplicadas: List[str]
    embedding: Optional[List[float]]  # 768 dimensiones
    usuario_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    @property
    def longitud_original(self) -> int:
        """Retorna la longitud del texto original."""
        return len(self.texto_original)

    @property
    def longitud_mejorada(self) -> int:
        """Retorna la longitud del texto mejorado."""
        return len(self.texto_mejorado) if self.texto_mejorado else 0

    @property
    def duracion_estimada(self) -> float:
        """Calcula la duración estimada basada en 2 palabras por segundo."""
        if not self.texto_mejorado:
            return 0.0

        palabras = len(self.texto_mejorado.split())
        return palabras / 2.0  # 2 palabras por segundo

    @property
    def duracion_total_segmentos(self) -> int:
        """Calcula la duración total de todos los segmentos."""
        return sum(segmento.duracion for segmento in self.segmentos)

    def agregar_segmento(self, segmento: SegmentoScript) -> None:
        """Agrega un segmento al script."""
        segmento.posicion = len(self.segmentos)
        self.segmentos.append(segmento)

    def es_valido(self) -> bool:
        """Verifica si el script es válido."""
        return (
            bool(self.texto_original.strip()) and
            10 <= len(self.texto_original) <= 2000 and
            15 <= self.duracion_objetivo <= 60 and
            bool(self.usuario_id)
        )

    def cumple_duracion_objetivo(self, tolerancia: int = 5) -> bool:
        """Verifica si la duración estimada está dentro del objetivo."""
        duracion = self.duracion_estimada
        return abs(duracion - self.duracion_objetivo) <= tolerancia