import { useLocation } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { ActionFunctionArgs, json, redirect } from '@remix-run/node'
import { useFetcher, useNavigate } from '@remix-run/react'
import NoteComponent from '~/components/noteComponent'
import supabaseClient from '~/utils/supabase.server'

import { Tables } from 'types/supabase'
type Note = Tables<'notes'>

enum Intent {
  Delete = 'Delete',
}

interface CustomLocationState extends Location {
  id: string
  owner: string
  text: string
  title: string
  transcript: string
  timestamp: string
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response()
  const supabase = supabaseClient({ request, response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id ?? null
  if (!userId) {
    return redirect('/signup')
  }

  const formData = await request.formData()
  const id = formData.get('id') as string
  const intent = Intent[formData.get('intent') as keyof typeof Intent]

  if (intent === Intent.Delete) {
    const { data, error } = await supabase.from('notes').delete().eq('id', id)
    if (error) {
      console.error('Error deleting note:', error)
      return json({ error: error.message }, { status: 500 })
    }

    return json({}, { status: 302, headers: { Location: '/' } })
  } else {
    return null
  }
}

export default function Note() {
  const [note, setNote] = useState<Note | null>(null)
  const navigate = useNavigate()

  const location = useLocation()
  const state = location.state as CustomLocationState
  const { id, owner, text, title, transcript, timestamp } = state || {}

  useEffect(() => {
    setNote({
      id: id,
      owner: owner,
      text: text,
      title: title,
      transcript: transcript,
      timestamp: new Date(timestamp).getTime().toString(),
    })
  }, [id, owner, text, title, transcript, timestamp])

  const fetcher = useFetcher()

  const handleDelete = async () => {
    console.log('note', note)
    if (note) {
      await fetcher.submit(
        {
          id: note.id,
          intent: Intent.Delete,
        },
        { method: 'post', action: '/result' }
      )
      navigate('/')
    }
  }

  if (note) {
    return (
      <>
        <NoteComponent
          title={note.title}
          text={note.text}
          timestamp={parseInt(note.timestamp)}
          deleteNote={handleDelete}
        />
      </>
    )
  }
  return (
    <>
      <div className='flex flex-col items-center justify-start text-center'>
        <p className='md:text-lg mx-auto mt-4'>No data available</p>
      </div>
    </>
  )
}
