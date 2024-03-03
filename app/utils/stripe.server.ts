import Stripe from 'stripe'
import { supabase } from '~/utils/supabase.server'

const stripe = new Stripe(process.env.STRIPE_API_SECRET_KEY as string)

const getUserProfile = async (userId: string) => {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

export const ensureStripeCustomer = async (
  userId: string | undefined,
  email: string | undefined
): Promise<string | null> => {
  if (!userId || !email) {
    throw new Error('Invalid user ID or email')
  }
  try {
    const user = await getUserProfile(userId)

    if (!user.stripe_customer_id) {
      const customer = await stripe.customers.create({
        email: email,
        name: user.username,
        metadata: {
          supabaseUserId: userId,
        },
      })
      await supabase.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId)
      return customer.id
    } else {
      return user.stripe_customer_id
    }
  } catch (error: any) {
    return null
  }
}

export const hasActiveSubscription = async (stripeCustomerId: string | undefined) => {
  if (!stripeCustomerId) {
    throw new Error('Stripe customer ID not provided')
  }
  try {
    const subscriptions = await stripe.subscriptions.list({ customer: stripeCustomerId })
    return subscriptions.data.some((subscription) => subscription.status === 'active')
  } catch (error: any) {
    return false
  }
}

export const loadStripeProducts = async () => {
  try {
    const products = await stripe.products.list({ active: true })
    return products.data
  } catch (error: any) {
    return []
  }
}

export const loadStripePrices = async (productId: string) => {
  try {
    const prices = await stripe.prices.list({ product: productId })
    return prices.data
  } catch (error: any) {
    return []
  }
}

export const createCheckoutSession = async (priceId: string, stripeCustomerId: string) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'http://localhost:3000/payments/success',
      cancel_url: 'http://localhost:3000/payments/abort',
      customer: stripeCustomerId,
    })
    return session
  } catch (error: any) {
    return null
  }
}

const updateSubscriptionStatus = async (
  subscription: Stripe.Subscription,
  stripeCustomerId: string
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
    })
    .eq('stripe_customer_id', stripeCustomerId)
}

export const handleStripeWebhook = async (request: Request, response: Response) => {
  const sig = request.headers.get('stripe-signature')
  let event
  const payload = await request.text()

  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set')
    if (!sig) throw new Error('Stripe signature not found in headers')
    event = stripe.webhooks.constructEvent(payload, sig, secret)
  } catch (err: any) {
    return new Response('Webhook Error:' + err.message, { status: 400 })
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object
    if (session.payment_status === 'paid') {
      if (typeof session.subscription === 'string') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        if (subscription) {
          if (typeof session.customer === 'string') {
            await updateSubscriptionStatus(subscription, session.customer)
          } else {
            throw new Error('Customer ID not set')
          }
        } else {
          throw new Error('Subscription ID nost set')
        }
      }
    }

    return new Response('Webhook received', { status: 200 })
  } else if (
    event.type === 'customer.subscription.deleted' ||
    event.type === 'customer.subscription.updated'
  ) {
    const subscription = event.data.object
    if (typeof subscription.customer === 'string') {
      await updateSubscriptionStatus(subscription, subscription.customer)
      return new Response('Webhook received', { status: 200 })
    } else {
      throw new Error('Customer ID not set')
    }
  }
}

export const createBillingPortal = async (stripeCustomerId: string) => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: 'http://localhost:3000/profile',
    })
    return session
  } catch (error: any) {
    return null
  }
}