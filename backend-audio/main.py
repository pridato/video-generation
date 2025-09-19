from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import openai
import base64
import io
import re
from datetime import datetime
import asyncio
from pydub import AudioSegment
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = FastAPI(title="Audio Generation API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios exactos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

if not openai.api_key:
    raise ValueError("OPENAI_API_KEY no está configurada en las variables de entorno")

# Modelos de datos
class SegmentInput(BaseModel):
    texto: str
    tipo: str
    emocion: Optional[str] = "neutral"
    velocidad: Optional[float] = 1.0
    pausa_despues: Optional[float] = 0.5

class EnhancedScript(BaseModel):
    segmentos: Optional[List[SegmentInput]] = None

class AudioGenerationRequest(BaseModel):
    script: str
    voice_id: str
    video_id: str
    enhanced_script: Optional[EnhancedScript] = None

class VoicePreviewRequest(BaseModel):
    voice_id: str
    text: Optional[str] = None
    category: Optional[str] = None

class AudioSegment(BaseModel):
    text: str
    type: str
    emotion: str
    duration: float
    speed: float

class AudioGenerationResponse(BaseModel):
    audio_base64: str
    segments: List[AudioSegment]
    filename: str
    duration: float
    voice_id: str

class VoicePreviewResponse(BaseModel):
    audio_base64: str
    filename: str
    duration: float

# Configuraciones
VOICE_SPEED_SETTINGS = {
    "intro": 0.9,
    "content": 1.0,
    "conclusion": 0.85,
    "transition": 1.1,
    "emphasis": 0.8,
    "question": 0.9
}

AVAILABLE_VOICES = {
    "alloy": {"category": "professional", "gender": "neutral"},
    "echo": {"category": "energetic", "gender": "male"},
    "fable": {"category": "friendly", "gender": "neutral"},
    "onyx": {"category": "dramatic", "gender": "male"},
    "nova": {"category": "energetic", "gender": "female"},
    "shimmer": {"category": "calm", "gender": "female"}
}

PREVIEW_TEXTS = {
    "professional": "Hola, soy tu asistente de voz profesional. Estoy aquí para ayudarte a crear contenido de alta calidad.",
    "energetic": "¡Hola! ¡Soy tu voz llena de energía! ¡Vamos a crear algo increíble juntos!",
    "friendly": "Hola, me alegra conocerte. Soy tu voz amigable y estaré encantada de acompañarte en tus proyectos.",
    "dramatic": "Saludos. Soy la voz que dará vida a tus historias más cautivadoras y dramáticas.",
    "calm": "Hola, soy tu voz tranquila y serena. Perfecto para contenido relajante y meditativo."
}

# Funciones auxiliares
def analyze_script_segments(script: str) -> List[Dict[str, Any]]:
    """Analiza el script y divide en segmentos con entonación variable"""
    sentences = [s.strip() for s in re.split(r'[.!?]+', script) if s.strip()]
    segments = []

    for i, sentence in enumerate(sentences):
        segment_type = determine_segment_type(sentence, i, len(sentences))
        emotion = detect_emotion(sentence)
        speed = VOICE_SPEED_SETTINGS.get(segment_type, 1.0)
        pause_after = calculate_pause(segment_type, i, len(sentences))

        segments.append({
            "text": sentence,
            "type": segment_type,
            "emotion": emotion,
            "speed": speed,
            "pause_after": pause_after
        })

    return segments

def determine_segment_type(text: str, index: int, total: int) -> str:
    """Determina el tipo de segmento basado en posición y contenido"""
    lower_text = text.lower()

    if index == 0:
        return "intro"
    elif index == total - 1:
        return "conclusion"
    elif "?" in text:
        return "question"
    elif any(word in lower_text for word in ["pero", "sin embargo", "además", "ahora", "entonces", "luego"]):
        return "transition"
    elif any(word in lower_text for word in ["importante", "clave", "fundamental", "esencial", "crítico"]) or "!" in text:
        return "emphasis"
    else:
        return "content"

def detect_emotion(text: str) -> str:
    """Detecta la emoción del texto"""
    lower_text = text.lower()

    if any(word in lower_text for word in ["genial", "fantástico", "increíble", "amazing", "excelente"]):
        return "excited"
    elif any(word in lower_text for word in ["importante", "serio", "grave", "crítico", "cuidado"]):
        return "serious"
    elif any(word in lower_text for word in ["hola", "bienvenido", "gracias", "perfecto"]):
        return "friendly"
    elif any(word in lower_text for word in ["misterioso", "secreto", "oculto", "desconocido"]):
        return "mysterious"
    elif any(word in lower_text for word in ["dramático", "intenso", "poderoso", "impactante"]):
        return "dramatic"
    else:
        return "neutral"

def calculate_pause(segment_type: str, index: int, total: int) -> float:
    """Calcula la pausa después del segmento"""
    pause_settings = {
        "intro": 0.8,
        "conclusion": 1.0,
        "emphasis": 0.7,
        "question": 0.6,
        "transition": 0.4,
        "content": 0.5
    }

    pause = pause_settings.get(segment_type, 0.5)

    # Sin pausa después del último segmento
    if index == total - 1:
        pause = 0

    return pause

async def generate_audio_segment(text: str, voice_id: str, speed: float = 1.0) -> bytes:
    """Genera un segmento de audio usando OpenAI TTS"""
    try:
        # Validar velocidad
        speed = max(0.25, min(4.0, speed))

        # Llamar a OpenAI TTS
        response = await openai.audio.speech.acreate(
            model="tts-1-hd",
            voice=voice_id,
            input=text,
            speed=speed
        )

        return response.content

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando audio: {str(e)}")

def combine_audio_segments(audio_segments: List[bytes], pause_durations: List[float]) -> bytes:
    """Combina segmentos de audio con pausas"""
    try:
        combined = AudioSegment.empty()

        for i, segment_audio in enumerate(audio_segments):
            # Cargar segmento de audio
            segment = AudioSegment.from_mp3(io.BytesIO(segment_audio))
            combined += segment

            # Agregar pausa si no es el último segmento
            if i < len(audio_segments) - 1 and pause_durations[i] > 0:
                pause_ms = int(pause_durations[i] * 1000)
                silence = AudioSegment.silent(duration=pause_ms)
                combined += silence

        # Exportar como MP3
        output = io.BytesIO()
        combined.export(output, format="mp3")
        return output.getvalue()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error combinando audio: {str(e)}")

def estimate_duration(segments: List[Dict[str, Any]]) -> float:
    """Estima la duración total del audio"""
    total_duration = 0.0

    for segment in segments:
        # Estimación aproximada: 150 palabras por minuto en español
        words = len(segment["text"].split())
        base_duration = (words / 150) * 60  # en segundos

        # Ajustar por velocidad
        speed_factor = segment.get("speed", 1.0)
        segment_duration = base_duration / speed_factor

        total_duration += segment_duration + segment.get("pause_after", 0)

    return total_duration

# Endpoints
@app.get("/")
async def root():
    return {"message": "Audio Generation API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/generar-audio", response_model=AudioGenerationResponse)
async def generar_audio(request: AudioGenerationRequest):
    """Genera el audio completo para un video"""
    try:
        # Validar voz
        if request.voice_id not in AVAILABLE_VOICES:
            raise HTTPException(status_code=400, detail=f"Voz no válida: {request.voice_id}")

        # Procesar segmentos del script
        if request.enhanced_script and request.enhanced_script.segmentos:
            # Usar segmentos del script mejorado
            segments = []
            for seg in request.enhanced_script.segmentos:
                segments.append({
                    "text": seg.texto,
                    "type": seg.tipo,
                    "emotion": seg.emocion or "neutral",
                    "speed": seg.velocidad or 1.0,
                    "pause_after": seg.pausa_despues or 0.5
                })
        else:
            # Analizar script automáticamente
            segments = analyze_script_segments(request.script)

        print(f"Generando audio para {len(segments)} segmentos con voz {request.voice_id}")

        # Generar audio para cada segmento
        audio_segments = []
        pause_durations = []
        processed_segments = []

        for segment in segments:
            print(f"Procesando: '{segment['text'][:50]}...' (velocidad: {segment['speed']})")

            # Generar audio del segmento
            audio_data = await generate_audio_segment(
                segment["text"],
                request.voice_id,
                segment["speed"]
            )

            audio_segments.append(audio_data)
            pause_durations.append(segment["pause_after"])

            # Estimar duración del segmento
            words = len(segment["text"].split())
            segment_duration = (words / 150) * 60 / segment["speed"]

            processed_segments.append(AudioSegment(
                text=segment["text"],
                type=segment["type"],
                emotion=segment["emotion"],
                duration=segment_duration,
                speed=segment["speed"]
            ))

        # Combinar todos los segmentos
        print("Combinando segmentos de audio...")
        final_audio = combine_audio_segments(audio_segments, pause_durations)

        # Codificar en base64
        audio_base64 = base64.b64encode(final_audio).decode('utf-8')

        # Calcular duración total
        total_duration = estimate_duration(segments)

        # Generar nombre de archivo
        timestamp = int(datetime.now().timestamp())
        filename = f"audio_{request.video_id}_{timestamp}.mp3"

        print(f"✅ Audio generado exitosamente: {len(final_audio)} bytes, {total_duration:.1f}s")

        return AudioGenerationResponse(
            audio_base64=audio_base64,
            segments=processed_segments,
            filename=filename,
            duration=total_duration,
            voice_id=request.voice_id
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en generación de audio: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.post("/generar-preview-voz", response_model=VoicePreviewResponse)
async def generar_preview_voz(request: VoicePreviewRequest):
    """Genera un preview de una voz específica"""
    try:
        # Validar voz
        if request.voice_id not in AVAILABLE_VOICES:
            raise HTTPException(status_code=400, detail=f"Voz no válida: {request.voice_id}")

        # Determinar texto para el preview
        voice_info = AVAILABLE_VOICES[request.voice_id]
        category = request.category or voice_info["category"]
        preview_text = request.text or PREVIEW_TEXTS.get(category, PREVIEW_TEXTS["professional"])

        print(f"Generando preview para voz {request.voice_id}: '{preview_text[:50]}...'")

        # Generar audio
        audio_data = await generate_audio_segment(preview_text, request.voice_id, 1.0)

        # Codificar en base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')

        # Estimar duración
        words = len(preview_text.split())
        duration = (words / 150) * 60  # Aproximación

        filename = f"preview_{request.voice_id}.mp3"

        print(f"✅ Preview generado: {len(audio_data)} bytes, ~{duration:.1f}s")

        return VoicePreviewResponse(
            audio_base64=audio_base64,
            filename=filename,
            duration=duration
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en preview de voz: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.get("/voces-disponibles")
async def get_voces_disponibles():
    """Retorna las voces disponibles"""
    return {
        "voices": AVAILABLE_VOICES,
        "total": len(AVAILABLE_VOICES)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)