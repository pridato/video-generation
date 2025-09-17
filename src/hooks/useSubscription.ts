'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'incomplete'
  is_annual: boolean
  current_period_start: string
  current_period_end: string
  canceled_at?: string
  created_at: string
  updated_at: string
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        setSubscription(data)
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError(String(err))
          }
        } else {
          setError(String(err))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setSubscription(null)
      } else if (event === 'SIGNED_IN') {
        fetchSubscription()
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

  const isActive = subscription?.status === 'active'
  const isPastDue = subscription?.status === 'past_due'
  const isCanceled = subscription?.status === 'canceled'

  // Helper functions to check plan access
  const hasAccess = (feature: string) => {
    if (!subscription || !isActive) return false

    switch (subscription.plan_id) {
      case 'creator':
        return ['basic_templates', 'hd_resolution', '50_videos'].includes(feature)
      case 'pro':
        return ['basic_templates', 'premium_templates', 'hd_resolution', '4k_resolution', 'analytics', '200_videos'].includes(feature)
      case 'enterprise':
        return true // All features
      default:
        return false
    }
  }

  const getVideoLimit = () => {
    if (!subscription || !isActive) return 5 // Free tier

    switch (subscription.plan_id) {
      case 'creator':
        return 50
      case 'pro':
        return 200
      case 'enterprise':
        return -1 // Unlimited
      default:
        return 5
    }
  }

  return {
    subscription,
    loading,
    error,
    isActive,
    isPastDue,
    isCanceled,
    hasAccess,
    getVideoLimit,
    createCheckoutSession,
    manageBilling,
  }
}