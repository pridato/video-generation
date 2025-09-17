export const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    yearlyPrice: 0,
    period: '/mes',
    description: 'Perfecto para empezar',
    features: [
      '5 videos al mes',
      'Voces básicas',
      'Templates básicos',
      'Resolución 720p',
      'Marca de agua'
    ],
    cta: 'Empezar Gratis',
    popular: false,
    stripePriceId: null,
    stripeYearlyPriceId: null
  },
  {
    id: 'creator',
    name: 'Creador',
    price: Number(process.env.STRIPE_PRICE_CREATOR_MONTHLY) || 9,
    yearlyPrice: Number(process.env.STRIPE_PRICE_CREATOR_YEARLY) || 86.40,
    period: '/mes',
    description: 'Para creators individuales',
    features: [
      '50 videos al mes',
      'Voces profesionales',
      'Todos los templates',
      'Resolución 1080p',
      'Sin marca de agua',
      'Soporte por email'
    ],
    cta: 'Elegir Plan',
    popular: false,
    stripePriceId: 'price_creator_monthly',
    stripeYearlyPriceId: 'price_creator_yearly'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: Number(process.env.STRIPE_PRICE_PRO_MONTHLY) || 19,
    yearlyPrice: Number(process.env.STRIPE_PRICE_PRO_YEARLY) || 182.40,
    period: '/mes',
    description: 'Para creators profesionales',
    features: [
      '200 videos al mes',
      'Voces IA premium',
      'Templates exclusivos',
      'Resolución 4K',
      'Analytics avanzados',
      'Exportación bulk',
      'Soporte prioritario'
    ],
    cta: 'Probar 14 días',
    popular: true,
    stripePriceId: 'price_pro_monthly',
    stripeYearlyPriceId: 'price_pro_yearly'
  },
  {
    id: 'enterprise',
    name: 'Agencia',
    price: Number(process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY) || 49,
    yearlyPrice: Number(process.env.STRIPE_PRICE_ENTERPRISE_YEARLY) || 470.40,
    period: '/mes',
    description: 'Para agencias y equipos',
    features: [
      'Videos ilimitados',
      'White-label completo',
      'API access',
      'Manager dedicado',
      'Custom templates',
      'SLA garantizado',
      'Integración custom'
    ],
    cta: 'Contactar Ventas',
    popular: false,
    stripePriceId: 'price_enterprise_monthly',
    stripeYearlyPriceId: 'price_enterprise_yearly'
  }
]

export interface PricingPlan {
  id: string
  name: string
  price: number
  yearlyPrice: number
  period: string
  description: string
  features: string[]
  cta: string
  popular: boolean
  stripePriceId: string | null
  stripeYearlyPriceId: string | null
}