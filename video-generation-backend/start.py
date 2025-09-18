#!/usr/bin/env python3
"""
Script para iniciar el servidor de desarrollo
"""

import uvicorn
from app.config import settings

if __name__ == "__main__":
    print(f"🚀 Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📡 Servidor: http://{settings.API_HOST}:{settings.API_PORT}")
    print(f"📚 Documentación: http://localhost:{settings.API_PORT}/docs")
    print(f"🔧 OpenAI configurado: {'✅' if settings.openai_configured else '❌'}")
    print("-" * 50)

    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level="info"
    )