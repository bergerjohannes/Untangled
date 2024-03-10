import { LoaderFunctionArgs, json, redirect } from '@remix-run/node'
import { Link, useLoaderData, useLocation, useNavigate } from '@remix-run/react'
import supabaseClient from '~/utils/supabase.server'
import { useOutletContext } from '@remix-run/react'
import { useEffect, useState } from 'react'
import ProminentButton from '~/components/prominentButton'
import { hasOrHadAnySubscription } from '~/utils/stripe.server'
import type { SupabaseOutletContext } from '~/root'
import { Session, User } from '@supabase/gotrue-js/src/lib/types'
import Header from '~/components/header'
import SimpleButton from '~/components/simpleButton'

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

  const isOrWasSubscriber = await hasOrHadAnySubscription(userId)

  const { data: profile } = await supabase.from('profiles').select().limit(1)

  return json(
    { profile: profile ? profile[0] : null, showBillingPortal: isOrWasSubscriber },
    { headers: response.headers }
  )
}

export default function Profile() {
  const { profile, showBillingPortal } = useLoaderData<typeof loader>()
  const { supabase } = useOutletContext<SupabaseOutletContext>()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
  }, [])

  const logOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error(error)
    } else {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <>
        <Header>Profile</Header>
      </>
    )
  }

  return (
    <>
      <Header>Profile</Header>
      {user && (
        <p className='mb-16'>
          You are logged in as <span className='underline underline-offset-2'>{user.email}</span>
        </p>
      )}
      {showBillingPortal && (
        <Link to='/billing'>
          <ProminentButton>Manage billing</ProminentButton>
        </Link>
      )}
      {!showBillingPortal && (
        <Link to='/subscribe'>
          <ProminentButton>Subscribe</ProminentButton>
        </Link>
      )}
      <div className='mt-16'>
        <SimpleButton onClick={() => logOut()}>Log out</SimpleButton>
      </div>
    </>
  )
}
