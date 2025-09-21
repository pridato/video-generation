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
    embedding: Optional[List[float]] = Field(None,
                                           description="Embedding del script (768 dimensiones, all-mpnet-base-v2)")


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


# =================================
# MODELOS PARA SELECCIÓN DE CLIPS
# =================================

class ClipSelectionRequest(BaseModel):
    enhanced_script: dict = Field(..., description="Script mejorado con segmentos")
    categoria: CategoriaEnum = Field(..., description="Categoría del contenido")
    audio_duration: float = Field(..., ge=0, description="Duración real del audio en segundos")
    target_clips_count: Optional[int] = Field(3, ge=1, le=20, description="Número objetivo de clips")


class SelectedClipInfo(BaseModel):
    clip_id: str = Field(..., description="ID único del clip")
    filename: str = Field(..., description="Nombre del archivo del clip")
    file_url: str = Field(..., description="URL del archivo del clip")
    duration: float = Field(..., description="Duración del clip en segundos")
    segment_text: str = Field(..., description="Texto del segmento asociado")
    segment_type: str = Field(..., description="Tipo de segmento (hook, contenido, cta)")
    similarity_score: float = Field(..., ge=0, le=1, description="Puntuación de similitud semántica")
    segment_score: float = Field(..., ge=0, le=1, description="Puntuación específica del segmento")
    final_score: float = Field(..., ge=0, le=1, description="Puntuación final combinada")
    duration_compatibility: float = Field(..., ge=0, le=1, description="Compatibilidad de duración")

    # Metadatos adicionales del clip
    quality_score: float = Field(..., description="Puntuación de calidad del clip")
    motion_intensity: str = Field(..., description="Intensidad de movimiento del clip")
    concept_tags: List[str] = Field(default=[], description="Etiquetas conceptuales del clip")
    emotion_tags: List[str] = Field(default=[], description="Etiquetas emocionales del clip")
    dominant_colors: List[str] = Field(default=[], description="Colores dominantes del clip")


class ClipSelectionResponse(BaseModel):
    success: bool = Field(..., description="Indica si la selección fue exitosa")
    selected_clips: List[SelectedClipInfo] = Field(..., description="Lista de clips seleccionados")

    # Métricas de la selección
    total_clips_duration: float = Field(..., description="Duración total de los clips seleccionados")
    audio_duration: float = Field(..., description="Duración del audio")
    duration_compatibility: float = Field(..., ge=0, le=1, description="Compatibilidad temporal general")
    visual_coherence_score: float = Field(..., ge=0, le=1, description="Puntuación de coherencia visual")
    estimated_engagement: float = Field(..., ge=0, le=1, description="Engagement estimado")

    # Información adicional
    warnings: List[str] = Field(default=[], description="Advertencias sobre la selección")
    processing_time_ms: float = Field(..., description="Tiempo de procesamiento en milisegundos")

    # Estadísticas por categoría
    clips_by_category: dict = Field(default={}, description="Distribución de clips por categoría")
    average_similarity: float = Field(..., description="Similitud semántica promedio")
    average_quality: float = Field(..., description="Calidad promedio de clips")


class ClipSearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500, description="Texto de búsqueda")
    categoria: CategoriaEnum = Field(..., description="Categoría para filtrar clips")
    max_results: Optional[int] = Field(10, ge=1, le=50, description="Número máximo de resultados")
    min_similarity: Optional[float] = Field(0.3, ge=0, le=1, description="Similitud mínima requerida")
    min_quality: Optional[float] = Field(3.0, ge=0, le=5, description="Calidad mínima requerida")


class ClipSearchResult(BaseModel):
    clip_id: str = Field(..., description="ID único del clip")
    filename: str = Field(..., description="Nombre del archivo")
    file_url: str = Field(..., description="URL del archivo")
    similarity_score: float = Field(..., description="Puntuación de similitud")
    quality_score: float = Field(..., description="Puntuación de calidad")
    duration: float = Field(..., description="Duración en segundos")
    description: str = Field(..., description="Descripción del clip")
    concept_tags: List[str] = Field(default=[], description="Etiquetas conceptuales")
    keywords: List[str] = Field(default=[], description="Palabras clave")


class ClipSearchResponse(BaseModel):
    success: bool = Field(..., description="Indica si la búsqueda fue exitosa")
    results: List[ClipSearchResult] = Field(..., description="Resultados de la búsqueda")
    total_found: int = Field(..., description="Total de clips encontrados")
    query_embedding_generated: bool = Field(..., description="Si se generó embedding para la consulta")
    processing_time_ms: float = Field(..., description="Tiempo de procesamiento")
