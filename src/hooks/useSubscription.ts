'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  email: string
  subscription_tier: 'FREE' | 'CREATOR' | 'PRO' | 'ENTERPRISE'
  stripe_customer_id?: string
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'incomplete'
  credits: number
  videos_used: number
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

        // Get user profile from auth.users table
        const { data, error } = await supabase
          .from('users')
          .select('id, email, subscription_tier, stripe_customer_id, subscription_status, credits, videos_used, created_at, updated_at')
          .eq('id', authUser.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // If user doesn't exist, create with default values
          if (error.code === 'PGRST116') {
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                id: authUser.id,
                email: authUser.email,
                subscription_tier: 'FREE',
                credits: 0,
                videos_used: 0
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

  const isActive = user?.subscription_status === 'active' || user?.subscription_tier !== 'FREE'
  const isPastDue = user?.subscription_status === 'past_due'
  const isCanceled = user?.subscription_status === 'canceled'

  // Helper functions to check plan access based on subscription_tier
  const hasAccess = (feature: string) => {
    if (!user) return false

    switch (user.subscription_tier) {
      case 'FREE':
        return ['basic_templates'].includes(feature)
      case 'CREATOR':
        return ['basic_templates', 'hd_resolution', '50_videos', 'premium_voices'].includes(feature)
      case 'PRO':
        return ['basic_templates', 'premium_templates', 'hd_resolution', '4k_resolution', 'analytics', '200_videos', 'premium_voices', 'PRO'].includes(feature)
      case 'ENTERPRISE':
        return true // All features
      default:
        return false
    }
  }

  const getVideoLimit = () => {
    if (!user) return 5 // Not logged in

    switch (user.subscription_tier) {
      case 'FREE':
        return 5
      case 'CREATOR':
        return 50
      case 'PRO':
        return 200
      case 'ENTERPRISE':
        return -1 // Unlimited
      default:
        return 5
    }
  }

  const getCredits = () => {
    return user?.credits || 0
  }

  const getVideosUsed = () => {
    return user?.videos_used || 0
  }

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('users')
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
    getCredits,
    getVideosUsed,
    updateUserProfile,
    createCheckoutSession,
    manageBilling,
  }
}