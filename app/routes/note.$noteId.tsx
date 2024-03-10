import { useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { LoaderFunctionArgs, ActionFunctionArgs, json, redirect } from '@remix-run/node'
import { useFetcher, useNavigate } from '@remix-run/react'
import NoteComponent from '~/components/noteComponent'
import supabaseClient from '~/utils/supabase.server'

import { Tables } from 'types/supabase'
import invariant from 'tiny-invariant'
type Note = Tables<'notes'>

enum Intent {
  Delete = 'Delete',
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

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const response = new Response()
  const supabase = supabaseClient({ request, response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id ?? null
  if (!userId) {
    return redirect('/signup')
  }

  invariant(params.noteId, 'Expected params.noteId!')
  const noteId = params.noteId

  if (noteId) {
    const { data, error } = await supabase.from('notes').select('*').eq('id', noteId).single()

    if (error) {
      console.error('Error loading note:', error)
      return json({ error: error.message }, { status: 500 })
    }

    return json({ ...data, timestamp: new Date(data.timestamp).getTime() })
  }

  return null
}

export default function Note() {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loaderData = useLoaderData<Note>()

  useEffect(() => {
    if (loaderData) {
      setNote(loaderData)
      setLoading(false)
    }
  }, [loaderData])

  const fetcher = useFetcher()

  const handleDelete = async () => {
    if (note) {
      await fetcher.submit(
        {
          id: note.id,
          intent: Intent.Delete,
        },
        { method: 'post', action: `/note/${note.id}` }
      )
      navigate('/')
    }
  }

  if (loading) {
    return (
      <>
        <div className='flex flex-col items-center justify-start text-center'></div>
      </>
    )
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
