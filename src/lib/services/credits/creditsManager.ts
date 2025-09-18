import { createClient } from '@/lib/services/supabase/client'
import { useEffect, useState } from 'react'

export interface CreditStatus {
  used: number
  limit: number
  remaining: number
  canCreateVideo: boolean
  tier: 'free' | 'pro' | 'enterprise'
}

export class CreditsManager {
  private supabase = createClient()

  /**
   * Obtener estado de créditos del usuario
   * @param userId ID del usuario
   * @returns Estado de créditos o null si error
   */
  async getCreditStatus(userId: string): Promise<CreditStatus | null> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('monthly_videos_used, monthly_limit, subscription_tier')
        .eq('id', userId)
        .single()

      if (error || !profile) {
        console.error('Error fetching credit status:', error)
        return null
      }

      // Calcular créditos restantes (limite - usados)
      const remaining = Math.max(0, profile.monthly_limit - profile.monthly_videos_used)

      return {
        used: profile.monthly_videos_used,
        limit: profile.monthly_limit,
        remaining,
        canCreateVideo: remaining > 0,
        tier: profile.subscription_tier as 'free' | 'pro' | 'enterprise'
      }
    } catch (error) {
      console.error('Credits status error:', error)
      return null
    }
  }

  /**
   * Consumir un crédito (al crear un video)
   * @param userId  ID del usuario
   * @returns  True si se consumió con éxito, false si error
   * @throws Error si no hay créditos suficientes
   */
  async consumeCredit(userId: string): Promise<boolean> {
    try {
      // Verificar que el usuario puede crear video (que tenga créditos)
      const status = await this.getCreditStatus(userId)
      if (!status || !status.canCreateVideo) {
        throw new Error('Insufficient credits')
      }

      // Actualizar contadores

      // Incrementar total_videos_created usando 
      const { error } = await this.supabase
        .from('profiles')
        .update({
          monthly_videos_used: status.used + 1,
          last_video_created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      // Incrementar total_videos_created en una consulta separada
      if (!error) {
        await this.supabase
          .from('profiles')
          .update({ total_videos_created: this.supabase.rpc('increment_total_videos_created', { user_id: userId }) })
          .eq('id', userId)
      }

      if (error) {
        console.error('Error consuming credit:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Credit consumption error:', error)
      return false
    }
  }

  
  /**
   * Actualizar límite mensual (ej. al hacer upgrade de plan)
   * @param userId ID del usuario
   * @param newLimit Nuevo límite mensual
   * @returns True si se actualizó con éxito, false si error
   * @throws Error si el nuevo límite es inválido
   */
  async updateMonthlyLimit(userId: string, newLimit: number): Promise<boolean> {
    try {
        // Actualizar el límite mensual en la base de datos (devuelve true si éxito)
        const { error } = await this.supabase
        .from('profiles')
        .update({
            monthly_limit: newLimit,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      return !error // true si no hay error
    } catch (error) {
      console.error('Error updating monthly limit:', error)
      return false
    }
  }

  /**
   * Reset mensual automático (ejecutar con cron job)
   * 
   * @throws Error si falla el reseteo
   */
  async resetMonthlyUsage(): Promise<void> {
    try {
        // Llamar a función RPC para resetear monthly_videos_used a 0 para todos los usuarios (funciona mensualmente)
        const { error } = await this.supabase.rpc('reset_monthly_usage')
      
        if (error) {
            console.error('Error resetting monthly usage:', error)
        }
    } catch (error) {
      console.error('Monthly reset error:', error)
    }
  }

  /**
   * Obtener límites según tier de suscripción
   * @param tier Nivel de suscripción
   * @returns Límite mensual por defecto
   */
  static getDefaultLimits(tier: 'free' | 'pro' | 'enterprise'): number {
    const limits = {
      free: 5,
      pro: 100,
      enterprise: 500
    }
    return limits[tier]
  }
}

// Instancia singleton para usar en toda la app
export const creditsManager = new CreditsManager()

/**
 * Hook para manejar créditos de usuario
 * @param userId ID del usuario
 * @returns Estado de créditos, función para consumir crédito, y función para refetch
 */
export function useCredits(userId?: string) {
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null)
  const [loading, setLoading] = useState(true)

  // cada vez que cambia userId, refetch de créditos
  useEffect(() => {
    if (userId) {
      creditsManager.getCreditStatus(userId)
        .then(setCreditStatus)
        .finally(() => setLoading(false))
    }
  }, [userId])


    /**
     * Consumir un crédito (al crear un video)
     * @returns True si se consumió con éxito, false si error
     * @throws Error si no hay créditos suficientes
     */
    const consumeCredit = async () => {
        if (!userId) return false

        const success = await creditsManager.consumeCredit(userId)
        if (success && creditStatus) {
            // Actualizar estado local
            setCreditStatus({
            ...creditStatus,
            used: creditStatus.used + 1,
            remaining: creditStatus.remaining - 1,
            canCreateVideo: creditStatus.remaining > 1
            })
        }
        return success
    }


    // Retornar estado, función para consumir crédito, y función para refetch
    return {
        creditStatus,
        loading,
        consumeCredit,
        refetch: () => {
            if (userId) {
            creditsManager.getCreditStatus(userId).then(setCreditStatus)
            }
        }
    }
}