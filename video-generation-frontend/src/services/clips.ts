/**
 * Clips selection and search service
 */
import { apiClient } from '@/lib/api'
import { tokenManager } from '@/lib/auth'
import { API_ENDPOINTS } from '@/constants'

export interface ClipSearchRequest {
  query: string
  category?: string
  duration?: {
    min?: number
    max?: number
  }
  quality?: 'HD' | '4K'
  orientation?: 'landscape' | 'portrait' | 'square'
  limit?: number
  page?: number
}

export interface ClipSelectionRequest {
  script: string
  template: string
  maxClips?: number
  searchQueries?: string[]
  preferences?: {
    style: string[]
    colors: string[]
    mood: string
  }
}

export interface VideoClip {
  id: string
  title: string
  description: string
  tags: string[]
  duration: number
  resolution: {
    width: number
    height: number
  }
  fps: number
  url: string
  thumbnailUrl: string
  previewUrl: string
  source: 'pexels' | 'pixabay' | 'unsplash' | 'premium'
  license: string
  author: {
    name: string
    url?: string
  }
  fileSize: number
  quality: 'HD' | '4K'
  metadata: {
    keywords: string[]
    category: string
    mood: string
    colors: string[]
  }
}

export interface ClipSelection {
  clips: SelectedClip[]
  totalDuration: number
  searchQueries: string[]
  confidence: number
  alternatives: VideoClip[]
}

export interface SelectedClip extends VideoClip {
  startTime: number
  endTime: number
  clipDuration: number
  reason: string
  scriptMatch: string
}

export const clipsService = {
  async searchClips(request: ClipSearchRequest): Promise<{
    clips: VideoClip[]
    total: number
    page: number
    hasMore: boolean
  }> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CLIPS.SEARCH,
        request,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al buscar clips'
      )
    }
  },

  async selectClips(request: ClipSelectionRequest): Promise<ClipSelection> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post<ClipSelection>(
        API_ENDPOINTS.CLIPS.SELECT,
        request,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al seleccionar clips'
      )
    }
  },

  async getClipDetails(clipId: string): Promise<VideoClip> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<VideoClip>(
        `${API_ENDPOINTS.CLIPS.SEARCH}/${clipId}`,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener detalles del clip'
      )
    }
  },

  async getPopularClips(category?: string, limit = 20): Promise<VideoClip[]> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<{ clips: VideoClip[] }>(
        `${API_ENDPOINTS.CLIPS.POPULAR}?${new URLSearchParams({
          ...(category && { category }),
          limit: limit.toString()
        })}`,
        { Authorization: `Bearer ${token}` }
      )

      return response.clips
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener clips populares'
      )
    }
  },

  async getTrendingClips(limit = 20): Promise<VideoClip[]> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<{ clips: VideoClip[] }>(
        `${API_ENDPOINTS.CLIPS.TRENDING}?limit=${limit}`,
        { Authorization: `Bearer ${token}` }
      )

      return response.clips
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener clips trending'
      )
    }
  },

  async getFavoriteClips(): Promise<VideoClip[]> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<{ clips: VideoClip[] }>(
        API_ENDPOINTS.CLIPS.FAVORITES,
        { Authorization: `Bearer ${token}` }
      )

      return response.clips
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener clips favoritos'
      )
    }
  },

  async addToFavorites(clipId: string): Promise<void> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      await apiClient.post(
        `${API_ENDPOINTS.CLIPS.FAVORITES}/${clipId}`,
        {},
        { Authorization: `Bearer ${token}` }
      )
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al añadir a favoritos'
      )
    }
  },

  async removeFromFavorites(clipId: string): Promise<void> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      await apiClient.delete(
        `${API_ENDPOINTS.CLIPS.FAVORITES}/${clipId}`,
        { Authorization: `Bearer ${token}` }
      )
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al quitar de favoritos'
      )
    }
  },

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  },

  getResolutionLabel(width: number, height: number): string {
    if (width >= 3840) return '4K'
    if (width >= 1920) return 'Full HD'
    if (width >= 1280) return 'HD'
    return 'SD'
  },

  validateClipSelection(clips: SelectedClip[], maxDuration: number): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (clips.length === 0) {
      errors.push('Debe seleccionar al menos un clip')
    }

    const totalDuration = clips.reduce((sum, clip) => sum + clip.clipDuration, 0)

    if (totalDuration > maxDuration) {
      errors.push(`La duración total excede el máximo permitido (${maxDuration}s)`)
    }

    if (totalDuration < 5) {
      warnings.push('La duración total es muy corta para un video efectivo')
    }

    const uniqueSources = new Set(clips.map(clip => clip.source))
    if (uniqueSources.size > 3) {
      warnings.push('Mezclar muchas fuentes puede afectar la consistencia visual')
    }

    return { isValid: errors.length === 0, errors, warnings }
  }
}