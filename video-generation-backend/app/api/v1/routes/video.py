"""
Video generation endpoints
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.video import VideoGenerationRequest, VideoGenerationResponse
from app.api.deps import get_video_assembly_service
from app.services.video_assembly_service import VideoAssemblyService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/generar-video", response_model=VideoGenerationResponse, summary="Generate Video")
async def generate_video(
    request: VideoGenerationRequest,
    video_service: VideoAssemblyService = Depends(get_video_assembly_service)
):
    """
    Ensambla un video completo combinando audio, clips de video seleccionados
    y subtítulos automáticos. Proceso completo de generación de video.
    """
    try:
        logger.info(f"🎬 Iniciando generación de video: {request.title}")

        # Validar datos requeridos
        if not request.script_metadata:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="script_metadata es requerido"
            )

        if not request.script_metadata.get('audio_data'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="audio_data es requerido en script_metadata"
            )

        if not request.script_metadata.get('clips_data'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="clips_data es requerido en script_metadata"
            )

        logger.info("🔄 Ensamblando video...")

        # Ensamblar video usando el servicio
        video_result = await video_service.assemble_video(
            script_metadata=request.script_metadata,
            user_id=request.user_id,
            title=request.title
        )

        logger.info(f"✅ Video generado exitosamente: {video_result['video_id']}")

        return VideoGenerationResponse(
            success=True,
            message="Video generado exitosamente",
            video_id=video_result['video_id'],
            video_url=video_result['video_url'],
            thumbnail_url=video_result.get('thumbnail_url'),
            duration=video_result['duration'],
            file_size=video_result['file_size'],
            title=video_result['title']
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise

    except Exception as e:
        logger.error(f"❌ Error generando video: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error ensamblando video: {str(e)}"
        )