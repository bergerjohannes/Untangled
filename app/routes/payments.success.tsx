import { useOutletContext } from '@remix-run/react'
import { useState, useEffect } from 'react'
import { Session, User } from '@supabase/gotrue-js/src/lib/types'
import type { SupabaseOutletContext } from '~/root'
import NavigationBar from '~/components/navigationBar'
import PageWrapper from '~/components/pageWrapper'
import Header from '~/components/header'

export default function PaymentSuccess() {
  const { supabase } = useOutletContext<SupabaseOutletContext>()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
    })
  }, [])

  return (
    <>
      <NavigationBar />

      <PageWrapper>
        <Header>Payment Successful</Header>
        <p className='my-12 text-whitish'>
          Thank you for your payment. Your subscription is now active.
        </p>
      </PageWrapper>
    </>
  )
}
