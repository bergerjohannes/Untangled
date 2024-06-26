import { LoaderFunctionArgs, json, ActionFunctionArgs, redirect } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import supabaseClient from '~/utils/supabase.server'
import { useOutletContext, useFetcher } from '@remix-run/react'
import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Note from '~/components/noteComponent'
import EmptyState from '~/components/EmptyState'
import Header from '~/components/header'
import Modal, { ModalRef } from '~/components/modal'

import type { SupabaseOutletContext } from '~/root'
import { Session, User } from '@supabase/gotrue-js/src/lib/types'

import { Tables } from 'types/supabase'
import ProminentButton from '~/components/prominentButton'
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
  if (!userId) {
    return redirect('/signup')
  }

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
  const { notes }: { notes: Note[] } = useLoaderData<typeof loader>()
  const [localNotes, setLocalNotes] = useState<Note[]>([])
  const { supabase } = useOutletContext<SupabaseOutletContext>()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const modalRef = useRef<ModalRef>(null)
  const fetcher = useFetcher()
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const [noteTitleToDelete, setNoteTitleToDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLocalNotes(notes)
  }, [notes])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
  }, [])

  const handleDelete = async (id: string, title: string) => {
    setNoteToDelete(id)
    setNoteTitleToDelete(title)
    modalRef.current?.show()
  }

  const confirmDelete = async () => {
    if (noteToDelete) {
      // Optimistically remove the note from the UI
      setLocalNotes(localNotes.filter((note) => note.id !== noteToDelete))

      await fetcher.submit(
        { id: noteToDelete, intent: Intent.Delete },
        { method: 'post', action: '/notes' }
      )

      modalRef.current?.hide()
      setNoteToDelete(null)
      setNoteTitleToDelete(null)
    }
  }

  const cancelDelete = () => {
    modalRef.current?.hide()
    setNoteToDelete(null)
    setNoteTitleToDelete(null)
  }

  if (loading) {
    return (
      <>
        <Header>Notes</Header>
      </>
    )
  }

  if (notes.length === 0) {
    return (
      <>
        <Header>Notes</Header>
        <EmptyState />
        <p className='my-12 text-whitish'>Nothing here yet!</p>
        <Link to='/'>
          <ProminentButton>Record your first note</ProminentButton>
        </Link>
      </>
    )
  }

  return (
    <>
      <Header>Notes</Header>
      {localNotes
        .sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp))
        .map((note) => (
          <Note
            key={note.id}
            title={note.title}
            text={note.text}
            timestamp={parseInt(note.timestamp)}
            animate={false}
            deleteNote={() => handleDelete(note.id, note.title)}
          />
        ))}
      <Modal
        ref={modalRef}
        headerText='Confirm Delete'
        confirmButtonText='Delete'
        confirmAction={confirmDelete}
        cancelButtonText='Cancel'
        cancelAction={cancelDelete}
      >
        <p>
          Are you sure you want to delete "<span className='italic'>{noteTitleToDelete}</span>"?
        </p>
      </Modal>
    </>
  )
}