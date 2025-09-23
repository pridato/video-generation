/**
 * Script enhancement service
 */
import { apiClient } from '@/lib/api'
import { tokenManager } from '@/lib/auth'
import { API_ENDPOINTS } from '@/constants'

export interface ScriptEnhancementRequest {
  script: string
  tone?: 'professional' | 'casual' | 'energetic' | 'educational'
  targetAudience?: 'developers' | 'marketers' | 'general' | 'business'
  language?: string
  keywords?: string[]
}

export interface EnhancedScript {
  originalScript: string
  enhancedScript: string
  improvements: string[]
  tone: string
  estimatedDuration: number
  wordCount: number
  suggestions: {
    title: string[]
    hashtags: string[]
    thumbnailIdeas: string[]
  }
}

export const scriptService = {
  async enhanceScript(request: ScriptEnhancementRequest): Promise<EnhancedScript> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post<EnhancedScript>(
        API_ENDPOINTS.SCRIPT.ENHANCE,
        request,
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al mejorar el script'
      )
    }
  },

  async generateScriptFromTopic(topic: string, options?: {
    duration?: number
    style?: string
    includeIntro?: boolean
    includeOutro?: boolean
  }): Promise<string> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post<{ script: string }>(
        API_ENDPOINTS.SCRIPT.GENERATE,
        { topic, ...options },
        { Authorization: `Bearer ${token}` }
      )

      return response.script
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al generar script'
      )
    }
  },

  async analyzeScript(script: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative'
    readabilityScore: number
    keyTopics: string[]
    estimatedEngagement: number
    suggestions: string[]
  }> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.SCRIPT.ANALYZE,
        { script },
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al analizar script'
      )
    }
  },

  async translateScript(script: string, targetLanguage: string): Promise<{
    translatedScript: string
    originalLanguage: string
    confidence: number
  }> {
    const token = tokenManager.get()
    if (!token) {
      throw new Error('Autenticación requerida')
    }

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.SCRIPT.TRANSLATE,
        { script, targetLanguage },
        { Authorization: `Bearer ${token}` }
      )

      return response
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Error al traducir script'
      )
    }
  },

  validateScript(script: string): {
    isValid: boolean
    errors: string[]
    warnings: string[]
    metrics: {
      wordCount: number
      characterCount: number
      estimatedDuration: number
      sentences: number
    }
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!script.trim()) {
      errors.push('El script no puede estar vacío')
    }

    const wordCount = script.trim().split(/\s+/).length
    const characterCount = script.length
    const sentences = script.split(/[.!?]+/).filter(s => s.trim()).length

    if (wordCount < 10) {
      errors.push('El script debe tener al menos 10 palabras')
    }

    if (wordCount > 300) {
      warnings.push('Scripts largos pueden reducir el engagement')
    }

    if (sentences < 2) {
      warnings.push('Considera dividir el contenido en más oraciones')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics: {
        wordCount,
        characterCount,
        estimatedDuration: Math.round(wordCount / 2.5), // ~2.5 words per second
        sentences
      }
    }
  }
}