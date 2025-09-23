/**
 * Audio generation service
 */
import { apiClient } from '@/lib/api'
import { tokenManager } from '@/lib/auth'
import { API_ENDPOINTS } from '@/constants'

export interface AudioGenerationRequest {
  script: string
  voiceId: string
  speed?: number
  stability?: number
  clarityBoost?: number
  style?: number
}

export interface AudioResponse {
  audioUrl: string
  duration: number
  segments: AudioSegment[]
  voiceId: string
  metadata: {
    sampleRate: number
    bitrate: number
    format: string
    size: number
  }
}

export interface AudioSegment {
  id: string
  text: string
  startTime: number
  endTime: number
  duration: number
  audioUrl?: string
}

export interface Voice {
  id: string
  name: string
  gender: 'male' | 'female'
  accent: string
  language: string
  category: string
  preview_url?: string
  available_for_tiers: string[]
}

export const audioService = {
  async generateAudio(request: AudioGenerationRequest): Promise<AudioResponse> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post<AudioResponse>(
        API_ENDPOINTS.AUDIO.GENERATE,
        request,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al generar audio'
      )
    }
  },

  async getVoices(): Promise<Voice[]> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<{ voices: Voice[] }>(
        API_ENDPOINTS.AUDIO.VOICES,
        { Authorization: `Bearer ${token}` }
      )

      return response.voices
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener voces'
      )
    }
  },

  async getVoicePreview(voiceId: string): Promise<string> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<{ previewUrl: string }>(
        `${API_ENDPOINTS.AUDIO.VOICES}/${voiceId}/preview`,
        { Authorization: `Bearer ${token}` }
      )

      return response.previewUrl
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener preview de voz'
      )
    }
  },

  async cloneVoice(audioFile: File, name: string, description?: string): Promise<Voice> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('name', name)
      if (description) {
        formData.append('description', description)
      }

      const response = await apiClient.post<Voice>(
        API_ENDPOINTS.AUDIO.CLONE_VOICE,
        formData,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al clonar voz'
      )
    }
  },

  async enhanceAudio(audioUrl: string, options?: {
    removeNoise?: boolean
    normalizeVolume?: boolean
    enhanceSpeech?: boolean
  }): Promise<string> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post<{ enhancedAudioUrl: string }>(
        API_ENDPOINTS.AUDIO.ENHANCE,
        { audioUrl, ...options },
        { Authorization: `Bearer ${token}` }
      )

      return response.enhancedAudioUrl
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al mejorar audio'
      )
    }
  },

  async transcribeAudio(audioUrl: string): Promise<{
    text: string
    segments: {
      text: string
      start: number
      end: number
      confidence: number
    }[]
    language: string
    confidence: number
  }> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AUDIO.TRANSCRIBE,
        { audioUrl },
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al transcribir audio'
      )
    }
  },

  async getAudioAnalysis(audioUrl: string): Promise<{
    duration: number
    volume: number
    pitch: number
    tempo: number
    quality: 'low' | 'medium' | 'high'
    issues: string[]
  }> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AUDIO.ANALYZE,
        { audioUrl },
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al analizar audio'
      )
    }
  },

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  validateAudioFile(file: File): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg']

    if (file.size > maxSize) {
      errors.push('El archivo debe ser menor a 10MB')
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('Formato no soportado. Usa MP3, WAV, M4A o OGG')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}