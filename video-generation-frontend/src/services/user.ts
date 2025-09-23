/**
 * User management service
 */
import { apiClient } from '@/lib/api'
import { tokenManager } from '@/lib/auth'
import { API_ENDPOINTS } from '@/constants'

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar?: string
  subscriptionTier: 'free' | 'pro' | 'premium'
  subscriptionStatus: 'active' | 'cancelled' | 'expired' | 'trial'
  subscriptionExpiresAt?: string
  usage: {
    videosGenerated: number
    videosLimit: number
    storageUsed: number
    storageLimit: number
    apiCallsUsed: number
    apiCallsLimit: number
  }
  preferences: {
    language: string
    timezone: string
    emailNotifications: boolean
    theme: 'light' | 'dark' | 'system'
    defaultVoice?: string
    defaultTemplate?: string
  }
  createdAt: string
  lastLoginAt: string
}

export interface UpdateProfileRequest {
  name?: string
  avatar?: File
  preferences?: Partial<UserProfile['preferences']>
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface UsageStats {
  period: 'day' | 'week' | 'month' | 'year'
  videosGenerated: number
  totalVideoTime: number
  storageUsed: number
  apiCalls: number
  topTemplates: Array<{
    templateId: string
    templateName: string
    count: number
  }>
  topVoices: Array<{
    voiceId: string
    voiceName: string
    count: number
  }>
}

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<UserProfile>(
        API_ENDPOINTS.USER.PROFILE,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener perfil'
      )
    }
  },

  async updateProfile(request: UpdateProfileRequest): Promise<UserProfile> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      let body: any = {}

      if (request.avatar) {
        const formData = new FormData()
        formData.append('avatar', request.avatar)
        if (request.name) formData.append('name', request.name)
        if (request.preferences) {
          formData.append('preferences', JSON.stringify(request.preferences))
        }
        body = formData
      } else {
        body = {
          ...(request.name && { name: request.name }),
          ...(request.preferences && { preferences: request.preferences })
        }
      }

      const response = await apiClient.put<UserProfile>(
        API_ENDPOINTS.USER.PROFILE,
        body,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al actualizar perfil'
      )
    }
  },

  async changePassword(request: ChangePasswordRequest): Promise<{ message: string }> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.put<{ message: string }>(
        API_ENDPOINTS.USER.CHANGE_PASSWORD,
        request,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al cambiar contraseña'
      )
    }
  },

  async getUsageStats(period: UsageStats['period'] = 'month'): Promise<UsageStats> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<UsageStats>(
        `${API_ENDPOINTS.USER.USAGE}?period=${period}`,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener estadísticas'
      )
    }
  },

  async deleteAccount(password: string): Promise<{ message: string }> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.delete<{ message: string }>(
        API_ENDPOINTS.USER.DELETE_ACCOUNT,
        { Authorization: `Bearer ${token}`, body: JSON.stringify({ password }) }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al eliminar cuenta'
      )
    }
  },

  async getNotifications(): Promise<Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    read: boolean
    createdAt: string
  }>> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<{ notifications: any[] }>(
        API_ENDPOINTS.USER.NOTIFICATIONS,
        { Authorization: `Bearer ${token}` }
      )

      return response.notifications
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener notificaciones'
      )
    }
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      await apiClient.put(
        `${API_ENDPOINTS.USER.NOTIFICATIONS}/${notificationId}/read`,
        {},
        { Authorization: `Bearer ${token}` }
      )
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al marcar notificación como leída'
      )
    }
  },

  async exportData(): Promise<string> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post<{ downloadUrl: string }>(
        API_ENDPOINTS.USER.EXPORT_DATA,
        {},
        { Authorization: `Bearer ${token}` }
      )

      return response.downloadUrl
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al exportar datos'
      )
    }
  },

  getSubscriptionLabel(tier: UserProfile['subscriptionTier']): string {
    const labels = {
      free: 'Gratuito',
      pro: 'Profesional',
      premium: 'Premium'
    }
    return labels[tier]
  },

  getUsagePercentage(used: number, limit: number): number {
    if (limit === 0) return 0
    return Math.min((used / limit) * 100, 100)
  },

  isUsageLimitReached(used: number, limit: number): boolean {
    return used >= limit
  },

  isUsageNearLimit(used: number, limit: number, threshold = 0.8): boolean {
    return (used / limit) >= threshold
  },

  formatStorageSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  },

  getSubscriptionStatusColor(status: UserProfile['subscriptionStatus']): string {
    const colors = {
      active: '#10B981',
      trial: '#F59E0B',
      cancelled: '#6B7280',
      expired: '#EF4444'
    }
    return colors[status]
  },

  getSubscriptionStatusLabel(status: UserProfile['subscriptionStatus']): string {
    const labels = {
      active: 'Activa',
      trial: 'Prueba',
      cancelled: 'Cancelada',
      expired: 'Expirada'
    }
    return labels[status]
  }
}