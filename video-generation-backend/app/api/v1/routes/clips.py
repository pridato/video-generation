"""
Clip selection and search endpoints
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.schemas.clips import (
    ClipSelectionRequest, ClipSelectionResponse,
    ClipSearchRequest, ClipSearchResponse
)
from app.api.deps import get_clip_selection_service, get_embedding_service
from app.services.clip_selection_service import ClipSelectionService
from app.services.embedding_service import EmbeddingService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/seleccionar-clips", response_model=ClipSelectionResponse, summary="Select Clips")
async def select_clips(
    request: ClipSelectionRequest,
    clip_service: ClipSelectionService = Depends(get_clip_selection_service)
):
    """
    Selecciona clips de video relevantes basándose en el script mejorado,
    usando embeddings semánticos y análisis temporal.
    """
    try:
        logger.info(f"🎬 Seleccionando clips para: {request.category}")
        logger.info(f"📝 Script: {len(request.enhanced_script)} caracteres")

        # Seleccionar clips usando el servicio
        selection_result = await clip_service.select_clips_temporal(
            category=request.category,
            enhanced_script=request.enhanced_script,
            audio_duration=request.audio_duration,
            segmentos=request.segmentos,
            target_clips_count=request.target_clips_count
        )

        logger.info(f"✅ Clips seleccionados: {len(selection_result.selected_clips)}")

        return ClipSelectionResponse(
            success=True,
            message="Clips seleccionados exitosamente",
            selected_clips=selection_result.selected_clips,
            total_selected=len(selection_result.selected_clips),
            selection_criteria=selection_result.selection_criteria,
            timeline_assignments=selection_result.timeline_assignments,
            metadata=selection_result.metadata
        )

    except Exception as e:
        logger.error(f"❌ Error seleccionando clips: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error seleccionando clips: {str(e)}"
        )


@router.post("/buscar-clips", response_model=ClipSearchResponse, summary="Search Clips")
async def search_clips(
    request: ClipSearchRequest,
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    limit: int = Query(default=10, le=50, description="Maximum number of results")
):
    """
    Busca clips usando texto libre y embeddings semánticos.
    Útil para encontrar clips específicos o explorar contenido disponible.
    """
    try:
        logger.info(f"🔍 Buscando clips: '{request.query}' en {request.category}")

        # Buscar clips usando embeddings
        search_results = await embedding_service.search_clips_by_text(
            query=request.query,
            category=request.category if request.category != "all" else None,
            limit=limit,
            similarity_threshold=request.similarity_threshold
        )

        logger.info(f"📊 Encontrados {len(search_results)} clips")

        return ClipSearchResponse(
            success=True,
            message=f"Búsqueda completada: {len(search_results)} resultados",
            results=search_results,
            total_results=len(search_results),
            query=request.query,
            category=request.category
        )

    except Exception as e:
        logger.error(f"❌ Error buscando clips: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error buscando clips: {str(e)}"
        )