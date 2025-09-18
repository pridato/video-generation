import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)

// Credit packages with Stripe price mapping
const CREDIT_PACKAGES = {
  '10': {
    amount: 10,
    price: 5, // €5 for 10 credits
    priceId: 'price_credits_10' // You need to create this in Stripe
  },
  '25': {
    amount: 25,
    price: 10, // €10 for 25 credits
    priceId: 'price_credits_25'
  },
  '50': {
    amount: 50,
    price: 18, // €18 for 50 credits (10% discount)
    priceId: 'price_credits_50'
  },
  '100': {
    amount: 100,
    price: 30, // €30 for 100 credits (25% discount)
    priceId: 'price_credits_100'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { credits, userId } = await request.json()

    // Validate credit package
    if (!CREDIT_PACKAGES[credits as keyof typeof CREDIT_PACKAGES]) {
      return NextResponse.json(
        { error: 'Invalid credit package' },
        { status: 400 }
      )
    }

    const package_info = CREDIT_PACKAGES[credits as keyof typeof CREDIT_PACKAGES]

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let customerId = user.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })

      customerId = customer.id

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create Stripe checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${package_info.amount} Créditos ShortsAI`,
              description: `Paquete de ${package_info.amount} créditos para generar videos`,
              images: ['https://your-domain.com/credits-image.png'], // Add your image
            },
            unit_amount: package_info.price * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits_purchased=${package_info.amount}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        type: 'credits',
        userId: user.id,
        credits: package_info.amount.toString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating credit purchase session:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase session' },
      { status: 500 }
    )
  }
}