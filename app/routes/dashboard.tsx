import { Link, useLocation, useNavigate } from '@remix-run/react'
import { useOutletContext } from '@remix-run/react'
import { useEffect, useState } from 'react'

import type { SupabaseOutletContext } from '~/root'
import { Session, User } from '@supabase/gotrue-js/src/lib/types'

export default function Profile() {
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

  if (user === null) {
    return (
      <div className='flex flex-col items-center'>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p>You are not logged in.</p>
        <Link to='/login' state={{ from: location }}>
          Log in!
        </Link>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center'>
      <h1 className='text-3xl font-bold'>Dashboard</h1>
    </div>
  )
}
