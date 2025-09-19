#!/usr/bin/env python3
"""
Script independiente para generar previews de voz usando OpenAI TTS-1-HD
Guarda archivos MP3 estáticos en el directorio public/audio del frontend
"""

import os
import sys
from pathlib import Path
from openai import OpenAI

# Configuración
PREVIEW_TEXT = "Hola, soy tu asistente de inteligencia artificial. Voy a ayudarte a crear videos increíbles en segundos."

# Configuración de voces con nombres en español
VOICES_CONFIG = {
    'alloy': {
        'name': 'Alexa',
        'description': 'Voz equilibrada y versátil'
    },
    'echo': {
        'name': 'Eco',
        'description': 'Voz masculina clara y profesional'
    },
    'fable': {
        'name': 'Fábula',
        'description': 'Voz narrativa cálida para storytelling'
    },
    'onyx': {
        'name': 'Ónix',
        'description': 'Voz profunda y autoritaria'
    },
    'nova': {
        'name': 'Nova',
        'description': 'Voz femenina joven y energética'
    },
    'shimmer': {
        'name': 'Brillo',
        'description': 'Voz suave y elegante'
    }
}


def setup_directories():
    """
    Configura los directorios necesarios
    """
    # Buscar el directorio del frontend
    script_dir = Path(__file__).parent
    frontend_dir = script_dir / "video-generation-frontend"

    if not frontend_dir.exists():
        print("❌ Error: Directorio 'video-generation-frontend' no encontrado")
        print("   Ejecuta este script desde el directorio raíz del proyecto")
        sys.exit(1)

    # Crear directorio de audio si no existe
    audio_dir = frontend_dir / "public" / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    return audio_dir


def generate_voice_preview(client: OpenAI, voice_id: str, audio_dir: Path) -> bool:
    """
    Genera un preview de voz específico

    Args:
        client: Cliente de OpenAI configurado
        voice_id: ID de la voz de OpenAI
        audio_dir: Directorio donde guardar el archivo

    Returns:
        True si se generó exitosamente, False en caso contrario
    """
    voice_info = VOICES_CONFIG[voice_id]

    print(f"🎤 Generando preview para {voice_info['name']} ({voice_id})...")
    print(f"   📝 {voice_info['description']}")

    try:
        # Generar audio con OpenAI TTS-1-HD
        from typing import cast, Literal
        response = client.audio.speech.create(
            model="tts-1-hd",
            voice=cast(Literal['alloy', 'echo', 'fable',
                       'onyx', 'nova', 'shimmer'], voice_id),
            input=PREVIEW_TEXT,
            response_format="mp3"
        )

        # Guardar archivo
        file_path = audio_dir / f"{voice_id}-preview.mp3"

        with open(file_path, "wb") as f:
            f.write(response.content)

        file_size = file_path.stat().st_size / 1024  # KB
        print(f"   ✅ Guardado: {file_path} ({file_size:.1f} KB)")
        return True

    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False


def main():
    """
    Función principal del script
    """
    print("🎵 Generador de Previews de Voz - OpenAI TTS-1-HD")
    print("=" * 60)
    print(f"📝 Texto: {PREVIEW_TEXT}")
    print("-" * 60)

    # Verificar API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: Variable de entorno OPENAI_API_KEY no encontrada")
        print("   Configura tu API key:")
        print("   export OPENAI_API_KEY=tu_api_key_aqui")
        sys.exit(1)

    # Configurar directorios
    try:
        audio_dir = setup_directories()
        print(f"📁 Directorio de salida: {audio_dir}")
        print("-" * 60)
    except Exception as e:
        print(f"❌ Error configurando directorios: {e}")
        sys.exit(1)

    # Inicializar cliente de OpenAI
    try:
        client = OpenAI(api_key=api_key)
    except Exception as e:
        print(f"❌ Error inicializando cliente OpenAI: {e}")
        sys.exit(1)

    # Generar previews para cada voz
    success_count = 0
    total_voices = len(VOICES_CONFIG)

    for voice_id in VOICES_CONFIG.keys():
        if generate_voice_preview(client, voice_id, audio_dir):
            success_count += 1
        print()  # Línea en blanco entre voces

    # Resumen final
    print("=" * 60)
    print(
        f"🎯 Generación completada: {success_count}/{total_voices} previews creados")

    if success_count == total_voices:
        print("✅ ¡Todos los previews se generaron exitosamente!")
        print(f"📁 Archivos guardados en: {audio_dir}")
        print("\n🚀 Ahora puedes usar los previews en tu aplicación frontend")
    else:
        print("⚠️  Algunos previews no se pudieron generar")
        print("   Revisa los errores anteriores y vuelve a intentar")

    print("\n🎵 ¡Listo para crear videos increíbles!")


if __name__ == "__main__":
    main()
