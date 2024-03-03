import { ActionFunctionArgs } from '@remix-run/node'
import { handleStripeWebhook } from '~/utils/stripe.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const response = new Response()
    const result = await handleStripeWebhook(request, response)
    return result || new Response('No response from Stripe webhook', { status: 500 })
  } catch (error) {
    console.error('Error handling Stripe webhook:', error)
    return new Response('Error handling Stripe webhook', { status: 500 })
  }
}
