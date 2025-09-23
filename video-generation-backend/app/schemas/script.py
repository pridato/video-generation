"""
Script enhancement schemas
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from app.schemas.common import CategoriaEnum, TonoEnum, TipoSegmentoEnum


class ScriptRequest(BaseModel):
    script: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Original user script"
    )
    target_duration: Optional[int] = Field(
        default=30,
        ge=15,
        le=60,
        description="Target duration in seconds"
    )
    tone: Optional[str] = Field(
        default="casual",
        description="Desired tone for the script"
    )
    target_audience: Optional[str] = Field(
        default="general",
        description="Target audience"
    )
    category: Optional[CategoriaEnum] = Field(
        default=CategoriaEnum.education,
        description="Content category"
    )

    @validator('script')
    def validate_script(cls, v):
        if not v.strip():
            raise ValueError('Script cannot be empty')
        return v.strip()


class Segmento(BaseModel):
    texto: str = Field(..., description="Segment text")
    duracion: int = Field(
        ...,
        ge=1,
        le=60,
        description="Estimated duration in seconds"
    )
    tipo: TipoSegmentoEnum = Field(..., description="Segment type")


class ScriptResponse(BaseModel):
    enhanced_script: str = Field(..., description="AI-enhanced script")
    original_length: int = Field(..., description="Original script character count")
    enhanced_length: int = Field(..., description="Enhanced script character count")
    estimated_duration: float = Field(
        ...,
        ge=0,
        description="Estimated duration in seconds"
    )
    segments: Optional[List[Segmento]] = Field(
        default=[],
        description="Script segments"
    )
    keywords: Optional[List[str]] = Field(
        default=[],
        description="SEO keywords"
    )
    tone: Optional[TonoEnum] = Field(
        default=None,
        description="Applied tone"
    )
    improvements: Optional[List[str]] = Field(
        default=[],
        description="List of applied improvements"
    )
    embedding: Optional[List[float]] = Field(
        None,
        description="Script embedding (768 dimensions, all-mpnet-base-v2)"
    )