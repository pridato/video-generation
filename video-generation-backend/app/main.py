import base64
import io
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.models import AudioGenerationRequest, AudioGenerationResponse, AudioGenerationResponse, ScriptRequest, ScriptResponse, HealthResponse, ErrorResponse
from app.services.openai_service import openai_service
import os
from pydub import AudioSegment


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
        file_path = os.path.join(AUDIO_DIR, file_name)
        with open(file_path, "wb") as f:
            f.write(audio_bytes)

        # --- 4. Respuesta JSON ---
        audio_segment = AudioSegment.from_file(
            io.BytesIO(audio_bytes), format="mp3")
        duration_sec = round(len(audio_segment) / 1000, 2)

        # --- 5. Devolver JSON ---
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        # Convertir segmentos a AudioSegmentResponse si es necesario
        segmentos = []
        if request.enhanced_script:
            if request.enhanced_script.segmentos and hasattr(request.enhanced_script, "segmentos"):
                for seg in request.enhanced_script.segmentos:
                    if isinstance(seg, dict):
                        # Si es dict, inicializar AudioSegmentResponse desde dict
                        from app.models import AudioSegmentResponse
                        segmentos.append(AudioSegmentResponse(**seg))
                    elif hasattr(seg, "dict"):
                        # Si es Pydantic model, convertir a dict y luego a AudioSegmentResponse
                        from app.models import AudioSegmentResponse
                        segmentos.append(AudioSegmentResponse(**seg.dict()))
                    else:
                        # Si ya es AudioSegmentResponse, agregar directamente
                        segmentos.append(seg)

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
