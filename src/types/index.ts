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
  script: string
  template_id: string
  voice_id?: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  video_url?: string
  thumbnail_url?: string
  duration?: number
  settings?: Record<string, unknown>
  analytics?: Record<string, unknown>
  enhanced_script?: Record<string, unknown>
  final_script?: string
  clips_used?: string[]
  voice_settings?: Record<string, unknown>
  background_music?: string
  sound_effects?: string[]
  actual_duration?: number
  file_size?: number
  processing_time?: number
  quality_score?: number
  subtitles_url?: string
  error_message?: string
  retry_count?: number
  download_count?: number
  share_count?: number
  created_at: string
  updated_at: string
}

/**
 * Interfaz que define la configuración de un video.
 */
export interface VideoSettings {
  resolution?: '720p' | '1080p' | '4k'
  fps?: 24 | 30 | 60
  format?: 'mp4' | 'webm' | 'mov'
  quality?: 'low' | 'medium' | 'high'
  watermark_enabled?: boolean
  watermark_position?: string
  background_music_enabled?: boolean
  sound_effects_enabled?: boolean
  voice_speed?: number
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



