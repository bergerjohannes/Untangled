import { useLocation } from '@remix-run/react'
import { useRef, useEffect, useState } from 'react'
import { ActionFunctionArgs, json } from '@remix-run/node'
import { useOutletContext, useFetcher, useNavigate } from '@remix-run/react'
import NavigationBar from '~/components/navigationBar'
import Note from '~/components/note'
import supabaseClient from '~/utils/supabase.server'

import type { SupabaseOutletContext } from '~/root'
import { Session, User } from '@supabase/gotrue-js/src/lib/types'

enum Intent {
  Save = 'Save',
  Delete = 'Delete',
}

interface CustomLocationState extends Location {
  textData: string
  titleData: string
  timestampData: number
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response()
  const supabase = supabaseClient({ request, response })

  const formData = await request.formData()
  const text = formData.get('text') as string
  const title = formData.get('title') as string
  const timestamp = formData.get('timestamp') as string
  const intent = Intent[formData.get('intent') as keyof typeof Intent]

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id ?? null
  if (userId === null) {
    console.error('Error: User ID is null')
    return json({ error: 'User ID is null' }, { status: 500 })
  }

  if (intent === Intent.Save) {
    const { data, error } = await supabase
      .from('notes')
      .insert([{ owner: userId, title, text, timestamp }])

    if (error) {
      console.error('Error adding note:', error)
      return json({ error: error.message }, { status: 500 })
    }

    return json(data)
  } else if (intent === Intent.Delete) {
    const { data, error } = await supabase
      .from('notes')
      .delete()
      .match({ owner: userId, title, text, timestamp })

    if (error) {
      console.error('Error deleting note:', error)
      return json({ error: error.message }, { status: 500 })
    }

    return json(data)
  } else {
    return null
  }
}

export default function Result() {
  const textRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState<string | null>(null)
  const [title, setTitle] = useState<string | null>(null)
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const navigate = useNavigate()

  const location = useLocation()
  const state = location.state as CustomLocationState
  const { textData, titleData, timestampData } = state || {}

  if (text === null) setText(textData)
  if (title === null) setTitle(titleData)
  if (timestamp === null) setTimestamp(timestampData)

  const { supabase } = useOutletContext<SupabaseOutletContext>()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  const fetcher = useFetcher()

  useEffect(() => {
    if (text && title && timestamp && !isSaved) {
      fetcher.submit(
        { text, title, timestamp, intent: Intent.Save },
        { method: 'post', action: '/result' }
      )
      setIsSaved(true)
    }
  }, [text, title, timestamp, fetcher, isSaved])

  const handleDelete = async () => {
    if (text && title && timestamp) {
      await fetcher.submit(
        { text, title, timestamp, intent: Intent.Delete },
        { method: 'post', action: '/result' }
      )
      navigate('/')
    }
  }

  if (!text || !title || !timestamp) {
    return (
      <>
        <NavigationBar />
        <div className='flex flex-col items-center justify-start text-center'>
          <p className='md:text-lg mx-auto mt-4'>No data available</p>
        </div>
      </>
    )
  }

  return (
    <>
      <NavigationBar />
      <Note title={title} text={text} timestamp={timestamp} deleteNote={handleDelete} />
    </>
  )
}
