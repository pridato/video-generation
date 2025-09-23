/**
 * Application Routes Constants
 */

// Public Routes
export const PUBLIC_ROUTES = {
  HOME: '/',
  PRICING: '/pricing',
  HELP: '/help',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const

// Auth Routes
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  CALLBACK: '/auth/callback',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
} as const

// Protected Routes
export const PROTECTED_ROUTES = {
  DASHBOARD: '/dashboard',
  CREATE: '/create',
  LIBRARY: '/library',
  TEMPLATES: '/templates',
  VIDEO_PREVIEW: '/video-preview',
  SETTINGS: '/settings',
  ANALYTICS: '/analytics',
  CREDITS: {
    ACTUAL: '/credits/actual-credits',
    PURCHASE: '/credits/purchase-credits',
  },
  PAYMENT_SUCCESS: '/payment-success',
} as const

// Onboarding Routes
export const ONBOARDING_ROUTES = {
  WELCOME: '/onboarding',
  PROFILE_SETUP: '/onboarding/profile',
  PLAN_SELECTION: '/onboarding/plan',
  TUTORIAL: '/onboarding/tutorial',
  COMPLETE: '/onboarding/complete',
} as const

// API Routes
export const API_ROUTES = {
  AUTH: {
    CALLBACK: '/api/auth/callback',
  },
  AUDIO: {
    GENERATE: '/api/audio/generate',
  },
  VIDEOS: {
    CREATE: '/api/videos/create',
  },
  VOICES: {
    PREVIEW: '/api/voices/preview',
  },
  CREDITS: {
    PURCHASE: '/api/credits/purchase',
  },
  STRIPE: {
    CHECKOUT: '/api/stripe/checkout',
    PORTAL: '/api/stripe/portal',
    WEBHOOK: '/api/stripe/webhook',
  },
  PAYMENT: {
    VERIFY: '/api/payment/verify',
  },
  WEBHOOKS: {
    STRIPE: '/api/webhooks/stripe',
  },
} as const

// External Routes
export const EXTERNAL_ROUTES = {
  DOCUMENTATION: 'https://docs.videogeneration.com',
  SUPPORT: 'https://support.videogeneration.com',
  BLOG: 'https://blog.videogeneration.com',
  GITHUB: 'https://github.com/videogeneration',
  TWITTER: 'https://twitter.com/videogeneration',
  DISCORD: 'https://discord.gg/videogeneration',
} as const

// Route Groups for Authorization
export const ROUTE_GROUPS = {
  PUBLIC: Object.values(PUBLIC_ROUTES),
  AUTH: Object.values(AUTH_ROUTES),
  PROTECTED: [
    ...Object.values(PROTECTED_ROUTES).filter(route => typeof route === 'string'),
    ...Object.values(PROTECTED_ROUTES.CREDITS),
  ],
  ONBOARDING: Object.values(ONBOARDING_ROUTES),
} as const

// Route Metadata
export const ROUTE_METADATA = {
  [PUBLIC_ROUTES.HOME]: {
    title: 'Video Generation SaaS',
    description: 'Crea videos increíbles con IA',
  },
  [PUBLIC_ROUTES.PRICING]: {
    title: 'Precios - Video Generation',
    description: 'Planes y precios para todos los usuarios',
  },
  [PROTECTED_ROUTES.DASHBOARD]: {
    title: 'Dashboard - Video Generation',
    description: 'Panel de control del usuario',
  },
  [PROTECTED_ROUTES.CREATE]: {
    title: 'Crear Video - Video Generation',
    description: 'Crea tu próximo video viral',
  },
  [PROTECTED_ROUTES.LIBRARY]: {
    title: 'Mi Librería - Video Generation',
    description: 'Todos tus videos creados',
  },
} as const

// Navigation Items
export const NAVIGATION = {
  MAIN: [
    { label: 'Dashboard', href: PROTECTED_ROUTES.DASHBOARD, icon: 'LayoutDashboard' },
    { label: 'Crear Video', href: PROTECTED_ROUTES.CREATE, icon: 'Plus' },
    { label: 'Mi Librería', href: PROTECTED_ROUTES.LIBRARY, icon: 'Library' },
    { label: 'Templates', href: PROTECTED_ROUTES.TEMPLATES, icon: 'Template' },
  ],
  FOOTER: [
    { label: 'Ayuda', href: PUBLIC_ROUTES.HELP },
    { label: 'Privacidad', href: PUBLIC_ROUTES.PRIVACY },
    { label: 'Términos', href: PUBLIC_ROUTES.TERMS },
    { label: 'Contacto', href: PUBLIC_ROUTES.CONTACT },
  ],
  ACCOUNT: [
    { label: 'Configuración', href: PROTECTED_ROUTES.SETTINGS, icon: 'Settings' },
    { label: 'Créditos', href: PROTECTED_ROUTES.CREDITS.ACTUAL, icon: 'Coins' },
    { label: 'Analytics', href: PROTECTED_ROUTES.ANALYTICS, icon: 'BarChart3' },
  ],
} as const