"""
Audio generation and processing endpoints
"""
import os
import time
import base64
import logging
from io import BytesIO
from pydub import AudioSegment
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from app.schemas.audio import AudioGenerationRequest, AudioGenerationResponse, AudioSegmentResponse
from app.api.deps import get_openai_service
from app.services.openai_service import OpenAIService
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# Directorio para almacenar audios generados
AUDIO_DIR = "generated_audios"
os.makedirs(AUDIO_DIR, exist_ok=True)


@router.post("/generar-voz", response_model=AudioGenerationResponse, summary="Generate Voice")
async def generate_voice(
    request: AudioGenerationRequest,
    openai_service: OpenAIService = Depends(get_openai_service)
):
    """
    Genera audio de voz desde texto usando ElevenLabs, con post-procesamiento
    para mejorar la calidad y generar segmentos con timestamps.
    """
    try:
        logger.info(f"🎤 Generando voz: {len(request.text)} caracteres")

        # Generar voz usando el servicio
        audio_result = await openai_service.generate_voice(
            text=request.text,
            voice_id=request.voice_id,
            voice_settings=request.voice_settings
        )

        logger.info("🎵 Audio generado exitosamente")

        # Crear nombre único para el archivo
        timestamp = str(int(time.time()))
        filename = f"voice_{timestamp}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)

        # Guardar archivo de audio
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(audio_result['audio_base64']))

        # Análisis del audio para segmentos
        try:
            audio_segment = AudioSegment.from_file(filepath)
            duration = len(audio_segment) / 1000.0  # Duración en segundos

            # Generar segmentos automáticos basados en pausas o duración
            segments = await _generate_audio_segments(request.text, audio_segment)

            logger.info(f"📊 Audio analizado: {duration:.2f}s, {len(segments)} segmentos")

            return AudioGenerationResponse(
                success=True,
                message="Audio generado exitosamente",
                audio_url=f"/audio/{filename}",
                duration=duration,
                audio_base64=audio_result['audio_base64'],
                segments=segments,
                filename=filename
            )

        except Exception as e:
            logger.warning(f"⚠️ Error analizando audio: {e}")
            # Fallback sin segmentos
            return AudioGenerationResponse(
                success=True,
                message="Audio generado exitosamente (sin análisis de segmentos)",
                audio_url=f"/audio/{filename}",
                duration=0.0,
                audio_base64=audio_result['audio_base64'],
                segments=[],
                filename=filename
            )

    except Exception as e:
        logger.error(f"❌ Error generando voz: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando voz: {str(e)}"
        )


async def _generate_audio_segments(text: str, audio_segment: AudioSegment) -> list:
    """
    Genera segmentos de audio automáticamente basándose en el texto y el audio
    """
    try:
        # Dividir texto en oraciones
        sentences = [s.strip() for s in text.split('.') if s.strip()]

        if not sentences:
            return []

        segments = []
        total_duration = len(audio_segment) / 1000.0
        current_time = 0.0

        # Distribuir tiempo entre oraciones
        for i, sentence in enumerate(sentences):
            # Estimar duración basada en longitud del texto
            sentence_duration = (len(sentence.split()) / settings.WORDS_PER_SECOND)

            # Ajustar proporcionalmente al audio real
            if i == len(sentences) - 1:  # Último segmento
                segment_duration = total_duration - current_time
            else:
                segment_duration = min(sentence_duration, total_duration - current_time)

            if segment_duration > 0:
                segments.append(AudioSegmentResponse(
                    texto=sentence,
                    inicio=current_time,
                    duracion=segment_duration,
                    tipo="oracion"
                ))

                current_time += segment_duration

        logger.info(f"📝 Generados {len(segments)} segmentos automáticos")
        return segments

    except Exception as e:
        logger.warning(f"⚠️ Error generando segmentos automáticos: {e}")
        return []