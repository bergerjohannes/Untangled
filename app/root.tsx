import { json, type LinksFunction, type LoaderFunctionArgs } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRevalidator,
} from '@remix-run/react'
import { createBrowserClient, SupabaseClient } from '@supabase/auth-helpers-remix'
import { useEffect, useState } from 'react'
import stylesheet from '~/tailwind.css'
import additionalStyles from '~/style.css'
import { Session, User } from '@supabase/gotrue-js/src/lib/types'
import type { Database } from 'types/supabase'
import createSupabaseClient from '~/utils/supabase.server'
type TypedSupabaseClient = SupabaseClient<Database>
import { Link } from '@remix-run/react'
import { SimpleLogo } from 'app/components/logo'
import SimpleButton from 'app/components/simpleButton'
export type SupabaseOutletContext = {
  supabase: TypedSupabaseClient
}

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: stylesheet },
    { rel: 'stylesheet', href: additionalStyles },
  ]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  }

  const response = new Response()
  const supabase = createSupabaseClient({ request, response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return json({ env, session }, { headers: response.headers })
}

export default function App() {
  const { env, session } = useLoaderData<typeof loader>()
  const { revalidate } = useRevalidator()

  const [supabase] = useState(() =>
    createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  )

  const serverAccessToken = session?.access_token

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION' && session?.access_token !== serverAccessToken) {
        // Server and client are out of sync
        revalidate()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [serverAccessToken, supabase, revalidate])

  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body className='bg-blackish text-whitish'>
        <NavigationBar supabase={supabase} />
        <div className='w-full flex flex-col items-center justify-start text-center'>
          <Outlet context={{ supabase }} />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

type NavigationBarProps = {
  supabase: SupabaseClient<Database>
  withoutMenu?: boolean
}

function NavigationBar({ supabase, withoutMenu }: NavigationBarProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const renderLogo = () => (
    <li>
      <Link to='/' className='flex items-center justify-center mr-4 text-whitish'>
        <SimpleLogo />
      </Link>
    </li>
  )

  if (loading) {
    return (
      <div className='w-full p-4 bg-blackish' style={{ backdropFilter: 'blur(10px)' }}>
        <ul className='flex justify-start items-center'>{renderLogo()}</ul>
      </div>
    )
  }

  return (
    <nav
      className='flex justify-start sticky top-0 z-50 w-full bg-blackish'
      style={{
        background: 'linear-gradient(transparent, rgba(18, 20, 24, 1))',
      }}
    >
      <div className='w-full p-4 bg-blackish' style={{ backdropFilter: 'blur(10px)' }}>
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
