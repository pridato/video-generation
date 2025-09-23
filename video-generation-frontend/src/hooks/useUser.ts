/**
 * User management hook
 */
import { useState, useEffect, useCallback } from 'react'
import { userService } from '@/services/user'
import { useAuth } from './useAuth'
import type { UserProfile, UpdateProfileRequest, UsageStats } from '@/services/user'

interface UserState {
  profile: UserProfile | null
  usage: UsageStats | null
  isLoading: boolean
  error: string | null
}

export const useUser = () => {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState<UserState>({
    profile: null,
    usage: null,
    isLoading: false,
    error: null
  })

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const profile = await userService.getProfile()
      setState(prev => ({ ...prev, profile, isLoading: false }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar perfil'
      }))
    }
  }, [isAuthenticated])

  const updateProfile = useCallback(async (request: UpdateProfileRequest): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const updatedProfile = await userService.updateProfile(request)
      setState(prev => ({ ...prev, profile: updatedProfile, isLoading: false }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar perfil'
      }))
      throw error
    }
  }, [])

  const fetchUsage = useCallback(async (period: UsageStats['period'] = 'month') => {
    if (!isAuthenticated) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const usage = await userService.getUsageStats(period)
      setState(prev => ({ ...prev, usage, isLoading: false }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar estadísticas'
      }))
    }
  }, [isAuthenticated])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      await userService.changePassword({ currentPassword, newPassword })
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cambiar contraseña'
      }))
      throw error
    }
  }, [])

  const updatePreference = useCallback(async (key: string, value: any): Promise<void> => {
    if (!state.profile) return

    const updatedPreferences = {
      ...state.profile.preferences,
      [key]: value
    }

    setState(prev => ({
      ...prev,
      profile: prev.profile ? {
        ...prev.profile,
        preferences: updatedPreferences
      } : null
    }))

    try {
      await userService.updateProfile({ preferences: updatedPreferences })
    } catch (error) {
      // Revert on error
      setState(prev => ({
        ...prev,
        profile: prev.profile ? {
          ...prev.profile,
          preferences: state.profile!.preferences
        } : null,
        error: error instanceof Error ? error.message : 'Error al actualizar preferencia'
      }))
    }
  }, [state.profile])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const reset = useCallback(() => {
    setState({
      profile: null,
      usage: null,
      isLoading: false,
      error: null
    })
  }, [])

  // Load profile when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile()
    } else {
      reset()
    }
  }, [isAuthenticated, fetchProfile, reset])

  // Computed values
  const isSubscribed = state.profile?.subscriptionTier !== 'free'
  const isPremium = state.profile?.subscriptionTier === 'premium'
  const isSubscriptionActive = state.profile?.subscriptionStatus === 'active'

  const usagePercentages = state.profile ? {
    videos: userService.getUsagePercentage(
      state.profile.usage.videosGenerated,
      state.profile.usage.videosLimit
    ),
    storage: userService.getUsagePercentage(
      state.profile.usage.storageUsed,
      state.profile.usage.storageLimit
    ),
    apiCalls: userService.getUsagePercentage(
      state.profile.usage.apiCallsUsed,
      state.profile.usage.apiCallsLimit
    )
  } : null

  const isNearLimit = state.profile ? {
    videos: userService.isUsageNearLimit(
      state.profile.usage.videosGenerated,
      state.profile.usage.videosLimit
    ),
    storage: userService.isUsageNearLimit(
      state.profile.usage.storageUsed,
      state.profile.usage.storageLimit
    ),
    apiCalls: userService.isUsageNearLimit(
      state.profile.usage.apiCallsUsed,
      state.profile.usage.apiCallsLimit
    )
  } : null

  const hasReachedLimit = state.profile ? {
    videos: userService.isUsageLimitReached(
      state.profile.usage.videosGenerated,
      state.profile.usage.videosLimit
    ),
    storage: userService.isUsageLimitReached(
      state.profile.usage.storageUsed,
      state.profile.usage.storageLimit
    ),
    apiCalls: userService.isUsageLimitReached(
      state.profile.usage.apiCallsUsed,
      state.profile.usage.apiCallsLimit
    )
  } : null

  return {
    ...state,
    fetchProfile,
    updateProfile,
    fetchUsage,
    changePassword,
    updatePreference,
    clearError,
    reset,
    // Computed values
    isSubscribed,
    isPremium,
    isSubscriptionActive,
    usagePercentages,
    isNearLimit,
    hasReachedLimit,
    // Helper methods
    formatStorageSize: userService.formatStorageSize,
    getSubscriptionLabel: (tier: string) => userService.getSubscriptionLabel(tier as any),
    getSubscriptionStatusLabel: (status: string) => userService.getSubscriptionStatusLabel(status as any),
    getSubscriptionStatusColor: (status: string) => userService.getSubscriptionStatusColor(status as any)
  }
}