import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/services/supabase/server'
import { createCheckoutSession, getCustomerByEmail, createCustomer } from '@/lib/stripe'
import { STRIPE_PRICES } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { planId, isAnnual } = await request.json()

    // Get user from Supabase
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Map plan ID to Stripe price ID
    let priceId: string
    const suffix = isAnnual ? '_yearly' : '_monthly'

    switch (planId) {
      case 'creator':
        priceId = STRIPE_PRICES[`creator${suffix}` as keyof typeof STRIPE_PRICES]
        break
      case 'pro':
        priceId = STRIPE_PRICES[`pro${suffix}` as keyof typeof STRIPE_PRICES]
        break
      case 'enterprise':
        priceId = STRIPE_PRICES[`enterprise${suffix}` as keyof typeof STRIPE_PRICES]
        break
      default:
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Get or create Stripe customer
    let customer = await getCustomerByEmail(user.email!)
    if (!customer) {
      customer = await createCustomer(user.email!, user.user_metadata?.full_name)
    }

    // Create checkout session
    const { sessionId, url } = await createCheckoutSession({
      priceId,
      customerId: customer.id,
      successUrl: `${request.nextUrl.origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${request.nextUrl.origin}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        planId,
        isAnnual: isAnnual.toString(),
      },
    })

    return NextResponse.json({ sessionId, url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}