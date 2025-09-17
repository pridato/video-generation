import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/services/supabase/server'
import { stripe } from '@/lib/services/stripe'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Verificar autenticación
    const supabase = createClient()
    const { data: { user }, error: authError } = await (await supabase).auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Obtener sesión de Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'subscription']
      })

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      // Verificar que la sesión pertenece al usuario autenticado
      if (session.metadata?.userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Verificar que el pago fue exitoso
      if (session.payment_status !== 'paid') {
        return NextResponse.json({
          error: 'Payment not completed',
          status: session.payment_status
        }, { status: 400 })
      }

      // Obtener detalles del plan desde los metadatos
      const planId = session.metadata?.planId || 'pro'
      const isAnnual = session.metadata?.isAnnual === 'true'

      // Mapear información del plan
      const planDetails = {
        starter: {
          name: 'Starter',
          credits: 50,
          features: [
            '50 videos mensuales',
            'Templates premium',
            'Exportación HD',
            'Soporte por email'
          ]
        },
        pro: {
          name: 'Pro',
          credits: 200,
          features: [
            '200 videos mensuales',
            'Todos los templates',
            'Code-to-Video AI',
            'Analytics avanzados',
            'Soporte prioritario'
          ]
        },
        enterprise: {
          name: 'Enterprise',
          credits: 1000,
          features: [
            'Videos ilimitados',
            'API personalizada',
            'Gestión de equipos',
            'Soporte dedicado',
            'Integración personalizada'
          ]
        }
      }

      const plan = planDetails[planId as keyof typeof planDetails] || planDetails.pro

      // Actualizar perfil del usuario en Supabase
      const subscriptionTier = planId.toUpperCase() as 'STARTER' | 'PRO' | 'ENTERPRISE'

      await (await supabase)
        .from('profiles')
        .update({
          subscription_tier: subscriptionTier,
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          plan_id: planId,
          is_annual: isAnnual,
          credits: plan.credits,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      // Retornar información del pago verificado
      return NextResponse.json({
        success: true,
        sessionId,
        planId,
        planName: plan.name,
        isAnnual,
        credits: plan.credits,
        features: plan.features,
        amount: session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00',
        currency: session.currency?.toUpperCase() || 'EUR',
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
        timestamp: new Date(session.created * 1000).toISOString()
      })

    } catch (stripeError) {
      console.error('Stripe API error:', stripeError)
      return NextResponse.json({
        error: 'Failed to verify payment with Stripe'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}