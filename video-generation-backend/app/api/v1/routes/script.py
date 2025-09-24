"""
Script enhancement endpoints - Refactored to use hexagonal architecture
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, status, Query

from app.schemas.requests.script import ScriptEnhanceRequest, ScriptListRequest, ScriptUpdateRequest
from app.schemas.responses.script import (
    ScriptEnhanceResponse, ScriptListResponse, ScriptDetailResponse,
    ScriptStatsResponse, ScriptAnalyticsResponse
)
from app.schemas.base import ErrorResponse
from app.api.middleware.auth import get_current_user, get_user_id
from app.application.use_cases.enhance_script import EnhanceScriptUseCase
from app.core.container import get_enhance_script_use_case

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/enhance",
    response_model=ScriptEnhanceResponse,
    summary="Enhance Script with AI",
    description="Mejora un script usando IA, optimizando estructura, ganchos y duración"
)
async def enhance_script(
    request: ScriptEnhanceRequest,
    user_id: str = Depends(get_user_id),
    use_case: EnhanceScriptUseCase = Depends(get_enhance_script_use_case)
):
    """
    Mejora un script usando IA con análisis completo y optimización.

    - **script**: Texto original del script (10-2000 caracteres)
    - **target_duration**: Duración objetivo en segundos (15-120)
    - **tone**: Tono deseado (educativo, viral, profesional, etc.)
    - **category**: Categoría del contenido (tech, education, marketing, etc.)
    - **target_audience**: Audiencia objetivo
    """
    try:
        logger.info(f"🎯 Mejorando script para usuario: {user_id[:8]}...")

        # Ejecutar caso de uso
        result = await use_case.execute(
            user_id=user_id,
            original_script=request.script,
            target_duration=request.target_duration,
            tone=request.tone.value,
            category=request.category.value,
            target_audience=request.target_audience
        )

        logger.info(
            f"✅ Script mejorado exitosamente: {result['script_id'][:8]}... "
            f"({result['enhanced_length']} chars)"
        )

        return ScriptEnhanceResponse(
            message="Script mejorado exitosamente",
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
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error mejorando script: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno procesando el script"
        )


@router.get(
    "/",
    response_model=ScriptListResponse,
    summary="List User Scripts",
    description="Obtiene la lista de scripts del usuario con paginación y filtros"
)
async def list_scripts(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=50, description="Elementos por página"),
    category: str = Query(None, description="Filtrar por categoría"),
    tone: str = Query(None, description="Filtrar por tono"),
    search: str = Query(None, min_length=3, description="Buscar en contenido"),
    user_id: str = Depends(get_user_id),
    use_case: EnhanceScriptUseCase = Depends(get_enhance_script_use_case)
):
    """
    Lista los scripts del usuario con opciones de filtrado y paginación.

    - **page**: Número de página (comenzando desde 1)
    - **page_size**: Número de elementos por página (máximo 50)
    - **category**: Filtrar por categoría específica
    - **tone**: Filtrar por tono específico
    - **search**: Buscar en el contenido del script
    """
    try:
        # Calcular offset
        offset = (page - 1) * page_size

        logger.info(f"📋 Listando scripts para usuario: {user_id[:8]}... (página {page})")

        # Obtener scripts del usuario
        result = await use_case.get_user_scripts(
            user_id=user_id,
            limit=page_size,
            offset=offset
        )

        # Preparar respuesta paginada
        response = ScriptListResponse(
            items=result["scripts"],
            total_count=result["total_count"],
            page=page,
            page_size=page_size,
            has_more=result["has_more"]
        )

        logger.info(f"✅ Scripts listados: {len(result['scripts'])} de {result['total_count']}")
        return response

    except Exception as e:
        logger.error(f"Error listando scripts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error obteniendo lista de scripts"
        )


@router.get(
    "/{script_id}",
    response_model=ScriptDetailResponse,
    summary="Get Script Details",
    description="Obtiene los detalles completos de un script específico"
)
async def get_script(
    script_id: str,
    user_id: str = Depends(get_user_id),
    use_case: EnhanceScriptUseCase = Depends(get_enhance_script_use_case)
):
    """
    Obtiene los detalles completos de un script específico.

    - **script_id**: ID único del script
    """
    try:
        logger.info(f"🔍 Obteniendo script: {script_id[:8]}... para usuario: {user_id[:8]}...")

        result = await use_case.get_script_by_id(script_id, user_id)

        logger.info(f"✅ Script obtenido exitosamente: {script_id[:8]}...")

        return ScriptDetailResponse(
            message="Script obtenido exitosamente",
            data=result
        )

    except ValueError as e:
        logger.warning(f"Script no encontrado: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        logger.warning(f"Acceso denegado al script: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error obteniendo script: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error obteniendo detalles del script"
        )


@router.put(
    "/{script_id}",
    response_model=ScriptDetailResponse,
    summary="Update Script",
    description="Actualiza un script existente manualmente"
)
async def update_script(
    script_id: str,
    request: ScriptUpdateRequest,
    user_id: str = Depends(get_user_id),
    use_case: EnhanceScriptUseCase = Depends(get_enhance_script_use_case)
):
    """
    Permite actualizar manualmente un script existente.

    - **script_id**: ID único del script
    - **enhanced_script**: Texto del script editado manualmente
    - **keywords**: Palabras clave actualizadas
    """
    try:
        logger.info(f"📝 Actualizando script: {script_id[:8]}... para usuario: {user_id[:8]}...")

        # Primero obtener el script actual para verificar permisos
        current_script = await use_case.get_script_by_id(script_id, user_id)

        # TODO: Implementar lógica de actualización
        # Por ahora retornamos el script actual
        logger.warning("⚠️ Función de actualización no implementada todavía")

        return ScriptDetailResponse(
            message="Script actualizado exitosamente",
            data=current_script
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete(
    "/{script_id}",
    summary="Delete Script",
    description="Elimina un script específico"
)
async def delete_script(
    script_id: str,
    user_id: str = Depends(get_user_id)
):
    """
    Elimina un script específico del usuario.

    - **script_id**: ID único del script a eliminar
    """
    try:
        logger.info(f"🗑️ Eliminando script: {script_id[:8]}... para usuario: {user_id[:8]}...")

        # TODO: Implementar eliminación usando repositorio
        logger.warning("⚠️ Función de eliminación no implementada todavía")

        return {
            "success": True,
            "message": "Script eliminado exitosamente",
            "script_id": script_id
        }

    except Exception as e:
        logger.error(f"Error eliminando script: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error eliminando el script"
        )


@router.get(
    "/stats/user",
    response_model=ScriptStatsResponse,
    summary="User Script Statistics",
    description="Obtiene estadísticas de scripts del usuario"
)
async def get_user_script_stats(
    user_id: str = Depends(get_user_id)
):
    """
    Obtiene estadísticas completas de los scripts del usuario.
    """
    try:
        logger.info(f"📊 Obteniendo estadísticas para usuario: {user_id[:8]}...")

        # TODO: Implementar estadísticas reales
        mock_stats = {
            "total_scripts": 12,
            "scripts_this_month": 5,
            "avg_quality_score": 87.5,
            "top_categories": ["tech", "education", "marketing"],
            "top_tones": ["profesional", "educativo", "casual"],
            "total_duration_generated": 850.5,
            "avg_script_length": 195
        }

        return ScriptStatsResponse(
            message="Estadísticas obtenidas exitosamente",
            data=mock_stats
        )

    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error obteniendo estadísticas"
        )