"""
Script enhancement endpoints
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.script import ScriptRequest, ScriptResponse
from app.api.deps import get_openai_service
from app.services.openai_service import OpenAIService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/mejorar-script", response_model=ScriptResponse, summary="Enhance Script")
async def enhance_script(
    request: ScriptRequest,
    openai_service: OpenAIService = Depends(get_openai_service)
):
    """
    Mejora un script usando IA, añadiendo ganchos de enganche,
    estructura y optimizando para la duración objetivo.
    """
    try:
        logger.info(f"🎯 Mejorando script: {len(request.script)} caracteres")

        # Mejorar script usando OpenAI
        enhanced_script = await openai_service.enhance_script(
            script=request.script,
            target_duration=request.target_duration,
            tone=request.tone,
            target_audience=request.target_audience
        )

        logger.info(f"✅ Script mejorado: {len(enhanced_script)} caracteres")

        return ScriptResponse(
            enhanced_script=enhanced_script,
            original_length=len(request.script),
            enhanced_length=len(enhanced_script),
            estimated_duration=len(enhanced_script.split()) / 2.5  # ~2.5 palabras por segundo
        )

    except Exception as e:
        logger.error(f"❌ Error mejorando script: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error mejorando script: {str(e)}"
        )