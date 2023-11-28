import { LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData, useLocation, useNavigate } from '@remix-run/react'
import supabaseClient from '~/utils/supabase.server'
import { useOutletContext } from '@remix-run/react'
import { useEffect, useState } from 'react'

import type { SupabaseOutletContext } from '~/root'
import { Session, User } from '@supabase/gotrue-js/src/lib/types'

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
      <div className='flex flex-col items-center'>
        <h1 className='text-3xl font-bold'>Profile</h1>
        <p>You are not logged in.</p>
        <Link to='/login' state={{ from: location }}>
          Log in!
        </Link>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center'>
      <h1 className='text-3xl font-bold'>Profile</h1>
      {profile && <p>You are logged in as {profile.username}</p>}
      <button onClick={() => logOut()}>Log out</button>
    </div>
  )
}
