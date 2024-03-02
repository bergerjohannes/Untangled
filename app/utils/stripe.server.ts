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
    console.error('Error ensuring Stripe customer:', error.message)
  }
  return null
}

export const hasActiveSubscription = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error('Invalid user ID')
  }
  try {
    const user = await getUserProfile(userId)
    if (!user.stripe_customer_id) {
      throw new Error('Stripe customer ID not found for this user')
    }
    const subscriptions = await stripe.subscriptions.list({ customer: user.stripe_customer_id })
    return subscriptions.data.length > 0 // TODO: check if they are active
  } catch (error: any) {
    console.error('Error checking for active subscription:', error.message)
    return false
  }
}

export const loadStripeProducts = async () => {
  try {
    const products = await stripe.products.list()
    return products.data
  } catch (error: any) {
    console.error('Error loading Stripe products:', error.message)
    return []
  }
}

export const loadStripePrices = async (productId: string) => {
  try {
    const prices = await stripe.prices.list({ product: productId })
    return prices.data
  } catch (error: any) {
    console.error('Error loading Stripe prices:', error.message)
    return []
  }
}

export const createCheckoutSession = async (priceId: string, stripeCustomerId: string) => {
  console.log('createCheckoutSession 1: ', priceId)
  console.log('createCheckoutSession 2: ', stripeCustomerId)
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
    console.error('Error creating Stripe checkout session:', error.message)
    return null
  }
}
