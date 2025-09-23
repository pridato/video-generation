"""
Audio generation and processing schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.schemas.common import VoiceEnum, EmotionEnum, SegmentTypeEnum


class VoiceSettings(BaseModel):
    stability: Optional[float] = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Voice stability"
    )
    similarity_boost: Optional[float] = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Voice similarity boost"
    )
    style: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Voice style"
    )


class SegmentInput(BaseModel):
    texto: str = Field(..., description="Segment text")
    tipo: str = Field(
        ...,
        description="Segment type: hook, content, cta, etc."
    )
    emocion: Optional[str] = Field(
        default="neutral",
        description="Segment emotion"
    )
    duracion: Optional[float] = Field(
        default=1.0,
        ge=0,
        description="Estimated segment duration in seconds"
    )
    velocidad: Optional[float] = Field(
        default=1.0,
        ge=0.25,
        le=4.0,
        description="Voice speed"
    )
    pausa_despues: Optional[float] = Field(
        default=0.5,
        ge=0,
        description="Pause after segment in seconds"
    )


class EnhancedScript(BaseModel):
    segmentos: List[SegmentInput] = Field(
        ...,
        description="List of enhanced script segments"
    )


class AudioGenerationRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Text to convert to speech"
    )
    voice_id: VoiceEnum = Field(..., description="Voice ID to use")
    voice_settings: Optional[VoiceSettings] = Field(
        default=None,
        description="Voice settings"
    )
    enhanced_script: Optional[EnhancedScript] = Field(
        None,
        description="Optional enhanced script"
    )


class AudioSegmentResponse(BaseModel):
    texto: str = Field(..., description="Segment text")
    inicio: float = Field(..., ge=0, description="Start time in seconds")
    duracion: float = Field(..., ge=0, description="Duration in seconds")
    tipo: str = Field(..., description="Segment type")
    emocion: Optional[str] = Field(
        default="neutral",
        description="Segment emotion"
    )
    velocidad: Optional[float] = Field(
        default=1.0,
        description="Applied voice speed"
    )


class AudioGenerationResponse(BaseModel):
    success: bool = Field(..., description="Generation success status")
    message: str = Field(..., description="Response message")
    audio_url: Optional[str] = Field(None, description="Audio file URL")
    audio_base64: str = Field(..., description="Base64 encoded audio")
    duration: float = Field(..., ge=0, description="Total duration in seconds")
    segments: List[AudioSegmentResponse] = Field(
        default=[],
        description="Audio segments with timing"
    )
    filename: str = Field(..., description="Generated filename")
    voice_id: Optional[str] = Field(None, description="Used voice ID")