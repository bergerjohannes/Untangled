import { Link } from '@remix-run/react'
import { SimpleLogo } from './logo'
import { useOutletContext } from '@remix-run/react'
import { SupabaseOutletContext } from '~/root'
import { useEffect, useState } from 'react'

import { Session, User } from '@supabase/gotrue-js/src/lib/types'
import SimpleButton from './simpleButton'

enum Theme {
  Dark = 'dark',
  Light = 'light',
}

const NavigationBar = ({ withoutMenu = false, theme = Theme.Dark }) => {
  const { supabase } = useOutletContext<SupabaseOutletContext>()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
  }, [])

  const renderLogo = () => (
    <li>
      <Link
        to='/'
        className={`flex items-center justify-center mr-4 ${
          theme === Theme.Light ? 'text-whitish' : 'text-blackish'
        }`}
      >
        <SimpleLogo />
      </Link>
    </li>
  )

  if (loading) {
    return (
      <div
        className={`w-full p-4 ${theme === Theme.Light ? 'bg-whitish' : 'bg-blackish'}`}
        style={{ backdropFilter: 'blur(10px)' }}
      >
        <ul className='flex justify-start items-center'>{renderLogo()}</ul>
      </div>
    )
  }

  return (
    <nav
      className={`flex justify-start sticky top-0 z-50 w-full ${
        theme === Theme.Light ? 'bg-whitish' : 'bg-ish'
      }`}
      style={{
        background: 'linear-gradient(transparent, rgba(18, 20, 24, 1))',
      }}
    >
      <div className='w-full p-4' style={{ backdropFilter: 'blur(10px)' }}>
        <ul className='flex justify-start items-center'>
          {renderLogo()}
          {!user && (
            <li className='flex space-x-4'>
              <Link to='/'>
                <SimpleButton>Record</SimpleButton>
              </Link>
              <Link to='/signup'>
                <SimpleButton>Sign Up</SimpleButton>
              </Link>
            </li>
          )}
          {user && !withoutMenu && (
            <li className='flex space-x-4'>
              <Link to='/'>
                <SimpleButton>Record</SimpleButton>
              </Link>
              <Link to='/notes'>
                <SimpleButton>Notes</SimpleButton>
              </Link>
              <Link to='/profile'>
                <SimpleButton>Profile</SimpleButton>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default NavigationBar
