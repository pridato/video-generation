"""
Common schemas and enums used across the application
"""
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


class VoiceEnum(str, Enum):
    alloy = "alloy"
    echo = "echo"
    fable = "fable"
    onyx = "onyx"
    nova = "nova"
    shimmer = "shimmer"