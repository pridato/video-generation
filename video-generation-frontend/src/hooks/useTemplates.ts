/**
 * Templates management hook
 */
import { useCallback } from 'react'
import { templatesService } from '@/services/templates'
import { useApi, usePaginatedApi } from './useApi'
import { useUser } from './useUser'
import type { Template, TemplateCategory } from '@/services/templates'

export const useTemplates = () => {
  const { profile } = useUser()
  const templatesApi = usePaginatedApi<Template>()
  const categoriesApi = useApi<TemplateCategory[]>()
  const popularApi = useApi<Template[]>()
  const featuredApi = useApi<Template[]>()
  const recentApi = useApi<Template[]>()
  const recommendedApi = useApi<Template[]>()

  const loadTemplates = useCallback((options?: {
    category?: string
    isPremium?: boolean
    aspectRatio?: string
    search?: string
    sortBy?: 'popularity' | 'newest' | 'name'
    page?: number
  }) => {
    return templatesApi.execute(
      (pageNum, pageSize) => templatesService.getTemplates({
        ...options,
        page: pageNum,
        limit: pageSize
      }),
      options?.page || 1
    )
  }, [templatesApi])

  const loadMoreTemplates = useCallback((options?: {
    category?: string
    isPremium?: boolean
    aspectRatio?: string
    search?: string
    sortBy?: 'popularity' | 'newest' | 'name'
  }) => {
    return templatesApi.loadMore(
      (pageNum, pageSize) => templatesService.getTemplates({
        ...options,
        page: pageNum,
        limit: pageSize
      })
    )
  }, [templatesApi])

  const searchTemplates = useCallback((query: string, filters?: {
    category?: string
    isPremium?: boolean
    aspectRatio?: string
  }) => {
    return loadTemplates({
      search: query,
      ...filters,
      page: 1
    })
  }, [loadTemplates])

  const loadCategories = useCallback(() => {
    return categoriesApi.execute(() => templatesService.getCategories())
  }, [categoriesApi])

  const loadPopularTemplates = useCallback((limit = 12) => {
    return popularApi.execute(() => templatesService.getPopularTemplates(limit))
  }, [popularApi])

  const loadFeaturedTemplates = useCallback(() => {
    return featuredApi.execute(() => templatesService.getFeaturedTemplates())
  }, [featuredApi])

  const loadRecentTemplates = useCallback((limit = 8) => {
    return recentApi.execute(() => templatesService.getRecentTemplates(limit))
  }, [recentApi])

  const loadRecommendedTemplates = useCallback(() => {
    return recommendedApi.execute(() => templatesService.getRecommendedTemplates(profile?.id))
  }, [recommendedApi, profile?.id])

  const getTemplate = useCallback(async (templateId: string): Promise<Template | null> => {
    try {
      return await templatesService.getTemplate(templateId)
    } catch (error) {
      console.error('Error fetching template:', error)
      return null
    }
  }, [])

  const previewTemplate = useCallback(async (templateId: string): Promise<string | null> => {
    try {
      return await templatesService.previewTemplate(templateId)
    } catch (error) {
      console.error('Error getting template preview:', error)
      return null
    }
  }, [])

  const trackTemplateUsage = useCallback((templateId: string) => {
    templatesService.trackTemplateUsage(templateId)
  }, [])

  const filterByUserTier = useCallback((templates: Template[]) => {
    if (!profile) return templates
    return templatesService.filterTemplatesByUserTier(templates, profile.subscriptionTier)
  }, [profile])

  const isTemplateAccessible = useCallback((template: Template) => {
    if (!profile) return !template.isPremium
    return templatesService.isTemplateAccessible(template, profile.subscriptionTier)
  }, [profile])

  const sortTemplates = useCallback((templates: Template[], sortBy: 'popularity' | 'newest' | 'name') => {
    return templatesService.sortTemplates(templates, sortBy)
  }, [])

  const getAspectRatioLabel = useCallback((aspectRatio: Template['aspectRatio']) => {
    return templatesService.getAspectRatioLabel(aspectRatio)
  }, [])

  const getResolutionLabel = useCallback((resolution: string) => {
    return templatesService.getResolutionLabel(resolution)
  }, [])

  const getCategoryIcon = useCallback((category: string) => {
    return templatesService.getCategoryIcon(category)
  }, [])

  const formatUsageCount = useCallback((count: number) => {
    return templatesService.formatUsageCount(count)
  }, [])

  // Get accessible templates from current list
  const accessibleTemplates = templatesApi.items ? filterByUserTier(templatesApi.items) : []

  // Get premium templates that user can't access
  const premiumTemplates = templatesApi.items
    ? templatesApi.items.filter(template => !isTemplateAccessible(template))
    : []

  return {
    // API states
    templates: templatesApi,
    categories: categoriesApi,
    popular: popularApi,
    featured: featuredApi,
    recent: recentApi,
    recommended: recommendedApi,

    // Computed data
    accessibleTemplates,
    premiumTemplates,

    // Actions
    loadTemplates,
    loadMoreTemplates,
    searchTemplates,
    loadCategories,
    loadPopularTemplates,
    loadFeaturedTemplates,
    loadRecentTemplates,
    loadRecommendedTemplates,
    getTemplate,
    previewTemplate,
    trackTemplateUsage,

    // Utilities
    filterByUserTier,
    isTemplateAccessible,
    sortTemplates,
    getAspectRatioLabel,
    getResolutionLabel,
    getCategoryIcon,
    formatUsageCount
  }
}