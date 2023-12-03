import { Link } from '@remix-run/react'
import { SimpleLogo } from './logo'
import { useOutletContext } from '@remix-run/react'
import { SupabaseOutletContext } from '~/root'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'

import { Session, User } from '@supabase/gotrue-js/src/lib/types'

const NavigationBar = ({ withoutMenu = false }) => {
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
    <nav
      className='flex justify-start sticky top-0 z-50 w-full'
      style={{
        background: 'linear-gradient(transparent, rgba(18, 20, 24, 1))',
      }}
    >
      <div className='w-full p-4' style={{ backdropFilter: 'blur(10px)' }}>
        <ul className='flex justify-between'>
          <li>
            <Link to='/' className='flex items-center justify-center'>
              <SimpleLogo />
            </Link>
          </li>
          {!withoutMenu && (
            <li className='relative group'>
              <ul className='absolute -right-1 -top-1 mt-2 p-2 bg-blackish text-whitish rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-2 border-whitish'>
                <li>
                  <Link
                    to='/profile'
                    className='block px-2 py-1 rounded hover:bg-whitish hover:text-blackish'
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    to='/notes'
                    className='block px-2 py-1 rounded hover:bg-whitish hover:text-blackish'
                  >
                    Notes
                  </Link>
                </li>
              </ul>
              <FontAwesomeIcon icon={faBars} className='cursor-pointer' />
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default NavigationBar
