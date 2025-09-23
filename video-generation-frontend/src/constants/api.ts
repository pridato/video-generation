/**
 * API Configuration Constants
 */

// API Base URLs
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  VERSION: 'v1',
  TIMEOUT: 10000, // 10 seconds
} as const

// API Endpoints - Updated for new backend structure
export const API_ENDPOINTS = {
  // Health
  HEALTH: '/api/v1/health',

  // Script Enhancement
  SCRIPT: {
    ENHANCE: '/api/v1/mejorar-script',
  },

  // Audio Generation
  AUDIO: {
    GENERATE: '/api/v1/generar-voz',
  },

  // Clips Management
  CLIPS: {
    SELECT: '/api/v1/seleccionar-clips',
    SEARCH: '/api/v1/buscar-clips',
  },

  // Video Generation
  VIDEO: {
    GENERATE: '/api/v1/generar-video',
  },

  // Legacy endpoints (for migration)
  LEGACY: {
    VOICES_PREVIEW: '/api/voices/preview',
  }
} as const

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const

// Request Headers
export const HEADERS = {
  CONTENT_TYPE: {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
  },
  ACCEPT: 'application/json',
  AUTHORIZATION: 'Authorization',
} as const

// Request Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const