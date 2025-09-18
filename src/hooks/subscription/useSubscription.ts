'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/services/supabase/client'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  subscription_tier: 'free' | 'pro' | 'enterprise'
  monthly_videos_used: number
  monthly_limit: number
  total_videos_created: number
  content_niche?: string
  target_audience?: string
  preferred_language: string
  last_video_created_at?: string
  brand_colors: Record<string, unknown>
  stripe_customer_id?: string
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'inactive'
  created_at: string
  updated_at: string
}

export function useSubscription() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          setLoading(false)
          return
        }

        // Get user profile from auth.profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, subscription_tier, monthly_videos_used, monthly_limit, total_videos_created, content_niche, target_audience, preferred_language, last_video_created_at, brand_colors, stripe_customer_id, subscription_status, created_at, updated_at')
          .eq('id', authUser.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // If user doesn't exist, create with default values
          if (error.code === 'PGRST116') {
            const { data: newUser, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                email: authUser.email,
                subscription_tier: 'free',
                monthly_videos_used: 0,
                monthly_limit: 5,
                total_videos_created: 0,
                preferred_language: 'es',
                brand_colors: {}
              })
              .select()
              .single()

            if (insertError) throw insertError
            setUser(newUser)
          } else {
            throw error
          }
        } else {
          setUser(data)
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError(String(err))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'SIGNED_IN') {
        fetchUserProfile()
      }
    })

    return () => authSubscription.unsubscribe()
  }, [supabase])

  const createCheckoutSession = async (planId: string, isAnnual: boolean = false) => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, isAnnual }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }


      const { url } = await response.json()
      console.log('Redirecting to checkout URL:', url)
      window.location.href = url
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(String(err))
      }
    }
  }

  const manageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(String(err))
      }
    }
  }

  const isActive = user?.subscription_status === 'active' || user?.subscription_tier !== 'free'
  const isPastDue = user?.subscription_status === 'past_due'
  const isCanceled = user?.subscription_status === 'canceled'

  // Helper functions to check plan access based on subscription_tier
  const hasAccess = (feature: string, userRole: string) => {
    console.log("Checking access for feature:", feature, "with role:", userRole)
    switch (userRole) {
      case 'free':
        return ['basic_templates'].includes(feature)
      case 'pro':
        return ['basic_templates', 'premium_templates', 'hd_resolution', '4k_resolution', 'analytics', 'premium_voices'].includes(feature)
      case 'enterprise':
        return true // All features
      default:
        return false
    }
  }

  const getVideoLimit = () => {
    if (!user) return 5 // Not logged in
    return user.monthly_limit
  }

  const getRemainingVideos = () => {
    if (!user) return 0
    return Math.max(0, user.monthly_limit - user.monthly_videos_used)
  }

  const getVideosUsed = () => {
    return user?.monthly_videos_used || 0
  }

  const getTotalVideosCreated = () => {
    return user?.total_videos_created || 0
  }

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Update local state
      setUser({ ...user, ...updates })
      return true
    } catch (err) {
      console.error('Error updating user profile:', err)
      return false
    }
  }

    const getCredits = () => {
      if (!user) return 0
      return user.monthly_limit - user.monthly_videos_used
    }

  return {
    user,
    subscription: user, // For backward compatibility
    loading,
    error,
    isActive,
    isPastDue,
    isCanceled,
    hasAccess,
    getVideoLimit,
    getRemainingVideos,
    getTotalVideosCreated,
    getVideosUsed,
    updateUserProfile,
    createCheckoutSession,
    manageBilling,
    getCredits
  }
}