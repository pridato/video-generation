export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month' as const,
    credits_per_month: 5,
    features: [
      '5 video generations per month',
      '720p resolution',
      'Basic templates',
      'Email support'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month' as const,
    credits_per_month: 100,
    features: [
      '100 video generations per month',
      'Up to 1080p resolution',
      'Premium templates',
      'Priority support',
      'Custom branding'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    interval: 'month' as const,
    credits_per_month: 500,
    features: [
      '500 video generations per month',
      'Up to 4K resolution',
      'All templates',
      '24/7 support',
      'API access',
      'Team collaboration'
    ]
  }
} as const

export const VIDEO_SETTINGS = {
  RESOLUTIONS: ['720p', '1080p', '4k'] as const,
  FPS_OPTIONS: [24, 30, 60] as const,
  FORMATS: ['mp4', 'webm', 'mov'] as const,
  QUALITY_OPTIONS: ['low', 'medium', 'high'] as const
} as const

export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    CALLBACK: '/auth/callback'
  },
  DASHBOARD: '/dashboard',
  CREATE: '/create',
  LIBRARY: '/library',
  SETTINGS: '/settings',
  PRICING: '/pricing',
  PROFILE: '/profile',
  ADMIN: '/admin'
} as const