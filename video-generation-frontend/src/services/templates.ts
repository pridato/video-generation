/**
 * Templates service
 */
import { apiClient } from '@/lib/api'
import { tokenManager } from '@/lib/auth'
import { API_ENDPOINTS } from '@/constants'

export interface Template {
  id: string
  name: string
  description: string
  category: string
  previewUrl: string
  thumbnailUrl: string
  tags: string[]
  isPremium: boolean
  popularity: number
  aspectRatio: '9:16' | '16:9' | '1:1'
  duration: {
    min: number
    max: number
  }
  settings: {
    resolution: '1080p' | '4K'
    fps: number
    style: string
    colorScheme: string[]
    transitions: string[]
    textOverlay: {
      font: string
      animations: string[]
      positions: string[]
    }
    subtitle: {
      styles: string[]
      fonts: string[]
      animations: string[]
    }
  }
  features: string[]
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  templateCount: number
  isPopular: boolean
}

export const templatesService = {
  async getTemplates(options?: {
    category?: string
    isPremium?: boolean
    aspectRatio?: string
    search?: string
    page?: number
    limit?: number
    sortBy?: 'popularity' | 'newest' | 'name'
  }): Promise<{
    templates: Template[]
    total: number
    page: number
    hasMore: boolean
  }> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const params = new URLSearchParams()
      if (options?.category) params.append('category', options.category)
      if (options?.isPremium !== undefined) params.append('isPremium', options.isPremium.toString())
      if (options?.aspectRatio) params.append('aspectRatio', options.aspectRatio)
      if (options?.search) params.append('search', options.search)
      if (options?.page) params.append('page', options.page.toString())
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.sortBy) params.append('sortBy', options.sortBy)

      const response = await apiClient.get(
        `${API_ENDPOINTS.TEMPLATES.LIST}?${params}`,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener templates'
      )
    }
  },

  async getTemplate(templateId: string): Promise<Template> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<Template>(
        `${API_ENDPOINTS.TEMPLATES.DETAIL}/${templateId}`,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener template'
      )
    }
  },

  async getCategories(): Promise<TemplateCategory[]> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<{ categories: TemplateCategory[] }>(
        API_ENDPOINTS.TEMPLATES.CATEGORIES,
        { Authorization: `Bearer ${token}` }
      )

      return response.categories
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener categorías'
      )
    }
  },

  async getPopularTemplates(limit = 12): Promise<Template[]> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<{ templates: Template[] }>(
        `${API_ENDPOINTS.TEMPLATES.POPULAR}?limit=${limit}`,
        { Authorization: `Bearer ${token}` }
      )

      return response.templates
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener templates populares'
      )
    }
  },

  async getFeaturedTemplates(): Promise<Template[]> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<{ templates: Template[] }>(
        API_ENDPOINTS.TEMPLATES.FEATURED,
        { Authorization: `Bearer ${token}` }
      )

      return response.templates
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener templates destacados'
      )
    }
  },

  async getRecentTemplates(limit = 8): Promise<Template[]> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<{ templates: Template[] }>(
        `${API_ENDPOINTS.TEMPLATES.RECENT}?limit=${limit}`,
        { Authorization: `Bearer ${token}` }
      )

      return response.templates
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener templates recientes'
      )
    }
  },

  async getRecommendedTemplates(userId?: string): Promise<Template[]> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const params = userId ? `?userId=${userId}` : ''
      const response = await apiClient.get<{ templates: Template[] }>(
        `${API_ENDPOINTS.TEMPLATES.RECOMMENDED}${params}`,
        { Authorization: `Bearer ${token}` }
      )

      return response.templates
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener templates recomendados'
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
        `${API_ENDPOINTS.TEMPLATES.DETAIL}/${templateId}/preview`,
        { Authorization: `Bearer ${token}` }
      )

      return response.previewUrl
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener preview'
      )
    }
  },

  async trackTemplateUsage(templateId: string): Promise<void> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      await apiClient.post(
        `${API_ENDPOINTS.TEMPLATES.DETAIL}/${templateId}/track`,
        {},
        { Authorization: `Bearer ${token}` }
      )
    } catch (error) {
      // Silent fail for tracking
      console.warn('Error tracking template usage:', error)
    }
  },

  getAspectRatioLabel(aspectRatio: Template['aspectRatio']): string {
    const labels = {
      '9:16': 'Vertical (Stories)',
      '16:9': 'Horizontal (YouTube)',
      '1:1': 'Cuadrado (Instagram)'
    }
    return labels[aspectRatio]
  },

  getResolutionLabel(resolution: string): string {
    const labels = {
      '1080p': 'Full HD (1080p)',
      '4K': 'Ultra HD (4K)'
    }
    return labels[resolution] || resolution
  },

  getCategoryIcon(category: string): string {
    const icons = {
      'technology': '💻',
      'lifestyle': '🌟',
      'business': '💼',
      'education': '📚',
      'entertainment': '🎬',
      'sports': '⚽',
      'food': '🍕',
      'travel': '✈️',
      'health': '🏥',
      'music': '🎵',
      'art': '🎨',
      'gaming': '🎮'
    }
    return icons[category] || '📄'
  },

  formatUsageCount(count: number): string {
    if (count < 1000) return count.toString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`
    return `${(count / 1000000).toFixed(1)}M`
  },

  isTemplateAccessible(template: Template, userTier: string): boolean {
    if (!template.isPremium) return true
    return userTier === 'pro' || userTier === 'premium'
  },

  filterTemplatesByUserTier(templates: Template[], userTier: string): Template[] {
    return templates.filter(template => this.isTemplateAccessible(template, userTier))
  },

  searchTemplates(templates: Template[], query: string): Template[] {
    const searchTerm = query.toLowerCase().trim()
    if (!searchTerm) return templates

    return templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.category.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  },

  sortTemplates(templates: Template[], sortBy: 'popularity' | 'newest' | 'name'): Template[] {
    return [...templates].sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
  }
}