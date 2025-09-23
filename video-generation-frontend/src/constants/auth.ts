/**
 * Authentication Constants
 */

// Auth Providers
export const AUTH_PROVIDERS = {
  EMAIL: 'email',
  GOOGLE: 'google',
  GITHUB: 'github',
  DISCORD: 'discord',
} as const

// Auth Errors
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  EMAIL_NOT_VERIFIED: 'Email no verificado',
  USER_NOT_FOUND: 'Usuario no encontrado',
  EMAIL_ALREADY_REGISTERED: 'Email ya registrado',
  WEAK_PASSWORD: 'Contraseña muy débil',
  PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
  SESSION_EXPIRED: 'Sesión expirada',
  ACCESS_DENIED: 'Acceso denegado',
  SIGNUP_DISABLED: 'Registro deshabilitado',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos de inicio de sesión',
} as const

// Auth Success Messages
export const AUTH_SUCCESS = {
  SIGNUP_SUCCESS: 'Cuenta creada exitosamente',
  LOGIN_SUCCESS: 'Sesión iniciada correctamente',
  LOGOUT_SUCCESS: 'Sesión cerrada',
  PASSWORD_RESET_SENT: 'Email de recuperación enviado',
  PASSWORD_UPDATED: 'Contraseña actualizada',
  EMAIL_VERIFIED: 'Email verificado exitosamente',
  PROFILE_UPDATED: 'Perfil actualizado',
} as const

// Auth Validation
export const AUTH_VALIDATION = {
  EMAIL: {
    REQUIRED: 'Email requerido',
    INVALID: 'Email inválido',
    MAX_LENGTH: 320,
  },
  PASSWORD: {
    REQUIRED: 'Contraseña requerida',
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    MUST_CONTAIN: 'Debe contener al menos una mayúscula, una minúscula y un número',
  },
  NAME: {
    REQUIRED: 'Nombre requerido',
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    INVALID_CHARACTERS: 'Solo letras y espacios permitidos',
  },
} as const

// Auth Redirects
export const AUTH_REDIRECTS = {
  AFTER_LOGIN: '/dashboard',
  AFTER_LOGOUT: '/',
  AFTER_SIGNUP: '/onboarding',
  AFTER_EMAIL_VERIFICATION: '/dashboard',
  LOGIN_REQUIRED: '/auth/login',
} as const

// Session Configuration
export const SESSION_CONFIG = {
  DURATION: 24 * 60 * 60, // 24 hours in seconds
  REFRESH_THRESHOLD: 5 * 60, // 5 minutes in seconds
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60, // 30 days in seconds
} as const

// OAuth Configuration
export const OAUTH_CONFIG = {
  SCOPES: {
    GOOGLE: ['email', 'profile'],
    GITHUB: ['user:email'],
    DISCORD: ['identify', 'email'],
  },
  REDIRECT_URL: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
} as const