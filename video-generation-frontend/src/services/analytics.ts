/**
 * Analytics service
 */
import { apiClient } from '@/lib/api'
import { tokenManager } from '@/lib/auth'
import { API_ENDPOINTS } from '@/constants'

export interface VideoAnalytics {
  videoId: string
  title: string
  views: number
  engagement: {
    likes: number
    shares: number
    comments: number
    saves: number
    clickThroughRate: number
    watchTime: number
    completionRate: number
  }
  performance: {
    score: number
    trend: 'up' | 'down' | 'stable'
    ranking: number
    category: string
  }
  demographics: {
    ageGroups: Array<{
      range: string
      percentage: number
    }>
    genders: Array<{
      type: 'male' | 'female' | 'other'
      percentage: number
    }>
    locations: Array<{
      country: string
      percentage: number
    }>
  }
  timeline: Array<{
    date: string
    views: number
    engagement: number
  }>
  createdAt: string
}

export interface DashboardStats {
  period: 'day' | 'week' | 'month' | 'year'
  overview: {
    totalVideos: number
    totalViews: number
    totalEngagement: number
    averagePerformance: number
    topPerformingVideo: {
      id: string
      title: string
      views: number
    }
  }
  trends: {
    viewsChange: number
    engagementChange: number
    videosChange: number
  }
  topCategories: Array<{
    category: string
    videosCount: number
    averageViews: number
    performance: number
  }>
  recentVideos: Array<{
    id: string
    title: string
    views: number
    engagement: number
    createdAt: string
  }>
}

export interface CompetitorAnalysis {
  competitor: {
    name: string
    category: string
    followers: number
  }
  comparison: {
    yourAverageViews: number
    competitorAverageViews: number
    yourEngagementRate: number
    competitorEngagementRate: number
    yourPostFrequency: number
    competitorPostFrequency: number
  }
  insights: string[]
  recommendations: string[]
}

export interface TrendingTopics {
  period: 'daily' | 'weekly' | 'monthly'
  topics: Array<{
    keyword: string
    growth: number
    difficulty: 'easy' | 'medium' | 'hard'
    opportunity: number
    relatedKeywords: string[]
  }>
  categories: Array<{
    name: string
    growth: number
    topics: string[]
  }>
}

export const analyticsService = {
  async getVideoAnalytics(videoId: string): Promise<VideoAnalytics> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<VideoAnalytics>(
        `${API_ENDPOINTS.ANALYTICS.VIDEO}/${videoId}`,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener analytics del video'
      )
    }
  },

  async getDashboardStats(period: DashboardStats['period'] = 'month'): Promise<DashboardStats> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<DashboardStats>(
        `${API_ENDPOINTS.ANALYTICS.DASHBOARD}?period=${period}`,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener estadísticas del dashboard'
      )
    }
  },

  async getCompetitorAnalysis(competitors: string[]): Promise<CompetitorAnalysis[]> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post<{ analyses: CompetitorAnalysis[] }>(
        API_ENDPOINTS.ANALYTICS.COMPETITORS,
        { competitors },
        { Authorization: `Bearer ${token}` }
      )

      return response.analyses
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener análisis de competidores'
      )
    }
  },

  async getTrendingTopics(period: TrendingTopics['period'] = 'weekly'): Promise<TrendingTopics> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.get<TrendingTopics>(
        `${API_ENDPOINTS.ANALYTICS.TRENDS}?period=${period}`,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener tendencias'
      )
    }
  },

  async getPerformanceReport(videoIds: string[]): Promise<{
    summary: {
      totalViews: number
      averageEngagement: number
      bestPerformer: string
      worstPerformer: string
    }
    detailed: Array<{
      videoId: string
      title: string
      metrics: {
        views: number
        engagement: number
        performance: number
        rank: number
      }
      insights: string[]
    }>
  }> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.ANALYTICS.REPORT,
        { videoIds },
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al generar reporte de rendimiento'
      )
    }
  },

  async exportAnalytics(options: {
    videoIds?: string[]
    period?: string
    format: 'csv' | 'pdf' | 'xlsx'
  }): Promise<string> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post<{ downloadUrl: string }>(
        API_ENDPOINTS.ANALYTICS.EXPORT,
        options,
        { Authorization: `Bearer ${token}` }
      )

      return response.downloadUrl
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al exportar analytics'
      )
    }
  },

  formatViewCount(views: number): string {
    if (views < 1000) return views.toString()
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K`
    if (views < 1000000000) return `${(views / 1000000).toFixed(1)}M`
    return `${(views / 1000000000).toFixed(1)}B`
  },

  formatEngagementRate(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`
  },

  formatPerformanceScore(score: number): string {
    if (score >= 80) return 'Excelente'
    if (score >= 60) return 'Bueno'
    if (score >= 40) return 'Regular'
    return 'Necesita mejora'
  },

  getPerformanceColor(score: number): string {
    if (score >= 80) return '#10B981'
    if (score >= 60) return '#F59E0B'
    if (score >= 40) return '#EF4444'
    return '#6B7280'
  },

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    const icons = {
      up: '📈',
      down: '📉',
      stable: '➡️'
    }
    return icons[trend]
  },

  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  },

  getInsightType(insight: string): 'positive' | 'negative' | 'neutral' {
    const positiveKeywords = ['increased', 'improved', 'higher', 'better', 'excellent']
    const negativeKeywords = ['decreased', 'declined', 'lower', 'worse', 'poor']

    const lowerInsight = insight.toLowerCase()

    if (positiveKeywords.some(keyword => lowerInsight.includes(keyword))) {
      return 'positive'
    }
    if (negativeKeywords.some(keyword => lowerInsight.includes(keyword))) {
      return 'negative'
    }
    return 'neutral'
  },

  generateRecommendations(analytics: VideoAnalytics): string[] {
    const recommendations: string[] = []

    if (analytics.engagement.completionRate < 0.5) {
      recommendations.push('Considera hacer videos más cortos para mejorar la tasa de finalización')
    }

    if (analytics.engagement.clickThroughRate < 0.1) {
      recommendations.push('Mejora tus miniaturas y títulos para aumentar el CTR')
    }

    if (analytics.engagement.shares < analytics.views * 0.05) {
      recommendations.push('Incluye llamadas a la acción para compartir el contenido')
    }

    if (analytics.performance.score < 60) {
      recommendations.push('Analiza videos similares con mejor rendimiento para identificar mejoras')
    }

    return recommendations
  }
}