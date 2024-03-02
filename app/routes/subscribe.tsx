import { LoaderFunctionArgs, json, redirect } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import supabaseClient from '~/utils/supabase.server'
import NavigationBar from '~/components/navigationBar'
import PageWrapper from '~/components/pageWrapper'
import Header from '~/components/header'
import ProminentButton from '~/components/prominentButton'
import {
  ensureStripeCustomer,
  hasActiveSubscription,
  loadStripeProducts,
  loadStripePrices,
  createCheckoutSession,
} from '~/utils/stripe.server'
import { useFetcher } from '@remix-run/react'

export const action = async ({ request }: LoaderFunctionArgs) => {
  const formData = await request.formData()
  const priceId = formData.get('priceId') as string
  const stripeCustomerId = formData.get('stripeCustomerId') as string
  const session = await createCheckoutSession(priceId, stripeCustomerId)
  if (session) {
    return redirect(session.url || '/error')
  }
  return redirect('/error')
}

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
  const isSubscriber = await hasActiveSubscription(stripeCustomerId ?? undefined)
  const availableProducts = await loadStripeProducts()
  const productsWithPrices = []
  for (const product of availableProducts) {
    const prices = await loadStripePrices(product.id)
    productsWithPrices.push({ product, prices })
  }

  return json({ productsWithPrices, stripeCustomerId, isSubscriber })
}

interface Price {
  id: string
  currency: string
  unit_amount: number
  nickname: string
}

interface LoaderData {
  productsWithPrices: { product: any; prices: any }[]
  stripeCustomerId: string
  isSubscriber: boolean
}

const PaymentPage = () => {
  const { productsWithPrices, stripeCustomerId, isSubscriber } = useLoaderData() as LoaderData
  const fetcher = useFetcher()

  const checkout = async (priceId: string) => {
    await fetcher.submit({ priceId, stripeCustomerId }, { method: 'POST', action: '/subscribe' })
  }

  if (isSubscriber) {
    return (
      <>
        <NavigationBar />
        <PageWrapper>
          <Header>You are subscribed</Header>
          <p className='my-12 text-whitish'>You are already subscribed to Untangled Notes Plus.</p>
        </PageWrapper>
      </>
    )
  }

  return (
    <>
      <NavigationBar />
      <PageWrapper>
        <Header>Subscribe to Untangled Notes Plus</Header>
        <p className='my-12 text-whitish'>
          To unlock Untangled Notes Plus, select a subscription tier.
        </p>
        <div className='flex w-11/12 max-2xl m-auto mt-8'>
          {productsWithPrices.map(({ product, prices }) => (
            <div key={product.id} className='w-full'>
              <h2 className='text-xl mb-8'>{product.name}</h2>
              <p className='card-description'>{product.description}</p>
              <div className='flex justify-around'>
                {prices.map((price: Price) => (
                  <div key={price.id}>
                    <p>{price.nickname}</p>
                    <p>
                      {price.currency.toUpperCase()} {price.unit_amount / 100}
                    </p>
                    <ProminentButton
                      onClick={() => {
                        checkout(price.id)
                      }}
                    >
                      Buy Now
                    </ProminentButton>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageWrapper>
    </>
  )
}
export default PaymentPage
