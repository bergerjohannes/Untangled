import type { MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { useOutletContext } from '@remix-run/react'

import type { SupabaseOutletContext } from '~/root'
import { Session, User } from '@supabase/gotrue-js/src/lib/types'

export const meta: MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }]
}

export default function Index() {
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
    <div className='pt-24 flex flex-col items-center font-bold text-3xl bg-blackish text-whitish'>
      <span className='mt-24'>↓</span>
      <div className='mt-24 flex items-center space-x-4'>
        <Link to='/dashboard'>Dashboard</Link>
        <Link to='/profile'>Profile</Link>
      </div>
    </div>
  )
}
