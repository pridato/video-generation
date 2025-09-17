import Stripe from 'stripe'

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

// Stripe price IDs for each plan
export const STRIPE_PRICES = {
  creator_monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
  creator_yearly: process.env.STRIPE_PRICE_CREATOR_YEARLY!,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY!,
}

// Helper function to create a checkout session
export async function createCheckoutSession({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
  metadata = {}
}: {
  priceId: string
  customerId?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: customerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata,
    })

    return { sessionId: session.id, url: session.url }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw new Error('Failed to create checkout session')
  }
}

// Helper function to create a customer portal session
export async function createPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw new Error('Failed to create portal session')
  }
}

// Helper function to get subscription details
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer'],
    })

    return subscription
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    return null
  }
}

// Helper function to cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId)
    return subscription
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw new Error('Failed to cancel subscription')
  }
}

// Helper function to get customer by email
export async function getCustomerByEmail(email: string) {
  try {
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    })

    return customers.data[0] || null
  } catch (error) {
    console.error('Error getting customer by email:', error)
    return null
  }
}

// Helper function to create a customer
export async function createCustomer(email: string, name?: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    })

    return customer
  } catch (error) {
    console.error('Error creating customer:', error)
    throw new Error('Failed to create customer')
  }
}