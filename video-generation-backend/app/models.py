from pydantic import BaseModel, Field, validator
from typing import List, Literal, Optional
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


class SegmentTypeEnum(str, Enum):
    intro = "intro"
    content = "content"
    conclusion = "conclusion"
    transition = "transition"
    emphasis = "emphasis"
    question = "question"


class EmotionEnum(str, Enum):
    neutral = "neutral"
    excited = "excited"
    serious = "serious"
    friendly = "friendly"
    mysterious = "mysterious"
    dramatic = "dramatic"


# Enum de voces disponibles
class VoiceEnum(str, Enum):
    alloy = "alloy"
    echo = "echo"
    fable = "fable"
    onyx = "onyx"
    nova = "nova"
    shimmer = "shimmer"

# Modelo para cada segmento de script mejorado


class SegmentInput(BaseModel):
    texto: str = Field(..., description="Texto del segmento")
    tipo: str = Field(...,
                      description="Tipo de segmento: hook, content, cta, etc.")
    emocion: Optional[str] = Field(
        "neutral", description="Emoción del segmento")
    duracion: Optional[float] = Field(
        1.0, ge=0, description="Duración estimada del segmento en segundos")
    velocidad: Optional[float] = Field(
        1.0, ge=0.25, le=4.0, description="Velocidad de la voz")
    pausa_despues: Optional[float] = Field(
        0.5, ge=0, description="Pausa después del segmento en segundos")

# Modelo para el script mejorado


class EnhancedScript(BaseModel):
    segmentos: List[SegmentInput] = Field(
        ..., description="Lista de segmentos del script mejorado")

# Modelo principal para la generación de audio


class AudioGenerationRequest(BaseModel):
    script: str = Field(..., min_length=10, max_length=5000,
                        description="Script del video")
    voice_id: VoiceEnum = Field(..., description="ID de la voz a usar")
    video_id: str = Field(..., description="ID del video en la base de datos")
    enhanced_script: Optional[EnhancedScript] = Field(
        None, description="Script mejorado opcional")


class VoicePreviewRequest(BaseModel):
    voice_id: VoiceEnum = Field(..., description="ID de la voz")
    text: Optional[str] = Field(
        None, max_length=500, description="Texto personalizado para el preview")
    category: Optional[str] = Field(
        None, description="Categoría para texto automático")


class AudioSegmentResponse(BaseModel):
    text: str = Field(..., description="Texto del segmento")
    type: str = Field(..., description="Tipo del segmento")
    emotion: str = Field(..., description="Emoción del segmento")
    duration: float = Field(..., ge=0,
                            description="Duración del segmento en segundos")
    speed: float = Field(..., ge=0.25, le=4.0,
                         description="Velocidad aplicada")


class AudioGenerationResponse(BaseModel):
    audio_base64: str = Field(..., description="Audio codificado en base64")
    segments: List[AudioSegmentResponse] = Field(
        ..., description="Segmentos procesados")
    filename: str = Field(..., description="Nombre del archivo de audio")
    duration: float = Field(..., ge=0,
                            description="Duración total en segundos")
    voice_id: str = Field(..., description="ID de la voz utilizada")


class VoicePreviewResponse(BaseModel):
    audio_base64: str = Field(...,
                              description="Audio del preview codificado en base64")
    filename: str = Field(..., description="Nombre del archivo de preview")
    duration: float = Field(..., ge=0,
                            description="Duración del preview en segundos")
