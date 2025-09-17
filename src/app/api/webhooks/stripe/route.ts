import { headers } from 'next/headers'
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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Helper function to map Stripe price IDs to subscription tiers
const getPlanFromPriceId = (priceId: string): string => {
  switch (priceId) {
    case process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID:
      return 'CREATOR'
    case process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID:
      return 'PRO'
    case process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID:
      return 'ENTERPRISE'
    default:
      return 'FREE'
  }
}

async function updateUserSubscription(
  customerId: string,
  subscriptionData: any,
  status: string
) {
  try {
    // Get user by stripe_customer_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (userError) {
      console.error('Error finding user:', userError)
      return false
    }

    const priceId = subscriptionData.items?.data[0]?.price?.id
    const subscriptionTier = getPlanFromPriceId(priceId)

    // Update user subscription info
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_tier: status === 'active' ? subscriptionTier : 'FREE',
        subscription_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id)

    if (updateError) {
      console.error('Error updating user subscription:', updateError)
      return false
    }

    console.log(`Updated user ${userData.id} subscription to ${subscriptionTier} with status ${status}`)
    return true
  } catch (error) {
    console.error('Error in updateUserSubscription:', error)
    return false
  }
}

async function updateUserCredits(userId: string, creditsToAdd: number) {
  try {
    // Get current user credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error finding user for credits:', userError)
      return false
    }

    const currentCredits = userData.credits || 0
    const newCredits = currentCredits + creditsToAdd

    // Update user credits
    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user credits:', updateError)
      return false
    }

    console.log(`Added ${creditsToAdd} credits to user ${userId}. New total: ${newCredits}`)
    return true
  } catch (error) {
    console.error('Error in updateUserCredits:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  console.log('Received webhook event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription' && session.customer && session.subscription) {
          // Handle subscription purchase
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          await updateUserSubscription(
            session.customer as string,
            subscription,
            subscription.status
          )
        } else if (session.mode === 'payment' && session.metadata?.type === 'credits') {
          // Handle credit purchase
          await updateUserCredits(
            session.metadata.userId,
            parseInt(session.metadata.credits)
          )
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription

        await updateUserSubscription(
          subscription.customer as string,
          subscription,
          subscription.status
        )
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        await updateUserSubscription(
          subscription.customer as string,
          subscription,
          subscription.status
        )
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await updateUserSubscription(
          subscription.customer as string,
          subscription,
          'canceled'
        )
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription && invoice.customer) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )

          await updateUserSubscription(
            invoice.customer as string,
            subscription,
            'active'
          )
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription && invoice.customer) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )

          await updateUserSubscription(
            invoice.customer as string,
            subscription,
            'past_due'
          )
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}