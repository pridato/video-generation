"""
Audio response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from ..base import BaseResponse, VozEnum


class AudioGenerateResponse(BaseResponse):
    """Respuesta de generación de audio."""

    data: Dict[str, Any] = Field(..., description="Datos del audio generado")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Audio generado exitosamente",
                "timestamp": "2024-01-01T12:00:00Z",
                "data": {
                    "script_id": "uuid-script",
                    "voice": "alloy",
                    "speed": 1.0,
                    "text_length": 250,
                    "estimated_duration": 45.5,
                    "audio_size": 1048576,
                    "audio_url": "https://storage.example.com/audio/user123/script_audio_uuid.mp3",
                    "stored": True,
                    "generated_at": "2024-01-01T12:00:00Z"
                }
            }
        }


class TextToAudioResponse(BaseResponse):
    """Respuesta de conversión de texto a audio."""

    data: Dict[str, Any] = Field(..., description="Datos del audio generado desde texto")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Texto convertido a audio exitosamente",
                "data": {
                    "text_length": 180,
                    "voice": "nova",
                    "speed": 1.2,
                    "estimated_duration": 32.5,
                    "audio_size": 890123,
                    "audio_base64": "UklGRiQAAABXQVZFZm10...",
                    "stored": False,
                    "generated_at": "2024-01-01T12:00:00Z"
                }
            }
        }


class AudioTranscribeResponse(BaseResponse):
    """Respuesta de transcripción de audio."""

    data: Dict[str, Any] = Field(..., description="Datos de la transcripción")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Audio transcrito exitosamente",
                "data": {
                    "transcription": "Hola, este es el texto transcrito del audio...",
                    "character_count": 89,
                    "word_count": 15,
                    "audio_size": 2048576,
                    "language_detected": "es",
                    "confidence_score": 0.95,
                    "transcribed_at": "2024-01-01T12:00:00Z"
                }
            }
        }


class AudioDeleteResponse(BaseResponse):
    """Respuesta de eliminación de audio."""

    data: Dict[str, Any] = Field(..., description="Resultado de la eliminación")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Audio eliminado exitosamente",
                "data": {
                    "audio_url": "https://storage.example.com/audio/user123/audio_file.mp3",
                    "deleted": True,
                    "deleted_at": "2024-01-01T12:00:00Z"
                }
            }
        }


class AudioInfoResponse(BaseModel):
    """Información básica de un audio."""

    url: str = Field(..., description="URL del audio")
    duration: Optional[float] = Field(None, description="Duración en segundos")
    size: Optional[int] = Field(None, description="Tamaño en bytes")
    voice: VozEnum = Field(..., description="Voz utilizada")
    speed: float = Field(..., description="Velocidad utilizada")
    created_at: datetime = Field(..., description="Fecha de creación")


class AudioListResponse(BaseResponse):
    """Respuesta de lista de audios del usuario."""

    data: Dict[str, Any] = Field(..., description="Lista de audios")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "audios": [
                        {
                            "url": "https://storage.example.com/audio/user123/audio1.mp3",
                            "duration": 45.5,
                            "size": 1048576,
                            "voice": "alloy",
                            "speed": 1.0,
                            "created_at": "2024-01-01T12:00:00Z"
                        }
                    ],
                    "total_count": 8,
                    "total_duration": 320.5,
                    "total_size": 8388608
                }
            }
        }


class VoiceListResponse(BaseResponse):
    """Respuesta con lista de voces disponibles."""

    data: Dict[str, Any] = Field(..., description="Voces disponibles")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "voices": [
                        {
                            "id": "alloy",
                            "name": "Alloy",
                            "description": "Voz neutral y versátil",
                            "gender": "neutral",
                            "language": "multi"
                        },
                        {
                            "id": "echo",
                            "name": "Echo",
                            "description": "Voz masculina clara",
                            "gender": "male",
                            "language": "multi"
                        }
                    ]
                }
            }
        }


class AudioHealthResponse(BaseResponse):
    """Respuesta de health check del servicio de audio."""

    data: Dict[str, Any] = Field(..., description="Estado del servicio de audio")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "tts_service": "operational",
                    "transcription_service": "operational",
                    "storage_service": "operational",
                    "response_time_ms": 150,
                    "last_check": "2024-01-01T12:00:00Z"
                }
            }
        }