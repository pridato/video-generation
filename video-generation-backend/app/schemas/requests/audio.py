"""
Audio request schemas
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from ..base import VozEnum


class AudioGenerateRequest(BaseModel):
    """Request para generar audio desde un script."""

    script_id: str = Field(
        ...,
        description="ID del script para generar audio"
    )
    voice: VozEnum = Field(
        default=VozEnum.ALLOY,
        description="Voz a utilizar"
    )
    speed: float = Field(
        default=1.0,
        ge=0.25,
        le=4.0,
        description="Velocidad del habla (0.25 - 4.0)"
    )
    save_to_storage: bool = Field(
        default=True,
        description="Si guardar el audio en storage"
    )

    @field_validator('script_id')
    @classmethod
    def validate_script_id(cls, v: str) -> str:
        """Valida el ID del script."""
        if not v.strip():
            raise ValueError('El ID del script no puede estar vacío')
        return v.strip()


class TextToAudioRequest(BaseModel):
    """Request para generar audio directamente desde texto."""

    text: str = Field(
        ...,
        min_length=10,
        max_length=3000,
        description="Texto a convertir en audio"
    )
    voice: VozEnum = Field(
        default=VozEnum.ALLOY,
        description="Voz a utilizar"
    )
    speed: float = Field(
        default=1.0,
        ge=0.25,
        le=4.0,
        description="Velocidad del habla"
    )
    save_to_storage: bool = Field(
        default=False,
        description="Si guardar el audio en storage"
    )

    @field_validator('text')
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Valida y limpia el texto."""
        cleaned = v.strip()
        if not cleaned:
            raise ValueError('El texto no puede estar vacío')
        return cleaned


class AudioTranscribeRequest(BaseModel):
    """Request para transcribir audio (metadata, el audio va en multipart)."""

    language: Optional[str] = Field(
        default=None,
        description="Idioma del audio (opcional)"
    )
    format: str = Field(
        default="text",
        pattern="^(text|json|srt|verbose_json)$",
        description="Formato de salida de la transcripción"
    )


class AudioDeleteRequest(BaseModel):
    """Request para eliminar un audio."""

    audio_url: str = Field(
        ...,
        description="URL del audio a eliminar"
    )

    @field_validator('audio_url')
    @classmethod
    def validate_audio_url(cls, v: str) -> str:
        """Valida la URL del audio."""
        if not v.strip():
            raise ValueError('La URL del audio no puede estar vacía')
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL inválida')
        return v.strip()