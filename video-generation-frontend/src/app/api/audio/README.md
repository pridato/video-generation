# API de Generación de Audio

Sistema completo para la generación de audio con voces sintéticas. El frontend Next.js actúa como proxy hacia el backend Python que maneja OpenAI TTS con soporte para entonación variable y análisis inteligente de scripts.

## Endpoints Disponibles

### 1. `POST /api/audio/generate`

Genera el audio completo para un video, aplicando entonación variable según el contenido del script. Este endpoint hace una llamada al backend Python que maneja OpenAI TTS.

#### Request Body
```typescript
{
  script: string           // Script del video
  voiceId: string         // ID de la voz a usar (ej: "alexa", "carlos")
  videoId: string         // ID del video en la base de datos
  userId: string          // ID del usuario
  enhancedScript?: {      // Script mejorado (opcional)
    segmentos?: Array<{
      texto: string
      tipo: string
      emocion?: string
      velocidad?: number
      pausa_despues?: number
    }>
  }
}
```

#### Response
```typescript
{
  success: true,
  audio: {
    url: string,          // URL del archivo MP3 generado
    filename: string,     // Nombre del archivo
    segments_count: number,
    voice_id: string
  },
  segments: Array<{       // Información de segmentos procesados
    text: string,
    type: string,
    emotion: string
  }>,
  message: string
}
```

#### Ejemplo de Uso
```javascript
const response = await fetch('/api/audio/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    script: "Hola, bienvenidos a este tutorial. Hoy aprenderemos React. ¡Es increíble lo que podemos hacer!",
    voiceId: "alloy",
    videoId: "video-123",
    userId: "user-456"
  })
})

const result = await response.json()
console.log('Audio URL:', result.audio.url)
```

### 2. `GET /api/voices/preview`

Obtiene la lista de voces disponibles con sus características.

#### Query Parameters
- `category` (opcional): Filtrar por categoría (professional, energetic, friendly, dramatic, calm)
- `language` (opcional): Idioma de las voces (default: 'es')

#### Response
```typescript
{
  voices: Array<{
    id: string,
    name: string,
    category: string,
    gender: string,
    age_range: string,
    description: string,
    accent?: string,
    preview_available: boolean
  }>,
  total: number,
  language: string,
  categories: string[]
}
```

### 3. `POST /api/voices/preview`

Genera un preview de audio para una voz específica. Este endpoint hace una llamada al backend Python.

#### Request Body
```typescript
{
  voiceId: string,       // ID de la voz
  text?: string,         // Texto personalizado (opcional)
  category?: string      // Categoría para texto automático (opcional)
}
```

#### Response
Retorna directamente el archivo de audio MP3 con headers:
- `Content-Type: audio/mpeg`
- `X-Voice-Profile`: Nombre de la voz
- `X-Voice-Category`: Categoría de la voz

## Voces Disponibles (OpenAI TTS)

### Alloy (Professional)
- **ID**: `alloy`
- **Género**: Neutral
- **Categoría**: Professional
- **Descripción**: Voz profesional y clara, ideal para contenido educativo y corporativo

### Echo (Energetic)
- **ID**: `echo`
- **Género**: Masculino
- **Categoría**: Energetic
- **Descripción**: Voz enérgica y dinámica, perfecta para contenido motivacional

### Fable (Friendly)
- **ID**: `fable`
- **Género**: Neutral
- **Categoría**: Friendly
- **Descripción**: Voz amigable y cálida, ideal para tutoriales y contenido casual

### Onyx (Dramatic)
- **ID**: `onyx`
- **Género**: Masculino
- **Categoría**: Dramatic
- **Descripción**: Voz profunda y dramática, perfecta para narrativas y documentales

### Nova (Energetic)
- **ID**: `nova`
- **Género**: Femenino
- **Categoría**: Energetic
- **Descripción**: Voz juvenil y vibrante, ideal para contenido dinámico y entretenido

### Shimmer (Calm)
- **ID**: `shimmer`
- **Género**: Femenino
- **Categoría**: Calm
- **Descripción**: Voz suave y relajante, perfecta para contenido meditativo y ASMR

## Análisis Inteligente de Scripts

El sistema analiza automáticamente el script y aplica diferentes entonaciones:

### Tipos de Segmentos
- **intro**: Introducción del video (más lenta, amigable)
- **content**: Contenido principal (velocidad normal)
- **conclusion**: Conclusión del video (más lenta, seria)
- **transition**: Transiciones entre temas (más rápida)
- **emphasis**: Partes importantes (más lenta, énfasis)
- **question**: Preguntas al público (interrogativa)

### Emociones Detectadas
- **neutral**: Tono neutral estándar
- **excited**: Emocionado (palabras como "genial", "increíble")
- **serious**: Serio (palabras como "importante", "crítico")
- **friendly**: Amigable (saludos, agradecimientos)
- **dramatic**: Dramático (palabras intensas)
- **mysterious**: Misterioso (contenido enigmático)

### Configuración Automática

```typescript
// Ejemplo de segmento analizado automáticamente
{
  text: "¡Esto es increíble!",
  type: "emphasis",      // Detectado por "!"
  emotion: "excited",    // Detectado por "increíble"
  speed: 0.8,           // Más lento para énfasis
  pause_after: 0.7       // Pausa más larga después del énfasis
}
```

## Variables de Entorno Requeridas

### Frontend (Next.js)
```env
BACKEND_URL=http://localhost:8000  # URL del backend Python
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### Backend (Python)
```env
OPENAI_API_KEY=your_openai_api_key
# Otras configuraciones del backend...
```

## Storage y Base de Datos

### Supabase Storage
- **Bucket**: `video-assets`
- **Carpeta**: `audio/`
- **Formato**: `audio_{videoId}_{timestamp}.mp3`

### Tabla Videos (actualizada)
```sql
ALTER TABLE videos ADD COLUMN audio_url TEXT;
ALTER TABLE videos ADD COLUMN audio_segments JSONB;
ALTER TABLE videos ADD COLUMN voice_settings JSONB;
```

## Arquitectura del Sistema

```
Frontend (Next.js) → Backend (Python) → OpenAI TTS
                 ↓
             Supabase Storage
```

### Flujo de Generación de Audio

1. **Frontend**: Recibe request del usuario
2. **Validación**: Verifica video y permisos en Supabase
3. **Backend Python**: Procesa script y genera audio con OpenAI TTS
4. **Respuesta**: Backend retorna audio como base64
5. **Storage**: Frontend sube audio a Supabase Storage
6. **Database**: Actualiza video con URL del audio

## Ejemplo de Implementación Completa

```typescript
// 1. Obtener voces disponibles
const voicesResponse = await fetch('/api/voices/preview?category=professional')
const { voices } = await voicesResponse.json()

// 2. Preview de voz (se procesa en backend Python)
const previewResponse = await fetch('/api/voices/preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ voiceId: 'alloy' })
})

// 3. Generar audio completo (se procesa en backend Python)
const audioResponse = await fetch('/api/audio/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    script: scriptContent,
    voiceId: selectedVoiceId,
    videoId: currentVideoId,
    userId: currentUserId
  })
})

const { audio } = await audioResponse.json()
console.log('Audio generado:', audio.url)
```

## Manejo de Errores

### Códigos de Error Comunes
- `400`: Campos requeridos faltantes
- `404`: Voz o video no encontrado
- `502`: Error en backend Python o OpenAI TTS API
- `503`: Backend no disponible

### Respuestas de Error
```typescript
{
  error: string,         // Mensaje de error
  details?: string       // Detalles adicionales (solo en desarrollo)
}
```

## Limitaciones y Consideraciones

1. **Rate Limits**: OpenAI TTS tiene límites de API según el plan
2. **Tamaño de Audio**: Los archivos se almacenan en Supabase Storage
3. **Idioma**: OpenAI TTS soporta múltiples idiomas automáticamente
4. **Duración**: Scripts muy largos pueden requerir procesamiento adicional
5. **Calidad**: Usa modelo `tts-1-hd` para mejor calidad de audio

## Próximas Mejoras

- [ ] Soporte para más idiomas
- [ ] Clonación de voz personalizada
- [ ] Efectos de audio adicionales
- [ ] Sincronización con subtítulos
- [ ] Análisis de sentimientos más avanzado