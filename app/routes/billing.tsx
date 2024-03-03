import { redirect } from '@remix-run/node'
import { LoaderFunctionArgs } from '@remix-run/node'
import supabaseClient from '~/utils/supabase.server'
import { ensureStripeCustomer, createBillingPortal } from '~/utils/stripe.server'


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response()
  const supabase = supabaseClient({ request, response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id ?? null
  if (!userId) {
    return redirect('/signup')
  }
  const stripeCustomerId = await ensureStripeCustomer(userId, session?.user?.email)
  if (!stripeCustomerId) {
    return redirect('/payments/error')
  }
  const portalSession = await createBillingPortal(stripeCustomerId)
  if (!portalSession) {
    return redirect('/payments/error')
  }
  return redirect(portalSession.url)
}
