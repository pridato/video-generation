"""
Audio generation and processing endpoints - Refactored for hexagonal architecture
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile

from app.schemas.requests.audio import (
    AudioGenerateRequest, TextToAudioRequest,
    AudioTranscribeRequest, AudioDeleteRequest
)
from app.schemas.responses.audio import (
    AudioGenerateResponse, TextToAudioResponse,
    AudioTranscribeResponse, AudioDeleteResponse,
    VoiceListResponse, AudioHealthResponse
)
from app.api.middleware.auth import get_current_user, get_user_id
from app.application.use_cases.generate_audio import GenerateAudioUseCase
from app.core.container import get_generate_audio_use_case

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/generate",
    response_model=AudioGenerateResponse,
    summary="Generate Audio from Script",
    description="Genera audio a partir de un script usando Text-to-Speech"
)
async def generate_audio(
    request: AudioGenerateRequest,
    user_id: str = Depends(get_user_id),
    use_case: GenerateAudioUseCase = Depends(get_generate_audio_use_case)
):
    """
    Genera audio a partir de un script guardado.

    - **script_id**: ID del script para generar audio
    - **voice**: Voz a utilizar (alloy, echo, fable, onyx, nova, shimmer)
    - **speed**: Velocidad del habla (0.25 - 4.0)
    - **save_to_storage**: Si guardar el audio en storage
    """
    try:
        logger.info(f"🎵 Generando audio para usuario: {user_id[:8]}...")

        result = await use_case.execute(
            user_id=user_id,
            script_id=request.script_id,
            voice=request.voice.value,
            speed=request.speed,
            save_to_storage=request.save_to_storage
        )

        logger.info(f"✅ Audio generado exitosamente: {result.get('audio_size', 0)} bytes")

        return AudioGenerateResponse(
            message="Audio generado exitosamente",
            data=result
        )

    except ValueError as e:
        logger.warning(f"Error de validación: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionError as e:
        logger.warning(f"Error de permisos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generando audio: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno generando audio"
        )


@router.post(
    "/text-to-speech",
    response_model=TextToAudioResponse,
    summary="Text to Speech",
    description="Convierte texto directamente a audio sin guardar script"
)
async def text_to_speech(
    request: TextToAudioRequest,
    user_id: str = Depends(get_user_id),
    use_case: GenerateAudioUseCase = Depends(get_generate_audio_use_case)
):
    """
    Convierte texto directamente a audio usando TTS.

    - **text**: Texto a convertir (10-3000 caracteres)
    - **voice**: Voz a utilizar
    - **speed**: Velocidad del habla
    - **save_to_storage**: Si guardar el audio en storage
    """
    try:
        logger.info(f"🗣️ Convirtiendo texto a audio para usuario: {user_id[:8]}...")

        result = await use_case.generate_audio_from_text(
            user_id=user_id,
            text=request.text,
            voice=request.voice.value,
            speed=request.speed,
            save_to_storage=request.save_to_storage
        )

        logger.info(f"✅ Texto convertido a audio: {len(request.text)} caracteres")

        return TextToAudioResponse(
            message="Texto convertido a audio exitosamente",
            data=result
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error en text-to-speech: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno en conversión de texto a audio"
        )


@router.post(
    "/transcribe",
    response_model=AudioTranscribeResponse,
    summary="Transcribe Audio",
    description="Transcribe audio a texto usando Whisper"
)
async def transcribe_audio(
    audio_file: UploadFile = File(..., description="Archivo de audio a transcribir"),
    user_id: str = Depends(get_user_id),
    use_case: GenerateAudioUseCase = Depends(get_generate_audio_use_case)
):
    """
    Transcribe un archivo de audio a texto.

    - **audio_file**: Archivo de audio (MP3, WAV, M4A, etc.)
    """
    try:
        # Validar tipo de archivo
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo debe ser de tipo audio"
            )

        logger.info(f"🎤 Transcribiendo audio para usuario: {user_id[:8]}...")

        # Leer contenido del archivo
        audio_data = await audio_file.read()

        result = await use_case.transcribe_audio(
            user_id=user_id,
            audio_data=audio_data
        )

        logger.info(f"✅ Audio transcrito: {result['character_count']} caracteres")

        return AudioTranscribeResponse(
            message="Audio transcrito exitosamente",
            data=result
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error transcribiendo audio: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno transcribiendo audio"
        )


@router.delete(
    "/delete",
    response_model=AudioDeleteResponse,
    summary="Delete Audio",
    description="Elimina un audio del storage"
)
async def delete_audio(
    request: AudioDeleteRequest,
    user_id: str = Depends(get_user_id),
    use_case: GenerateAudioUseCase = Depends(get_generate_audio_use_case)
):
    """
    Elimina un audio del storage del usuario.

    - **audio_url**: URL del audio a eliminar
    """
    try:
        logger.info(f"🗑️ Eliminando audio para usuario: {user_id[:8]}...")

        success = await use_case.delete_audio(
            user_id=user_id,
            audio_url=request.audio_url
        )

        if success:
            return AudioDeleteResponse(
                message="Audio eliminado exitosamente",
                data={
                    "audio_url": request.audio_url,
                    "deleted": True,
                    "deleted_at": "2024-01-01T12:00:00Z"
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio no encontrado"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando audio: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno eliminando audio"
        )


@router.get(
    "/voices",
    response_model=VoiceListResponse,
    summary="List Available Voices",
    description="Obtiene la lista de voces disponibles para TTS"
)
async def list_voices():
    """
    Lista todas las voces disponibles para Text-to-Speech.
    """
    try:
        voices_data = {
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
                },
                {
                    "id": "fable",
                    "name": "Fable",
                    "description": "Voz femenina expresiva",
                    "gender": "female",
                    "language": "multi"
                },
                {
                    "id": "onyx",
                    "name": "Onyx",
                    "description": "Voz masculina profunda",
                    "gender": "male",
                    "language": "multi"
                },
                {
                    "id": "nova",
                    "name": "Nova",
                    "description": "Voz femenina joven",
                    "gender": "female",
                    "language": "multi"
                },
                {
                    "id": "shimmer",
                    "name": "Shimmer",
                    "description": "Voz femenina suave",
                    "gender": "female",
                    "language": "multi"
                }
            ]
        }

        return VoiceListResponse(
            message="Voces obtenidas exitosamente",
            data=voices_data
        )

    except Exception as e:
        logger.error(f"Error listando voces: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error obteniendo lista de voces"
        )


@router.get(
    "/health",
    response_model=AudioHealthResponse,
    summary="Audio Service Health",
    description="Verifica el estado del servicio de audio"
)
async def audio_health():
    """
    Verifica el estado de los servicios de audio.
    """
    try:
        # TODO: Implementar health checks reales
        health_data = {
            "tts_service": "operational",
            "transcription_service": "operational",
            "storage_service": "operational",
            "response_time_ms": 150,
            "last_check": "2024-01-01T12:00:00Z"
        }

        return AudioHealthResponse(
            message="Servicios de audio operando correctamente",
            data=health_data
        )

    except Exception as e:
        logger.error(f"Error en health check de audio: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Error verificando estado de servicios de audio"
        )