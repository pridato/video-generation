/**
 * Clips management hook
 */
import { useState, useCallback } from 'react'
import { clipsService } from '@/services/clips'
import { useApi, usePaginatedApi } from './useApi'
import { useDebouncedSearch } from './useDebounce'
import type { VideoClip, ClipSearchRequest, ClipSelectionRequest, ClipSelection } from '@/services/clips'

export const useClips = () => {
  const searchApi = usePaginatedApi<VideoClip>()
  const popularApi = useApi<VideoClip[]>()
  const trendingApi = useApi<VideoClip[]>()
  const favoritesApi = useApi<VideoClip[]>()
  const selectionApi = useApi<ClipSelection>()

  const [selectedClips, setSelectedClips] = useState<VideoClip[]>([])
  const [favorites, setFavorites] = useState<string[]>([])

  // Debounced search
  const debouncedSearch = useDebouncedSearch(
    async (query: string) => {
      const result = await clipsService.searchClips({ query, limit: 20 })
      return result.clips
    },
    300
  )

  const searchClips = useCallback((request: ClipSearchRequest, page = 1) => {
    return searchApi.execute(
      (pageNum, pageSize) => clipsService.searchClips({
        ...request,
        page: pageNum,
        limit: pageSize
      }),
      page
    )
  }, [searchApi])

  const loadMoreSearchResults = useCallback((request: ClipSearchRequest) => {
    return searchApi.loadMore(
      (pageNum, pageSize) => clipsService.searchClips({
        ...request,
        page: pageNum,
        limit: pageSize
      })
    )
  }, [searchApi])

  const selectClips = useCallback((request: ClipSelectionRequest) => {
    return selectionApi.execute(() => clipsService.selectClips(request))
  }, [selectionApi])

  const loadPopularClips = useCallback((category?: string, limit = 20) => {
    return popularApi.execute(() => clipsService.getPopularClips(category, limit))
  }, [popularApi])

  const loadTrendingClips = useCallback((limit = 20) => {
    return trendingApi.execute(() => clipsService.getTrendingClips(limit))
  }, [trendingApi])

  const loadFavoriteClips = useCallback(() => {
    return favoritesApi.execute(() => clipsService.getFavoriteClips())
  }, [favoritesApi])

  const getClipDetails = useCallback(async (clipId: string): Promise<VideoClip | null> => {
    try {
      return await clipsService.getClipDetails(clipId)
    } catch (error) {
      console.error('Error fetching clip details:', error)
      return null
    }
  }, [])

  const addToFavorites = useCallback(async (clipId: string): Promise<void> => {
    try {
      await clipsService.addToFavorites(clipId)
      setFavorites(prev => [...prev, clipId])
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }, [])

  const removeFromFavorites = useCallback(async (clipId: string): Promise<void> => {
    try {
      await clipsService.removeFromFavorites(clipId)
      setFavorites(prev => prev.filter(id => id !== clipId))
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }, [])

  const toggleFavorite = useCallback(async (clipId: string): Promise<void> => {
    const isFavorite = favorites.includes(clipId)
    if (isFavorite) {
      await removeFromFavorites(clipId)
    } else {
      await addToFavorites(clipId)
    }
  }, [favorites, addToFavorites, removeFromFavorites])

  const addToSelection = useCallback((clip: VideoClip) => {
    setSelectedClips(prev => {
      if (prev.some(c => c.id === clip.id)) return prev
      return [...prev, clip]
    })
  }, [])

  const removeFromSelection = useCallback((clipId: string) => {
    setSelectedClips(prev => prev.filter(clip => clip.id !== clipId))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedClips([])
  }, [])

  const isSelected = useCallback((clipId: string) => {
    return selectedClips.some(clip => clip.id === clipId)
  }, [selectedClips])

  const isFavorite = useCallback((clipId: string) => {
    return favorites.includes(clipId)
  }, [favorites])

  const validateSelection = useCallback((maxDuration: number) => {
    return clipsService.validateClipSelection(
      selectedClips.map(clip => ({
        ...clip,
        startTime: 0,
        endTime: clip.duration,
        clipDuration: clip.duration,
        reason: '',
        scriptMatch: ''
      })),
      maxDuration
    )
  }, [selectedClips])

  const formatDuration = useCallback((seconds: number) => {
    return clipsService.formatDuration(seconds)
  }, [])

  const formatFileSize = useCallback((bytes: number) => {
    return clipsService.formatFileSize(bytes)
  }, [])

  const getResolutionLabel = useCallback((width: number, height: number) => {
    return clipsService.getResolutionLabel(width, height)
  }, [])

  // Computed values
  const totalSelectionDuration = selectedClips.reduce((sum, clip) => sum + clip.duration, 0)
  const selectionCount = selectedClips.length

  return {
    // API states
    search: searchApi,
    popular: popularApi,
    trending: trendingApi,
    favorites: favoritesApi,
    selection: selectionApi,

    // Debounced search
    debouncedSearch,

    // Local state
    selectedClips,
    favorites,
    totalSelectionDuration,
    selectionCount,

    // Actions
    searchClips,
    loadMoreSearchResults,
    selectClips,
    loadPopularClips,
    loadTrendingClips,
    loadFavoriteClips,
    getClipDetails,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    addToSelection,
    removeFromSelection,
    clearSelection,

    // Utilities
    isSelected,
    isFavorite,
    validateSelection,
    formatDuration,
    formatFileSize,
    getResolutionLabel
  }
}