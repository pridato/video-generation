"""
Script request schemas
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from ..base import CategoriaEnum, TonoEnum


class ScriptEnhanceRequest(BaseModel):
    """Request para mejorar un script con IA."""

    script: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Texto original del script a mejorar"
    )
    target_duration: int = Field(
        default=30,
        ge=15,
        le=120,
        description="Duración objetivo en segundos"
    )
    tone: TonoEnum = Field(
        default=TonoEnum.CASUAL,
        description="Tono deseado para el script"
    )
    category: CategoriaEnum = Field(
        default=CategoriaEnum.EDUCATION,
        description="Categoría del contenido"
    )
    target_audience: str = Field(
        default="general",
        min_length=1,
        max_length=100,
        description="Audiencia objetivo"
    )

    @field_validator('script')
    @classmethod
    def validate_script(cls, v: str) -> str:
        """Valida y limpia el script."""
        cleaned = v.strip()
        if not cleaned:
            raise ValueError('El script no puede estar vacío')
        return cleaned

    @field_validator('target_audience')
    @classmethod
    def validate_audience(cls, v: str) -> str:
        """Valida y limpia la audiencia objetivo."""
        return v.strip().lower()


class ScriptListRequest(BaseModel):
    """Request para listar scripts de usuario."""

    page: int = Field(default=1, ge=1, description="Número de página")
    page_size: int = Field(default=10, ge=1, le=50, description="Tamaño de página")
    category: Optional[CategoriaEnum] = Field(default=None, description="Filtrar por categoría")
    tone: Optional[TonoEnum] = Field(default=None, description="Filtrar por tono")
    search: Optional[str] = Field(default=None, description="Búsqueda en texto")

    @field_validator('search')
    @classmethod
    def validate_search(cls, v: Optional[str]) -> Optional[str]:
        """Valida el término de búsqueda."""
        if v:
            cleaned = v.strip()
            return cleaned if len(cleaned) >= 3 else None
        return v


class ScriptUpdateRequest(BaseModel):
    """Request para actualizar un script manualmente."""

    enhanced_script: Optional[str] = Field(
        default=None,
        max_length=3000,
        description="Script mejorado editado manualmente"
    )
    keywords: Optional[list[str]] = Field(
        default=None,
        description="Palabras clave actualizadas"
    )

    @field_validator('enhanced_script')
    @classmethod
    def validate_enhanced_script(cls, v: Optional[str]) -> Optional[str]:
        """Valida el script mejorado."""
        if v:
            cleaned = v.strip()
            return cleaned if len(cleaned) >= 10 else None
        return v

    @field_validator('keywords')
    @classmethod
    def validate_keywords(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        """Valida las palabras clave."""
        if v:
            # Filtrar y limpiar keywords
            cleaned_keywords = []
            for keyword in v:
                if isinstance(keyword, str):
                    clean_keyword = keyword.strip().lower()
                    if clean_keyword and len(clean_keyword) >= 2:
                        cleaned_keywords.append(clean_keyword)
            return cleaned_keywords[:20]  # Máximo 20 keywords
        return v