from pydantic import BaseModel, Field, validator
from typing import List, Literal
from enum import Enum


class CategoriaEnum(str, Enum):
    tech = "tech"
    marketing = "marketing"
    education = "education"
    entertainment = "entertainment"
    lifestyle = "lifestyle"
    business = "business"
    fitness = "fitness"
    food = "food"
    travel = "travel"
    news = "news"


class TonoEnum(str, Enum):
    educativo = "educativo"
    viral = "viral"
    profesional = "profesional"
    casual = "casual"
    energetico = "energetico"


class TipoSegmentoEnum(str, Enum):
    hook = "hook"
    contenido = "contenido"
    cta = "cta"


class ScriptRequest(BaseModel):
    script: str = Field(..., min_length=10, max_length=2000,
                        description="Script original del usuario")
    categoria: CategoriaEnum = Field(...,
                                     description="Categoría del contenido")

    @validator('script')
    def validar_script(cls, v):
        if not v.strip():
            raise ValueError('El script no puede estar vacío')
        return v.strip()


class Segmento(BaseModel):
    texto: str = Field(..., description="Texto del segmento")
    duracion: int = Field(..., ge=1, le=60,
                          description="Duración estimada en segundos")
    tipo: TipoSegmentoEnum = Field(..., description="Tipo de segmento")


class ScriptResponse(BaseModel):
    script_mejorado: str = Field(..., description="Script mejorado por IA")
    duracion_estimada: int = Field(..., ge=15, le=60,
                                   description="Duración total estimada en segundos")
    segmentos: List[Segmento] = Field(..., description="Segmentos del script")
    palabras_clave: List[str] = Field(...,
                                      description="Palabras clave para SEO")
    tono: TonoEnum = Field(..., description="Tono detectado/aplicado")
    mejoras_aplicadas: List[str] = Field(...,
                                         description="Lista de mejoras aplicadas")


class HealthResponse(BaseModel):
    status: str = Field(default="healthy")
    version: str = Field(default="1.0.0")
    openai_configured: bool = Field(...,
                                    description="Si OpenAI está configurado correctamente")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Mensaje de error")
    detail: str = Field(
        default="", description="Detalles adicionales del error")
    code: int = Field(..., description="Código de error HTTP")
