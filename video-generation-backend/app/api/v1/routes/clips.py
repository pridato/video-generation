"""
Clip selection and search endpoints - Refactored for hexagonal architecture
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, status

from app.api.middleware.auth import get_user_id

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/select",
    summary="Select Clips",
    description="Selecciona clips relevantes para un script - PENDIENTE DE IMPLEMENTACIÓN"
)
async def select_clips(
    user_id: str = Depends(get_user_id)
):
    """
    Selecciona clips relevantes para un script usando IA.

    Esta funcionalidad está pendiente de implementación en la nueva arquitectura.
    """
    logger.info(f"🎬 Selección de clips solicitada por usuario: {user_id[:8]}...")

    # TODO: Implementar selección de clips con casos de uso
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Funcionalidad de selección de clips pendiente de implementación"
    )


@router.get(
    "/search",
    summary="Search Clips",
    description="Busca clips por contenido - PENDIENTE DE IMPLEMENTACIÓN"
)
async def search_clips(
    user_id: str = Depends(get_user_id)
):
    """
    Busca clips por contenido usando embeddings.

    Esta funcionalidad está pendiente de implementación en la nueva arquitectura.
    """
    logger.info(f"🔍 Búsqueda de clips solicitada por usuario: {user_id[:8]}...")

    # TODO: Implementar búsqueda de clips con casos de uso
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Funcionalidad de búsqueda de clips pendiente de implementación"
    )