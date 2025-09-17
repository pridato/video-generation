export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise'

export const SUBSCRIPTION_FEATURES = {
  free: {
    label: 'Gratis',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    credits: 5,
    features: ['5 videos/mes', 'Templates básicos', 'Resolución 720p']
  },
  starter: {
    label: 'Starter',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    credits: 25,
    features: ['25 videos/mes', 'Todos los templates', 'Resolución 1080p', 'Voces premium']
  },
  pro: {
    label: 'Pro',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    credits: 100,
    features: ['100 videos/mes', 'Analytics avanzados', 'API access', 'Prioridad de procesamiento']
  },
  enterprise: {
    label: 'Enterprise',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    credits: 500,
    features: ['Videos ilimitados', 'Soporte prioritario', 'Custom branding', 'Team management']
  }
} as const

export function getSubscriptionInfo(tier: SubscriptionTier) {
  return SUBSCRIPTION_FEATURES[tier] || SUBSCRIPTION_FEATURES.free
}

export function hasFeatureAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierLevels: Record<SubscriptionTier, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    enterprise: 3
  }

  return tierLevels[userTier] >= tierLevels[requiredTier]
}

export function isPremiumTier(tier: SubscriptionTier): boolean {
  return ['pro', 'enterprise'].includes(tier)
}

export function isFreeTier(tier: SubscriptionTier): boolean {
  return tier === 'free'
}