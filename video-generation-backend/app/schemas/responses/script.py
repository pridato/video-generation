"""
Script response schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..base import BaseResponse, PaginatedResponse, TonoEnum, CategoriaEnum, TipoSegmentoEnum


class SegmentResponse(BaseModel):
    """Respuesta de un segmento del script."""

    text: str = Field(..., description="Texto del segmento")
    duration: int = Field(..., description="Duración estimada en segundos")
    type: TipoSegmentoEnum = Field(..., description="Tipo de segmento")
    position: int = Field(..., description="Posición en el script")


class ScriptResponse(BaseModel):
    """Respuesta básica de un script."""

    id: str = Field(..., description="ID único del script")
    original_script: str = Field(..., description="Texto original")
    enhanced_script: Optional[str] = Field(None, description="Texto mejorado por IA")
    original_length: int = Field(..., description="Longitud del texto original")
    enhanced_length: int = Field(..., description="Longitud del texto mejorado")
    estimated_duration: float = Field(..., description="Duración estimada en segundos")
    target_duration: int = Field(..., description="Duración objetivo")
    tone: TonoEnum = Field(..., description="Tono aplicado")
    category: CategoriaEnum = Field(..., description="Categoría del contenido")
    target_audience: str = Field(..., description="Audiencia objetivo")
    keywords: List[str] = Field(default=[], description="Palabras clave extraídas")
    created_at: datetime = Field(..., description="Fecha de creación")
    updated_at: Optional[datetime] = Field(None, description="Fecha de última actualización")


class ScriptEnhanceResponse(BaseResponse):
    """Respuesta completa de mejora de script."""

    data: dict = Field(..., description="Datos del script mejorado")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Script mejorado exitosamente",
                "timestamp": "2024-01-01T12:00:00Z",
                "data": {
                    "script_id": "uuid-here",
                    "original_script": "Script original...",
                    "enhanced_script": "Script mejorado...",
                    "original_length": 150,
                    "enhanced_length": 200,
                    "estimated_duration": 45.5,
                    "target_duration": 45,
                    "segments": [
                        {
                            "text": "Hook impactante...",
                            "duration": 8,
                            "type": "hook",
                            "position": 0
                        }
                    ],
                    "keywords": ["keyword1", "keyword2"],
                    "tone": "viral",
                    "category": "tech",
                    "improvements": ["Mejora 1", "Mejora 2"],
                    "quality_score": 85,
                    "suggestions": ["Sugerencia 1"],
                    "created_at": "2024-01-01T12:00:00Z"
                }
            }
        }


class ScriptListResponse(PaginatedResponse):
    """Respuesta de lista de scripts."""

    items: List[ScriptResponse] = Field(default=[], description="Lista de scripts")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "id": "script-1",
                        "original_script": "Mi script...",
                        "enhanced_script": "Mi script mejorado...",
                        "original_length": 100,
                        "enhanced_length": 150,
                        "estimated_duration": 30.0,
                        "target_duration": 30,
                        "tone": "casual",
                        "category": "education",
                        "target_audience": "estudiantes",
                        "keywords": ["educación", "aprendizaje"],
                        "created_at": "2024-01-01T12:00:00Z"
                    }
                ],
                "total_count": 25,
                "page": 1,
                "page_size": 10,
                "has_more": True
            }
        }


class ScriptDetailResponse(BaseResponse):
    """Respuesta detallada de un script específico."""

    data: dict = Field(..., description="Datos detallados del script")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "script_id": "uuid-here",
                    "original_script": "Script original completo...",
                    "enhanced_script": "Script mejorado completo...",
                    "segments": [
                        {
                            "text": "Hook: Descubre el secreto...",
                            "duration": 10,
                            "type": "hook",
                            "position": 0
                        },
                        {
                            "text": "Contenido principal...",
                            "duration": 35,
                            "type": "contenido",
                            "position": 1
                        },
                        {
                            "text": "¡Suscríbete para más!",
                            "duration": 5,
                            "type": "cta",
                            "position": 2
                        }
                    ],
                    "quality_metrics": {
                        "longitud_adecuada": True,
                        "duracion_objetivo": True,
                        "score_calidad": 90
                    },
                    "suggestions": ["Añadir más emoción al hook"],
                    "created_at": "2024-01-01T12:00:00Z"
                }
            }
        }


class ScriptStatsResponse(BaseResponse):
    """Respuesta de estadísticas de scripts del usuario."""

    data: Dict[str, Any] = Field(..., description="Estadísticas de scripts")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "total_scripts": 15,
                    "scripts_this_month": 5,
                    "avg_quality_score": 82.5,
                    "top_categories": ["tech", "education", "lifestyle"],
                    "top_tones": ["casual", "profesional", "viral"],
                    "total_duration_generated": 750.5,
                    "avg_script_length": 180
                }
            }
        }


class ScriptAnalyticsResponse(BaseResponse):
    """Respuesta de analytics de un script específico."""

    data: Dict[str, Any] = Field(..., description="Analytics del script")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "script_id": "uuid-here",
                    "performance_metrics": {
                        "readability_score": 85,
                        "engagement_potential": 92,
                        "seo_score": 78
                    },
                    "content_analysis": {
                        "sentiment": "positive",
                        "emotion_distribution": {
                            "excitement": 40,
                            "curiosity": 35,
                            "trust": 25
                        },
                        "complexity_level": "intermediate"
                    },
                    "optimization_suggestions": [
                        "Reducir complejidad en el primer párrafo",
                        "Añadir call-to-action más claro"
                    ]
                }
            }
        }