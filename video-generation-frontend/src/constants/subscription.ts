/**
 * Subscription and Pricing Constants
 */

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: 'Perfecto para empezar',
    price: 0,
    interval: 'month' as const,
    credits_per_month: 5,
    features: [
      '5 videos por mes',
      'Resolución 720p',
      'Templates básicos',
      'Soporte por email',
      'Marca de agua'
    ],
    limitations: [
      'Máximo 30 segundos por video',
      '3 voces disponibles',
      'Sin análisis'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    description: 'Para creadores serios',
    price: 29,
    interval: 'month' as const,
    credits_per_month: 100,
    popular: true,
    features: [
      '100 videos por mes',
      'Resolución hasta 1080p',
      'Todos los templates',
      'Soporte prioritario',
      'Sin marca de agua',
      'Análisis básico',
      '6 voces premium'
    ],
    limitations: [
      'Máximo 60 segundos por video'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para equipos y empresas',
    price: 99,
    interval: 'month' as const,
    credits_per_month: 500,
    features: [
      '500 videos por mes',
      'Resolución hasta 4K',
      'Templates exclusivos',
      'Soporte 24/7',
      'Branding personalizado',
      'Análisis avanzado',
      'Acceso API',
      'Colaboración en equipo',
      'Todas las voces premium'
    ],
    limitations: []
  }
} as const

// Credit Packages (Pay-as-you-go)
export const CREDIT_PACKAGES = {
  SMALL: {
    id: 'credits_10',
    credits: 10,
    price: 9.99,
    bonus: 0,
    description: 'Paquete básico',
  },
  MEDIUM: {
    id: 'credits_25',
    credits: 25,
    price: 19.99,
    bonus: 5,
    description: 'Más popular',
    popular: true,
  },
  LARGE: {
    id: 'credits_50',
    credits: 50,
    price: 34.99,
    bonus: 15,
    description: 'Mejor valor',
  },
  JUMBO: {
    id: 'credits_100',
    credits: 100,
    price: 59.99,
    bonus: 35,
    description: 'Para profesionales',
  }
} as const

// Feature Limits by Plan
export const PLAN_LIMITS = {
  [SUBSCRIPTION_PLANS.FREE.id]: {
    max_video_duration: 30,
    max_resolution: '720p',
    templates_access: 'basic',
    voices_count: 3,
    analytics: false,
    watermark: true,
    api_access: false,
    team_members: 1,
  },
  [SUBSCRIPTION_PLANS.PRO.id]: {
    max_video_duration: 60,
    max_resolution: '1080p',
    templates_access: 'all',
    voices_count: 6,
    analytics: 'basic',
    watermark: false,
    api_access: false,
    team_members: 3,
  },
  [SUBSCRIPTION_PLANS.ENTERPRISE.id]: {
    max_video_duration: 300,
    max_resolution: '4k',
    templates_access: 'premium',
    voices_count: 'unlimited',
    analytics: 'advanced',
    watermark: false,
    api_access: true,
    team_members: 'unlimited',
  }
} as const

// Billing Intervals
export const BILLING_INTERVALS = {
  MONTHLY: {
    value: 'month',
    label: 'Mensual',
    description: 'Facturado mensualmente',
    discount: 0,
  },
  YEARLY: {
    value: 'year',
    label: 'Anual',
    description: 'Facturado anualmente',
    discount: 0.2, // 20% descuento
  }
} as const

// Payment Methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  CRYPTO: 'crypto',
} as const

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  TRIALING: 'trialing',
  PAUSED: 'paused',
} as const

// Trial Configuration
export const TRIAL_CONFIG = {
  DURATION_DAYS: 7,
  CREDITS_INCLUDED: 20,
  FEATURES: [
    'Acceso completo por 7 días',
    '20 créditos incluidos',
    'Todas las funciones Pro',
    'Sin compromiso'
  ]
} as const

// Upgrade Prompts
export const UPGRADE_PROMPTS = {
  CREDITS_LOW: {
    title: 'Créditos bajos',
    message: 'Te quedan pocos créditos. ¿Quieres comprar más?',
    cta: 'Comprar créditos',
  },
  RESOLUTION_LIMIT: {
    title: 'Resolución limitada',
    message: 'Actualiza a Pro para videos en 1080p',
    cta: 'Actualizar plan',
  },
  TEMPLATE_LOCKED: {
    title: 'Template premium',
    message: 'Este template requiere un plan Pro o superior',
    cta: 'Ver planes',
  },
  VOICE_LOCKED: {
    title: 'Voz premium',
    message: 'Esta voz está disponible solo para usuarios Pro',
    cta: 'Actualizar plan',
  }
} as const

// Discount Codes
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_CREDITS: 'free_credits',
} as const