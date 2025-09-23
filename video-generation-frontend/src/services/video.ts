/**
 * Video generation service
 */
import { apiClient } from '@/lib/api'
import { tokenManager } from '@/lib/auth'
import { API_ENDPOINTS } from '@/constants'
import type { SelectedClip } from './clips'
import type { AudioSegment } from './audio'

export interface VideoGenerationRequest {
  script: string
  audioUrl: string
  clips: SelectedClip[]
  template: VideoTemplate
  settings: VideoSettings
}

export interface VideoTemplate {
  id: string
  name: string
  description: string
  category: string
  settings: {
    aspectRatio: '9:16' | '16:9' | '1:1'
    resolution: '1080p' | '4K'
    fps: number
    style: string
    transitions: string[]
    textOverlay: {
      font: string
      size: number
      color: string
      position: 'top' | 'center' | 'bottom'
      animation: string
    }
    subtitle: {
      enabled: boolean
      style: string
      font: string
      size: number
      color: string
      backgroundColor: string
      position: 'bottom' | 'center'
    }
  }
}

export interface VideoSettings {
  quality: 'draft' | 'standard' | 'premium'
  optimization: 'speed' | 'quality' | 'balanced'
  includeSubtitles: boolean
  includeBranding: boolean
  watermark?: boolean
  customIntro?: string
  customOutro?: string
}

export interface VideoProject {
  id: string
  title: string
  status: 'draft' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  request: VideoGenerationRequest
  result?: VideoResult
  createdAt: string
  updatedAt: string
  estimatedCompletionTime?: number
}

export interface VideoResult {
  videoUrl: string
  thumbnailUrl: string
  duration: number
  fileSize: number
  metadata: {
    resolution: string
    fps: number
    codec: string
    bitrate: number
    format: string
  }
  analytics: {
    processingTime: number
    clipsUsed: number
    audioDuration: number
    subtitleCount: number
  }
}

export const videoService = {
  async generateVideo(request: VideoGenerationRequest): Promise<VideoProject> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post<VideoProject>(
        API_ENDPOINTS.VIDEO.GENERATE,
        request,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al generar video'
      )
    }
  },

  async getProject(projectId: string): Promise<VideoProject> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<VideoProject>(
        `${API_ENDPOINTS.VIDEO.PROJECTS}/${projectId}`,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener proyecto'
      )
    }
  },

  async getProjects(page = 1, limit = 20, status?: string): Promise<{
    projects: VideoProject[]
    total: number
    page: number
    hasMore: boolean
  }> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status })
      })

      const response = await apiClient.get(
        `${API_ENDPOINTS.VIDEO.PROJECTS}?${params}`,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener proyectos'
      )
    }
  },

  async cancelProject(projectId: string): Promise<void> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      await apiClient.post(
        `${API_ENDPOINTS.VIDEO.PROJECTS}/${projectId}/cancel`,
        {},
        { Authorization: `Bearer ${token}` }
      )
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al cancelar proyecto'
      )
    }
  },

  async deleteProject(projectId: string): Promise<void> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      await apiClient.delete(
        `${API_ENDPOINTS.VIDEO.PROJECTS}/${projectId}`,
        { Authorization: `Bearer ${token}` }
      )
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al eliminar proyecto'
      )
    }
  },

  async duplicateProject(projectId: string, title?: string): Promise<VideoProject> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post<VideoProject>(
        `${API_ENDPOINTS.VIDEO.PROJECTS}/${projectId}/duplicate`,
        { title },
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al duplicar proyecto'
      )
    }
  },

  async getTemplates(category?: string): Promise<VideoTemplate[]> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const params = category ? `?category=${category}` : ''
      const response = await apiClient.get<{ templates: VideoTemplate[] }>(
        `${API_ENDPOINTS.VIDEO.TEMPLATES}${params}`,
        { Authorization: `Bearer ${token}` }
      )

      return response.templates
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener templates'
      )
    }
  },

  async previewTemplate(templateId: string): Promise<string> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<{ previewUrl: string }>(
        `${API_ENDPOINTS.VIDEO.TEMPLATES}/${templateId}/preview`,
        { Authorization: `Bearer ${token}` }
      )

      return response.previewUrl
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener preview del template'
      )
    }
  },

  async downloadVideo(projectId: string, quality?: 'original' | 'compressed'): Promise<string> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const params = quality ? `?quality=${quality}` : ''
      const response = await apiClient.get<{ downloadUrl: string }>(
        `${API_ENDPOINTS.VIDEO.PROJECTS}/${projectId}/download${params}`,
        { Authorization: `Bearer ${token}` }
      )

      return response.downloadUrl
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al generar enlace de descarga'
      )
    }
  },

  async shareVideo(projectId: string, platforms: string[]): Promise<{
    shareUrls: Record<string, string>
    expiresAt: string
  }> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.VIDEO.PROJECTS}/${projectId}/share`,
        { platforms },
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al compartir video'
      )
    }
  },

  getStatusColor(status: VideoProject['status']): string {
    const colors = {
      draft: '#6B7280',
      processing: '#F59E0B',
      completed: '#10B981',
      failed: '#EF4444',
      cancelled: '#6B7280'
    }
    return colors[status]
  },

  getStatusLabel(status: VideoProject['status']): string {
    const labels = {
      draft: 'Borrador',
      processing: 'Procesando',
      completed: 'Completado',
      failed: 'Error',
      cancelled: 'Cancelado'
    }
    return labels[status]
  },

  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  },

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  estimateProcessingTime(request: VideoGenerationRequest): number {
    const baseTime = 60 // 1 minute base
    const clipTime = request.clips.length * 10 // 10 seconds per clip
    const qualityMultiplier = request.settings.quality === 'premium' ? 2 : 1
    const resolutionMultiplier = request.template.settings.resolution === '4K' ? 1.5 : 1

    return Math.round(baseTime + clipTime * qualityMultiplier * resolutionMultiplier)
  },

  validateVideoRequest(request: VideoGenerationRequest): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!request.script.trim()) {
      errors.push('El script es requerido')
    }

    if (!request.audioUrl) {
      errors.push('El audio es requerido')
    }

    if (request.clips.length === 0) {
      errors.push('Debe seleccionar al menos un clip')
    }

    if (request.clips.length > 20) {
      warnings.push('Muchos clips pueden hacer el video demasiado rápido')
    }

    const totalDuration = request.clips.reduce((sum, clip) => sum + clip.clipDuration, 0)
    if (totalDuration > 300) {
      warnings.push('Videos largos tienen menor engagement en redes sociales')
    }

    return { isValid: errors.length === 0, errors, warnings }
  }
}