"""
API v1 main router
"""
from fastapi import APIRouter
from app.api.v1.routes import health, script, audio, clips, video

api_router = APIRouter()

# Include all route modules
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(script.router, tags=["Script Enhancement"])
api_router.include_router(audio.router, tags=["Audio Generation"])
api_router.include_router(clips.router, tags=["Clip Management"])
api_router.include_router(video.router, tags=["Video Generation"])

# Root endpoint
@api_router.get("/", tags=["Root"])
async def root():
    """
    Endpoint raíz de la API v1
    """
    return {
        "message": "Video Generation API v1",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "health": "/health",
            "script": "/mejorar-script",
            "audio": "/generar-voz",
            "clips": "/seleccionar-clips, /buscar-clips",
            "video": "/generar-video"
        }
    }