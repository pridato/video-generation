/**
 * Video Processing and Settings Constants
 */

// Video Settings
export const VIDEO_SETTINGS = {
  RESOLUTIONS: [
    { value: '720p', width: 1280, height: 720, label: 'HD (720p)' },
    { value: '1080p', width: 1920, height: 1080, label: 'Full HD (1080p)' },
    { value: '4k', width: 3840, height: 2160, label: 'Ultra HD (4K)' }
  ],
  FPS_OPTIONS: [
    { value: 24, label: '24 FPS', description: 'Estándar cinematográfico' },
    { value: 30, label: '30 FPS', description: 'Estándar web' },
    { value: 60, label: '60 FPS', description: 'Alta fluidez' }
  ],
  FORMATS: [
    { value: 'mp4', label: 'MP4', description: 'Máxima compatibilidad' },
    { value: 'webm', label: 'WebM', description: 'Optimizado para web' },
    { value: 'mov', label: 'MOV', description: 'Calidad profesional' }
  ],
  QUALITY_PRESETS: [
    { value: 'draft', label: 'Borrador', bitrate: '500k', description: 'Procesamiento rápido' },
    { value: 'standard', label: 'Estándar', bitrate: '1500k', description: 'Balance calidad/tamaño' },
    { value: 'high', label: 'Alta', bitrate: '3000k', description: 'Máxima calidad' }
  ]
} as const

// Video Processing Status
export const VIDEO_STATUS = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  QUEUED: 'queued',
  CANCELLED: 'cancelled',
} as const

// Video Processing Steps
export const PROCESSING_STEPS = [
  { id: 'script', label: 'Procesando script', duration: 5 },
  { id: 'audio', label: 'Generando audio', duration: 15 },
  { id: 'clips', label: 'Seleccionando clips', duration: 10 },
  { id: 'assembly', label: 'Ensamblando video', duration: 20 },
  { id: 'rendering', label: 'Renderizando', duration: 25 },
  { id: 'upload', label: 'Subiendo archivo', duration: 10 },
  { id: 'complete', label: 'Completado', duration: 0 }
] as const

// Video Durations
export const VIDEO_DURATIONS = {
  SHORT: { min: 15, max: 30, label: 'Corto (15-30s)', recommended: true },
  MEDIUM: { min: 31, max: 60, label: 'Medio (31-60s)', recommended: true },
  LONG: { min: 61, max: 120, label: 'Largo (1-2min)', recommended: false },
  EXTENDED: { min: 121, max: 300, label: 'Extendido (2-5min)', recommended: false }
} as const

// Aspect Ratios
export const ASPECT_RATIOS = {
  SQUARE: { value: '1:1', width: 1080, height: 1080, label: 'Cuadrado (Instagram)' },
  VERTICAL: { value: '9:16', width: 1080, height: 1920, label: 'Vertical (TikTok, Shorts)' },
  HORIZONTAL: { value: '16:9', width: 1920, height: 1080, label: 'Horizontal (YouTube)' },
  STORY: { value: '9:16', width: 1080, height: 1920, label: 'Stories (Instagram, Facebook)' }
} as const

// Export Platforms
export const EXPORT_PLATFORMS = {
  YOUTUBE: {
    id: 'youtube',
    name: 'YouTube Shorts',
    aspectRatio: '9:16',
    maxDuration: 60,
    recommendedResolution: '1080p',
    recommendedBitrate: '2500k'
  },
  TIKTOK: {
    id: 'tiktok',
    name: 'TikTok',
    aspectRatio: '9:16',
    maxDuration: 180,
    recommendedResolution: '1080p',
    recommendedBitrate: '2000k'
  },
  INSTAGRAM: {
    id: 'instagram',
    name: 'Instagram Reels',
    aspectRatio: '9:16',
    maxDuration: 90,
    recommendedResolution: '1080p',
    recommendedBitrate: '2000k'
  },
  FACEBOOK: {
    id: 'facebook',
    name: 'Facebook Stories',
    aspectRatio: '9:16',
    maxDuration: 60,
    recommendedResolution: '1080p',
    recommendedBitrate: '1500k'
  },
  CUSTOM: {
    id: 'custom',
    name: 'Personalizado',
    aspectRatio: 'custom',
    maxDuration: 300,
    recommendedResolution: '1080p',
    recommendedBitrate: '3000k'
  }
} as const

// Subtitle Settings
export const SUBTITLE_SETTINGS = {
  FONTS: [
    { value: 'arial', label: 'Arial', category: 'sans-serif' },
    { value: 'helvetica', label: 'Helvetica', category: 'sans-serif' },
    { value: 'roboto', label: 'Roboto', category: 'sans-serif' },
    { value: 'open-sans', label: 'Open Sans', category: 'sans-serif' },
    { value: 'montserrat', label: 'Montserrat', category: 'sans-serif' }
  ],
  SIZES: [
    { value: 'small', label: 'Pequeño', px: 24 },
    { value: 'medium', label: 'Mediano', px: 32 },
    { value: 'large', label: 'Grande', px: 40 },
    { value: 'xl', label: 'Extra Grande', px: 48 }
  ],
  POSITIONS: [
    { value: 'bottom', label: 'Abajo', y: 0.85 },
    { value: 'center', label: 'Centro', y: 0.5 },
    { value: 'top', label: 'Arriba', y: 0.15 }
  ],
  STYLES: [
    { value: 'none', label: 'Sin borde' },
    { value: 'outline', label: 'Contorno' },
    { value: 'shadow', label: 'Sombra' },
    { value: 'background', label: 'Fondo' }
  ]
} as const

// Clip Selection Criteria
export const CLIP_CRITERIA = {
  RELEVANCE: {
    weight: 0.4,
    description: 'Relevancia del contenido visual'
  },
  QUALITY: {
    weight: 0.3,
    description: 'Calidad técnica del clip'
  },
  DURATION: {
    weight: 0.2,
    description: 'Duración apropiada'
  },
  ENGAGEMENT: {
    weight: 0.1,
    description: 'Potencial de engagement'
  }
} as const

// File Size Limits
export const FILE_LIMITS = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_FORMATS: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
  AUDIO_FORMATS: ['mp3', 'wav', 'aac', 'm4a'],
  IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp', 'gif']
} as const