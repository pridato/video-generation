# Especificación del Backend Python para Audio

El backend Python debe implementar estos endpoints para manejar la generación de audio con OpenAI TTS.

## Endpoints Requeridos

### 1. `POST /generar-audio`

Genera el audio completo para un video con análisis de segmentos y entonación variable.

#### Request Body
```json
{
  "script": "Script completo del video",
  "voice_id": "alloy",
  "video_id": "uuid-del-video",
  "enhanced_script": {
    "segmentos": [
      {
        "texto": "Hola, bienvenidos",
        "tipo": "intro",
        "emocion": "friendly",
        "velocidad": 0.9,
        "pausa_despues": 0.8
      }
    ]
  }
}
```

#### Response
```json
{
  "audio_base64": "UklGRiQAAABXQVZFZm10...",
  "segments": [
    {
      "text": "Hola, bienvenidos",
      "type": "intro",
      "emotion": "friendly",
      "duration": 2.5,
      "speed": 0.9
    }
  ],
  "filename": "audio_uuid_timestamp.mp3",
  "duration": 45.2,
  "voice_id": "alloy"
}
```

### 2. `POST /generar-preview-voz`

Genera un preview corto de una voz específica.

#### Request Body
```json
{
  "voice_id": "alloy",
  "text": "Hola, soy tu asistente de voz profesional...",
  "category": "professional"
}
```

#### Response
```json
{
  "audio_base64": "UklGRiQAAABXQVZFZm10...",
  "filename": "preview_alloy.mp3",
  "duration": 5.1
}
```

## Lógica de Procesamiento

### Análisis de Segmentos

El backend debe implementar análisis inteligente del script si no se proporciona `enhanced_script`:

```python
def analyze_script_segments(script: str) -> List[Segment]:
    sentences = script.split(/[.!?]+/)
    segments = []

    for i, sentence in enumerate(sentences):
        segment = {
            "text": sentence.strip(),
            "type": determine_segment_type(sentence, i, len(sentences)),
            "emotion": detect_emotion(sentence),
            "speed": calculate_speed(sentence, segment_type),
            "pause_after": calculate_pause(segment_type, i, len(sentences))
        }
        segments.append(segment)

    return segments
```

### Configuración de Velocidades por Tipo

```python
VOICE_SPEED_SETTINGS = {
    "intro": 0.9,
    "content": 1.0,
    "conclusion": 0.85,
    "transition": 1.1,
    "emphasis": 0.8
}
```

### Generación con OpenAI TTS

```python
async def generate_audio_segment(text: str, voice_id: str, speed: float):
    response = await openai.audio.speech.acreate(
        model="tts-1-hd",
        voice=voice_id,
        input=text,
        speed=max(0.25, min(4.0, speed))
    )
    return response.content
```

### Combinación de Segmentos

El backend debe:
1. Generar cada segmento por separado
2. Agregar pausas entre segmentos (silencio)
3. Combinar todos en un archivo MP3 final
4. Retornar como base64

```python
def combine_audio_segments(segments: List[bytes], pauses: List[float]) -> bytes:
    # Usar pydub o similar para combinar audio
    combined = AudioSegment.empty()

    for i, segment_audio in enumerate(segments):
        segment = AudioSegment.from_mp3(io.BytesIO(segment_audio))
        combined += segment

        # Agregar pausa si no es el último segmento
        if i < len(segments) - 1:
            pause_ms = int(pauses[i] * 1000)
            silence = AudioSegment.silent(duration=pause_ms)
            combined += silence

    # Exportar como MP3
    output = io.BytesIO()
    combined.export(output, format="mp3")
    return output.getvalue()
```

## Variables de Entorno

```env
OPENAI_API_KEY=your_openai_api_key
```

## Dependencias Sugeridas

```bash
pip install openai pydub fastapi uvicorn
```

## Manejo de Errores

El backend debe manejar estos errores:

- **OpenAI API Rate Limits**: Implementar retry logic
- **Texto demasiado largo**: Dividir en chunks si es necesario
- **Voz no válida**: Validar voice_id contra voces disponibles
- **Error de conversión de audio**: Logs detallados para debug

## Estructura de Respuesta de Error

```json
{
  "detail": "Descripción del error",
  "error_code": "OPENAI_API_ERROR",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Optimizaciones Recomendadas

1. **Cache**: Cachear previews de voces comunes
2. **Async**: Usar async/await para llamadas a OpenAI
3. **Queue**: Sistema de cola para procesamiento en batch
4. **Monitoring**: Logs de rendimiento y errores
5. **Rate Limiting**: Control de requests por usuario

## Voces Disponibles (OpenAI TTS)

```python
AVAILABLE_VOICES = {
    "alloy": {"category": "professional", "gender": "neutral"},
    "echo": {"category": "energetic", "gender": "male"},
    "fable": {"category": "friendly", "gender": "neutral"},
    "onyx": {"category": "dramatic", "gender": "male"},
    "nova": {"category": "energetic", "gender": "female"},
    "shimmer": {"category": "calm", "gender": "female"}
}
```