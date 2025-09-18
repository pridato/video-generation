// Database types

/**
 * Interfaz que define la estructura de un usuario en la base de datos.
 */
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  subscription_tier?: 'free' | 'pro' | 'enterprise'
  credits_remaining?: number
}

/**
 * Interfaz que define la estructura de un proyecto de video en la base de datos.
 */
export interface VideoProject {
  id: string
  user_id: string
  title: string
  description?: string
  status: 'draft' | 'processing' | 'completed' | 'failed'
  video_url?: string
  thumbnail_url?: string
  duration?: number
  settings: VideoSettings
  created_at: string
  updated_at: string
}

/**
 * Interfaz que define la configuración de un video.
 */
export interface VideoSettings {
  resolution: '720p' | '1080p' | '4k'
  fps: 24 | 30 | 60
  format: 'mp4' | 'webm' | 'mov'
  quality: 'low' | 'medium' | 'high'
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

// Signup form extends login form with additional fields
export interface SignupForm extends LoginForm {
  fullName: string
  confirmPassword: string
}

// Subscription types
export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  credits_per_month: number
}



