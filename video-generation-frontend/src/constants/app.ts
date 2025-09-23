/**
 * Application Configuration Constants
 */
import { FileText, Wand2, Palette, Mic, Clapperboard } from 'lucide-react'

// Application Info
export const APP_CONFIG = {
  NAME: 'Video Generation SaaS',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered video generation platform',
  AUTHOR: 'Video Generation Team',
  SUPPORT_EMAIL: 'support@videogeneration.com',
} as const

// Environment
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
  CURRENT: process.env.NODE_ENV || 'development',
} as const

// Application Limits
export const LIMITS = {
  SCRIPT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
    MAX_SEGMENTS: 10,
  },
  AUDIO: {
    MAX_DURATION: 300, // 5 minutes
    MIN_DURATION: 5,   // 5 seconds
  },
  VIDEO: {
    MAX_CLIPS: 20,
    MIN_CLIPS: 1,
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  },
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['mp4', 'mov', 'avi', 'webm'],
  },
} as const

// Video Creation Steps
export const CREATION_STEPS = [
  { id: 1, title: 'Script', icon: FileText, description: 'Ingresa tu script inicial' },
  { id: 2, title: 'IA', icon: Wand2, description: 'Mejora automática con IA' },
  { id: 3, title: 'Voz + Clips', icon: Mic, description: 'Selecciona voz y clips visuales' },
  { id: 4, title: 'Resumen', icon: Clapperboard, description: 'Revisa y genera tu video' }
] as const

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  DRAFT_SCRIPT: 'draft_script',
  SELECTED_TEMPLATE: 'selected_template',
  SELECTED_VOICE: 'selected_voice',
  THEME: 'theme',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const

// Default Values
export const DEFAULTS = {
  LANGUAGE: 'es',
  THEME: 'light',
  VOICE_SPEED: 1.0,
  VIDEO_QUALITY: 'medium',
  TEMPLATE_CATEGORY: 'education',
} as const

// UI Constants
export const UI_CONFIG = {
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  SKELETON_ANIMATION_DURATION: 1000,
  MAX_SEARCH_RESULTS: 50,
  PAGINATION_SIZE: 12,
} as const

// Feature Flags
export const FEATURES = {
  ANALYTICS: true,
  PREMIUM_TEMPLATES: true,
  VOICE_CLONING: false,
  BATCH_GENERATION: false,
  API_ACCESS: false,
  TEAM_COLLABORATION: false,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Ha ocurrido un error inesperado',
  NETWORK: 'Error de conexión. Verifica tu internet',
  TIMEOUT: 'La solicitud ha tardado demasiado',
  UNAUTHORIZED: 'No tienes permisos para esta acción',
  FORBIDDEN: 'Acceso denegado',
  NOT_FOUND: 'Recurso no encontrado',
  VALIDATION: 'Los datos ingresados no son válidos',
  RATE_LIMIT: 'Has excedido el límite de solicitudes',
  FILE_TOO_LARGE: 'El archivo es demasiado grande',
  UNSUPPORTED_FORMAT: 'Formato de archivo no compatible',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  SCRIPT_ENHANCED: 'Script mejorado exitosamente',
  AUDIO_GENERATED: 'Audio generado correctamente',
  VIDEO_CREATED: 'Video creado exitosamente',
  SETTINGS_SAVED: 'Configuración guardada',
  FILE_UPLOADED: 'Archivo subido correctamente',
} as const