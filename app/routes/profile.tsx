import { LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData, useLocation, useNavigate } from '@remix-run/react'
import supabaseClient from '~/utils/supabase.server'
import { useOutletContext } from '@remix-run/react'
import { useEffect, useState } from 'react'
import NavigationBar from '~/components/navigationBar'
import Button from '~/components/prominentButton'

import type { SupabaseOutletContext } from '~/root'
import { Session, User } from '@supabase/gotrue-js/src/lib/types'
import PageWrapper from '~/components/pageWrapper'
import Header from '~/components/header'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response()
  const supabase = supabaseClient({ request, response })

  const { data: profile } = await supabase.from('profiles').select().limit(1)

  return json({ profile: profile ? profile[0] : null }, { headers: response.headers })
}

export default function Profile() {
  const { profile } = useLoaderData<typeof loader>()
  const { supabase } = useOutletContext<SupabaseOutletContext>()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
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

  if (user === null) {
    return (
      <>
        <NavigationBar withoutMenu />
        <PageWrapper>
          <Header>Profile</Header>
          <p>You are not logged in.</p>
          <Link to='/login' state={{ from: location }}>
            Log in!
          </Link>
        </PageWrapper>
      </>
    )
  }

  return (
    <>
      <NavigationBar />
      <PageWrapper>
        <Header>Profile</Header>
        {profile && <p className='mb-16'>You are logged in as {profile.username}</p>}
        <Button onClick={() => logOut()}>Log out</Button>
      </PageWrapper>
    </>
  )
}
