# Backend de Generación de Audio

Backend Python con FastAPI para generar audio usando OpenAI TTS con análisis inteligente de scripts y entonación variable.

## 🚀 Instalación

### 1. Crear entorno virtual

```bash
cd backend-audio
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tu API key de OpenAI:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Ejecutar servidor

```bash
python main.py
```

O con uvicorn directamente:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

El servidor estará disponible en: `http://localhost:8000`

## 📡 Endpoints

### `POST /generar-audio`

Genera audio completo para un video con análisis de segmentos.

**Request:**
```json
{
  "script": "Hola, bienvenidos a este tutorial. Hoy aprenderemos React. ¡Es increíble!",
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

**Response:**
```json
{
  "audio_base64": "UklGRiQAAABXQVZFZm10...",
  "segments": [...],
  "filename": "audio_uuid_timestamp.mp3",
  "duration": 45.2,
  "voice_id": "alloy"
}
```

### `POST /generar-preview-voz`

Genera preview de una voz específica.

**Request:**
```json
{
  "voice_id": "alloy",
  "text": "Texto opcional personalizado",
  "category": "professional"
}
```

**Response:**
```json
{
  "audio_base64": "UklGRiQAAABXQVZFZm10...",
  "filename": "preview_alloy.mp3",
  "duration": 5.1
}
```

### `GET /voces-disponibles`

Lista todas las voces disponibles.

### `GET /health`

Health check del servidor.

## 🎯 Características

### Análisis Inteligente de Scripts

El backend analiza automáticamente el script y detecta:

- **Tipos de segmento**: intro, content, conclusion, transition, emphasis, question
- **Emociones**: neutral, excited, serious, friendly, mysterious, dramatic
- **Velocidades**: Ajustadas según el tipo de segmento
- **Pausas**: Calculadas según contexto y posición

### Voces Disponibles

- **alloy**: Profesional (neutral)
- **echo**: Enérgica (masculina)
- **fable**: Amigable (neutral)
- **onyx**: Dramática (masculina)
- **nova**: Juvenil (femenina)
- **shimmer**: Calmada (femenina)

### Configuración de Velocidades

```python
VOICE_SPEED_SETTINGS = {
    "intro": 0.9,        # Más lenta para introducción
    "content": 1.0,      # Velocidad normal
    "conclusion": 0.85,  # Más lenta para conclusión
    "transition": 1.1,   # Más rápida para transiciones
    "emphasis": 0.8,     # Más lenta para énfasis
    "question": 0.9      # Ligeramente más lenta para preguntas
}
```

## 🔧 Desarrollo

### Estructura del Proyecto

```
backend-audio/
├── main.py              # Aplicación principal FastAPI
├── requirements.txt     # Dependencias Python
├── .env.example        # Ejemplo de variables de entorno
├── .env               # Variables de entorno (no versionar)
└── README.md          # Este archivo
```

### Logging

El servidor imprime logs detallados:

```
Generando audio para 3 segmentos con voz alloy
Procesando: 'Hola, bienvenidos a este tutorial...' (velocidad: 0.9)
Procesando: 'Hoy aprenderemos React...' (velocidad: 1.0)
Procesando: '¡Es increíble lo que podemos hacer!' (velocidad: 0.8)
Combinando segmentos de audio...
✅ Audio generado exitosamente: 245632 bytes, 15.3s
```

### Testing

Puedes probar los endpoints usando curl o la documentación automática de FastAPI en `http://localhost:8000/docs`

**Ejemplo con curl:**
```bash
curl -X POST "http://localhost:8000/generar-preview-voz" \
  -H "Content-Type: application/json" \
  -d '{"voice_id": "alloy", "category": "professional"}'
```

## 🐳 Docker (Opcional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔒 Seguridad

- Las API keys se manejan via variables de entorno
- CORS configurado (ajustar para producción)
- Validación de parámetros con Pydantic
- Rate limiting recomendado para producción

## 📈 Monitoreo

- Health check en `/health`
- Logs detallados de procesamiento
- Manejo de errores con códigos HTTP apropiados

## 🚀 Producción

Para desplegar en producción:

1. Configurar variables de entorno de producción
2. Usar servidor ASGI como Gunicorn + Uvicorn
3. Configurar rate limiting
4. Implementar logging estructurado
5. Configurar monitoreo y alertas