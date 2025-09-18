import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/services/supabase/server'
import Stripe from 'stripe'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, planId, isAnnual } = session.metadata!

        // Update user subscription in database
        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan_id: planId,
            is_annual: isAnnual === 'true',
            status: 'active',
            current_period_start: new Date(),
            current_period_end: new Date(Date.now() + (isAnnual === 'true' ? 365 : 30) * 24 * 60 * 60 * 1000),
          })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date(),
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'active',
              current_period_start: new Date(invoice.period_start * 1000),
              current_period_end: new Date(invoice.period_end * 1000),
            })
            .eq('stripe_subscription_id', invoice.subscription as string)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('stripe_subscription_id', invoice.subscription as string)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}