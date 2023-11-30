import { LoaderFunctionArgs, json, ActionFunctionArgs } from '@remix-run/node'
import { useLoaderData, useLocation } from '@remix-run/react'
import supabaseClient from '~/utils/supabase.server'
import { useOutletContext, useFetcher } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NavigationBar from '~/components/navigationBar'
import Note from '~/components/note'

import type { SupabaseOutletContext } from '~/root'
import { Session, User } from '@supabase/gotrue-js/src/lib/types'

type Note = {
  id: string
  title: string
  text: string
  timestamp: number
}

enum Intent {
  Delete = 'Delete',
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response()
  const supabase = supabaseClient({ request, response })

  const formData = await request.formData()
  const id = formData.get('id') as string
  const intent = Intent[formData.get('intent') as keyof typeof Intent]

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id ?? null
  if (userId === null) {
    console.error('Error: User ID is null')
    return json({ error: 'User ID is null' }, { status: 500 })
  }

  if (intent === Intent.Delete) {
    const { data, error } = await supabase.from('notes').delete().match({ owner: userId, id })

    if (error) {
      console.error('Error deleting note:', error)
      return json({ error: error.message }, { status: 500 })
    }

    return json(data)
  } else {
    return null
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response()
  const supabase = supabaseClient({ request, response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id ?? null

  let notes: Note[] = []
  if (userId) {
    const { data } = await supabase.from('notes').select('*').eq('owner', userId)
    notes = data
      ? data.map((note) => ({ ...note, timestamp: new Date(note.timestamp).getTime() }))
      : []
  }

  return json({ notes }, { headers: response.headers })
}

export default function Notes() {
  const { notes } = useLoaderData<typeof loader>()
  const { supabase } = useOutletContext<SupabaseOutletContext>()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const location = useLocation()
  const fetcher = useFetcher()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
    })
  }, [])

  const handleDelete = async (id: string) => {
    await fetcher.submit(
      { id, intent: Intent.Delete },
      { method: 'post', action: '/notes' }
    )
  }

  if (user === null) {
    return (
      <div className='flex flex-col items-center'>
        <h1 className='text-3xl font-bold'>Notes</h1>
        <p>You are not logged in.</p>
        <Link to='/login' state={{ from: location }}>
          Log in!
        </Link>
      </div>
    )
  }

  return (
    <>
      <NavigationBar />
      {notes
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((note) => (
          <Note
            title={note.title}
            text={note.text}
            timestamp={note.timestamp}
            animate={false}
            deleteNote={() => handleDelete(note.id)}
          />
        ))}
    </>
  )
}
