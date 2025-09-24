"""
Base schemas and common types
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum


class CategoriaEnum(str, Enum):
    """Categorías de contenido disponibles."""
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


class TonoEnum(str, Enum):
    """Tonos disponibles para scripts."""
    EDUCATIVO = "educativo"
    VIRAL = "viral"
    PROFESIONAL = "profesional"
    CASUAL = "casual"
    ENERGETICO = "energetico"


class TipoSegmentoEnum(str, Enum):
    """Tipos de segmento en scripts."""
    HOOK = "hook"
    CONTENIDO = "contenido"
    CTA = "cta"


class VozEnum(str, Enum):
    """Voces disponibles para TTS."""
    ALLOY = "alloy"
    ECHO = "echo"
    FABLE = "fable"
    ONYX = "onyx"
    NOVA = "nova"
    SHIMMER = "shimmer"


class CalidadVideoEnum(str, Enum):
    """Calidades de video disponibles."""
    SD = "sd"      # 480p
    HD = "hd"      # 720p
    FHD = "fhd"    # 1080p


class BaseResponse(BaseModel):
    """Base response model."""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Error response model."""
    success: bool = False
    error: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PaginatedResponse(BaseModel):
    """Paginated response base."""
    items: List[Any] = []
    total_count: int = 0
    page: int = 1
    page_size: int = 10
    has_more: bool = False

    @property
    def total_pages(self) -> int:
        return (self.total_count + self.page_size - 1) // self.page_size


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    services: Dict[str, str] = {}


class ValidationError(BaseModel):
    """Validation error detail."""
    field: str
    message: str
    code: Optional[str] = None