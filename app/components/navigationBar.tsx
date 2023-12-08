import { Link } from '@remix-run/react'
import { SimpleLogo } from './logo'
import { useOutletContext } from '@remix-run/react'
import { SupabaseOutletContext } from '~/root'
import { useEffect, useState } from 'react'

import { Session, User } from '@supabase/gotrue-js/src/lib/types'

const NavigationBar = ({ withoutMenu = false }) => {
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
      <Link to='/' className='flex items-center justify-center mr-4'>
        <SimpleLogo />
      </Link>
    </li>
  )

  if (loading) {
    return (
      <div className='w-full p-4' style={{ backdropFilter: 'blur(10px)' }}>
        <ul className='flex justify-start items-center'>{renderLogo()}</ul>
      </div>
    )
  }

  return (
    <nav
      className='flex justify-start sticky top-0 z-50 w-full'
      style={{
        background: 'linear-gradient(transparent, rgba(18, 20, 24, 1))',
      }}
    >
      <div className='w-full p-4' style={{ backdropFilter: 'blur(10px)' }}>
        <ul className='flex justify-start items-center'>
          {renderLogo()}
          {!user && (
            <li className='flex space-x-4'>
              <Link to='/' className='px-2 rounded hover:opacity-100 opacity-40 text-sm sm:text-base'>
                Record
              </Link>
              <Link to='/signup' className='px-2 rounded hover:opacity-100 opacity-40 text-sm sm:text-base'>
                Sign Up
              </Link>
            </li>
          )}
          {user && !withoutMenu && (
            <li className='flex space-x-4'>
              <Link to='/' className='px-2 rounded hover:opacity-100 opacity-40 text-sm sm:text-base'>
                Record
              </Link>
              <Link to='/notes' className='px-2 rounded hover:opacity-100 opacity-40 text-sm sm:text-base'>
                Notes
              </Link>
              <Link to='/profile' className='px-2 rounded hover:opacity-100 opacity-40 text-sm sm:text-base'>
                Profile
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default NavigationBar
