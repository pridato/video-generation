import base64
import io
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.models import (
    AudioGenerationRequest, AudioGenerationResponse, ScriptRequest, ScriptResponse,
    HealthResponse, ErrorResponse, ClipSelectionRequest, ClipSelectionResponse,
    ClipSearchRequest, ClipSearchResponse, SelectedClipInfo, ClipSearchResult
)
from app.services.openai_service import openai_service
from app.services.clip_selection_service import clip_selection_service
from app.services.embedding_service import embedding_service
import os
import time
from pydub import AudioSegment
from app.models import AudioSegmentResponse
# Crear servicio de ensamblaje
from app.services.video_assembly_service import VideoAssemblyService
from supabase import create_client


# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API para mejorar scripts de videos usando IA",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Directorio para almacenar audios generados
AUDIO_DIR = "audios"
os.makedirs(AUDIO_DIR, exist_ok=True)


# Manejador de errores global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Error no manejado: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Error interno del servidor",
            detail="Ha ocurrido un error inesperado",
            code=500
        ).dict()
    )


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Endpoint de health check para verificar el estado de la API
    """
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        openai_configured=settings.openai_configured
    )


@app.post("/mejorar-script", response_model=ScriptResponse, tags=["Script Enhancement"])
async def mejorar_script(request: ScriptRequest):
    """
    Mejora un script usando OpenAI GPT-4o-mini para optimizar contenido de YouTube Shorts

    - **script**: Texto original del usuario (10-2000 caracteres)
    - **categoria**: Categoría del contenido (tech, marketing, education, etc.)

    Retorna un script optimizado con:
    - Hook potente (5-8s)
    - Contenido estructurado (40-45s)
    - CTA efectivo (5-8s)
    - Palabras clave SEO
    - Duración estimada
    """
    try:
        logger.info(
            f"Recibida solicitud para mejorar script de categoría: {request.categoria}")

        # Verificar que OpenAI esté configurado
        if not openai_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de IA no disponible. Configurar OPENAI_API_KEY."
            )

        # Validaciones adicionales
        if len(request.script.split()) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El script debe tener al menos 5 palabras"
            )

        # Mejorar script usando OpenAI
        result = await openai_service.mejorar_script(
            script=request.script,
            categoria=request.categoria
        )

        logger.info(
            f"Script mejorado exitosamente. Duración: {result.duracion_estimada}s")
        return result

    except ValueError as e:
        logger.warning(f"Error de validación: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error procesando script: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno procesando el script"
        )


@app.post("/generar-voz", tags=["TTS"])
async def generar_voz(request: AudioGenerationRequest):
    """
    Genera un archivo MP3 con el script usando la voz seleccionada.
    - Guarda el MP3 en backend (carpeta /audios).
    - Devuelve JSON con metadatos + base64.
    """
    try:
        if not openai_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de IA no disponible. Configurar OPENAI_API_KEY."
            )

        # --- 1. Construir texto ---
        script_text = request.script

        # --- 2. Generar TTS ---
        audio_bytes = await openai_service.generar_tts(
            script=script_text,
            voice_id=request.voice_id.value
        )

        # --- 3. Guardar en backend ---
        file_name = f"{request.video_id}.mp3"

        # --- 4. Respuesta JSON ---
        audio_segment = AudioSegment.from_file(
            io.BytesIO(audio_bytes), format="mp3")
        duration_sec = round(len(audio_segment) / 1000, 2)

        # --- 5. Devolver JSON ---
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        # Simplificar conversión de segmentos
        segmentos = []
        if request.enhanced_script and request.enhanced_script.segmentos:
            for seg in request.enhanced_script.segmentos:
                segmentos.append(AudioSegmentResponse(
                    text=seg.texto,
                    type=seg.tipo,
                    emotion=getattr(seg, 'emocion', 'neutral'),
                    duration=getattr(seg, 'duracion', 1.0),
                    speed=getattr(seg, 'velocidad', 1.0)
                ))

        return AudioGenerationResponse(
            audio_base64=audio_base64,
            segments=segmentos,
            filename=file_name,
            duration=duration_sec,
            voice_id=request.voice_id.value
        )

    except ValueError as e:
        logger.warning(f"Error de validación: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generando voz: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno generando voz"
        )


@app.post("/seleccionar-clips", response_model=ClipSelectionResponse, tags=["Clip Selection"])
async def seleccionar_clips(request: ClipSelectionRequest):
    """
    Selecciona clips optimizados para un script mejorado usando IA

    Este endpoint implementa el algoritmo completo de selección inteligente:
    1. Búsqueda por similitud semántica usando embeddings
    2. Filtros de compatibilidad (categoría, duración, estado activo)
    3. Puntuación específica por tipo de segmento (hook, contenido, cta)
    4. Evitar repeticiones de clips y fuentes
    5. Verificación de coherencia temporal y visual

    - **enhanced_script**: Script mejorado con segmentos divididos
    - **categoria**: Categoría del contenido (tech, food, fitness, education)
    - **audio_duration**: Duración real del audio generado en segundos
    - **target_clips_count**: Número objetivo de clips (por defecto 3)

    Retorna clips seleccionados con métricas de calidad y coherencia.
    """
    start_time = time.time()

    try:
        logger.info(
            f"🎬 Iniciando selección de clips para categoría: {request.categoria}")

        # Verificar que el servicio de selección esté disponible
        if not clip_selection_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de selección de clips no disponible"
            )

        # Validaciones adicionales
        if not request.enhanced_script.get("segmentos"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El script mejorado debe contener segmentos"
            )

        if request.audio_duration <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La duración del audio debe ser positiva"
            )

        # Ejecutar selección de clips
        result = await clip_selection_service.select_clips_for_script(
            enhanced_script=request.enhanced_script,
            category=request.categoria.value,
            audio_duration=request.audio_duration,
            target_clips_count=request.target_clips_count or 3
        )

        # Convertir resultado a formato de respuesta
        selected_clips_info = []
        for clip_match in result.selected_clips:
            clip_info = SelectedClipInfo(
                clip_id=clip_match.clip.id,
                filename=clip_match.clip.filename,
                file_url=clip_match.clip.file_url,
                duration=clip_match.clip.duration,
                segment_text=clip_match.segment_text,
                segment_type=clip_match.segment_type,
                similarity_score=clip_match.similarity_score,
                segment_score=clip_match.segment_score,
                final_score=clip_match.final_score,
                duration_compatibility=clip_match.duration_compatibility,
                quality_score=clip_match.clip.quality_score,
                motion_intensity=clip_match.clip.motion_intensity,
                concept_tags=clip_match.clip.concept_tags,
                emotion_tags=clip_match.clip.emotion_tags,
                dominant_colors=clip_match.clip.dominant_colors
            )
            selected_clips_info.append(clip_info)

        # Calcular estadísticas adicionales
        processing_time_ms = (time.time() - start_time) * 1000

        clips_by_category = {request.categoria.value: len(selected_clips_info)}

        average_similarity = (
            sum(clip.similarity_score for clip in selected_clips_info) /
            len(selected_clips_info)
            if selected_clips_info else 0.0
        )

        average_quality = (
            sum(clip.quality_score for clip in selected_clips_info) /
            len(selected_clips_info)
            if selected_clips_info else 0.0
        )

        response = ClipSelectionResponse(
            success=True,
            selected_clips=selected_clips_info,
            total_clips_duration=result.total_duration,
            audio_duration=result.audio_duration,
            duration_compatibility=result.duration_compatibility,
            visual_coherence_score=result.visual_coherence_score,
            estimated_engagement=result.estimated_engagement,
            warnings=result.warnings,
            processing_time_ms=processing_time_ms,
            clips_by_category=clips_by_category,
            average_similarity=average_similarity,
            average_quality=average_quality
        )

        logger.info(
            f"✅ Clips seleccionados exitosamente en {processing_time_ms:.1f}ms")
        logger.info(
            f"📊 Engagement estimado: {result.estimated_engagement:.2f}, Coherencia visual: {result.visual_coherence_score:.2f}")

        return response

    except ValueError as e:
        logger.warning(f"Error de validación en selección de clips: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error procesando selección de clips: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno seleccionando clips"
        )


@app.post("/buscar-clips", response_model=ClipSearchResponse, tags=["Clip Search"])
async def buscar_clips(request: ClipSearchRequest):
    """
    Busca clips por similitud semántica usando embeddings

    Endpoint para búsqueda libre de clips basada en texto:
    - Genera embedding de la consulta
    - Busca clips similares en la base de datos
    - Aplica filtros de calidad y similitud
    - Ordena por relevancia semántica

    - **query**: Texto de búsqueda libre
    - **categoria**: Categoría para filtrar clips
    - **max_results**: Número máximo de resultados (1-50)
    - **min_similarity**: Similitud mínima requerida (0-1)
    - **min_quality**: Calidad mínima requerida (0-5)

    Útil para exploración manual de clips y debugging.
    """
    start_time = time.time()

    if request.min_quality is None:
        request.min_quality = 0.0
    if request.min_similarity is None:
        request.min_similarity = 0.0
    if request.max_results is None or request.max_results <= 0 or request.max_results > 50:
        request.max_results = 10

    try:
        logger.info(
            f"🔍 Buscando clips para: '{request.query}' en {request.categoria}")

        # Verificar servicios necesarios
        if not clip_selection_service or not embedding_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicios de búsqueda de clips no disponibles"
            )

        # Cargar clips de la categoría
        available_clips = await clip_selection_service._load_clips_by_category(
            request.categoria.value
        )

        if not available_clips:
            return ClipSearchResponse(
                success=True,
                results=[],
                total_found=0,
                query_embedding_generated=False,
                processing_time_ms=(time.time() - start_time) * 1000
            )

        # Generar embedding de la consulta
        query_embedding = embedding_service.generate_script_embedding(
            embedding_service.prepare_script_text(
                request.query, request.categoria.value
            )
        )

        # Buscar clips similares
        search_results = []
        for clip in available_clips:
            # Aplicar filtros básicos
            if clip.quality_score < request.min_quality:
                continue

            if not clip.is_active:
                continue

            # Calcular similitud
            similarity = embedding_service.calculate_similarity(
                query_embedding, clip.embedding
            ) if clip.embedding else 0.0

            if similarity < request.min_similarity:
                continue

            # Crear resultado
            result = ClipSearchResult(
                clip_id=clip.id,
                filename=clip.filename,
                file_url=clip.file_url,
                similarity_score=similarity,
                quality_score=clip.quality_score,
                duration=clip.duration,
                description=clip.description,
                concept_tags=clip.concept_tags,
                keywords=clip.keywords
            )
            search_results.append(result)

        # Ordenar por similitud y limitar resultados
        search_results.sort(key=lambda x: x.similarity_score, reverse=True)
        search_results = search_results[:request.max_results]

        processing_time_ms = (time.time() - start_time) * 1000

        response = ClipSearchResponse(
            success=True,
            results=search_results,
            total_found=len(search_results),
            query_embedding_generated=True,
            processing_time_ms=processing_time_ms
        )

        logger.info(
            f"✅ Búsqueda completada: {len(search_results)} clips encontrados en {processing_time_ms:.1f}ms")

        return response

    except ValueError as e:
        logger.warning(f"Error de validación en búsqueda de clips: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error procesando búsqueda de clips: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno buscando clips"
        )


@app.get("/", tags=["Root"])
async def root():
    """
    Endpoint raíz con información básica de la API
    """
    return {
        "message": f"Bienvenido a {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


@app.post("/generar-video", response_model=dict, tags=["Video Generation"])
async def generar_video_final(request: dict):
    """
    🎬 Ensambla el video final combinando audio, clips y subtítulos

    ## Proceso:
    1. Descarga clips seleccionados
    2. Sincroniza clips con duración del audio
    3. Genera subtítulos automáticos
    4. Ensambla todo con FFmpeg
    5. Sube resultado a Supabase Storage
    6. Retorna URL del video generado

    ## Parámetros:
    - **script_metadata**: Datos completos del script con audio y clips
    - **user_id**: ID del usuario (opcional)
    - **title**: Título del video (opcional)

    Retorna URL del video generado y metadatos.
    """
    start_time = time.time()

    try:
        logger.info("🎬 Iniciando ensamblaje final del video...")

        # Validar datos requeridos
        script_metadata = request.get('script_metadata')
        if not script_metadata:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="script_metadata es requerido"
            )

        audio_data = script_metadata.get('audio_data')
        clips_data = script_metadata.get('clips_data')

        if not audio_data or not clips_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faltan datos de audio o clips en script_metadata"
            )

        supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )

        assembly_service = VideoAssemblyService(supabase_client)

        # Ensamblar video
        result = await assembly_service.assemble_video(
            script_metadata=script_metadata,
            user_id=request.get('user_id'),
            title=request.get('title', 'Video Generado')
        )

        processing_time_ms = (time.time() - start_time) * 1000

        logger.info(
            f"✅ Video ensamblado exitosamente en {processing_time_ms:.1f}ms")
        logger.info(f"📊 Video URL: {result['video_url']}")

        return {
            "success": True,
            "video_id": result['video_id'],
            "video_url": result['video_url'],
            "thumbnail_url": result.get('thumbnail_url'),
            "duration": result['duration'],
            "file_size": result['file_size'],
            "processing_time_ms": processing_time_ms,
            "download_url": f"/download-video/{result['video_id']}",
            "metadata": {
                "clips_count": len(clips_data['selected_clips']),
                "audio_duration": audio_data['duration'],
                "title": request.get('title', 'Video Generado')
            }
        }

    except Exception as e:
        logger.error(f"❌ Error ensamblando video: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error ensamblando video: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"OpenAI configurado: {settings.openai_configured}")

    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
