import { json, ActionFunction } from '@remix-run/node'
import { useOutletContext, useFetcher, useNavigate } from '@remix-run/react'
import { useState, useEffect, ReactNode } from 'react'
import { OpenAI } from 'openai'
import { useAudioRecorder } from 'react-audio-voice-recorder'
import Illustration from '~/components/illustration'
import Header from '../components/header'
import RecordingBubble, { RecordingState } from '~/components/recordingBubble'
import supabaseClient from '~/utils/supabase.server'
import { hasActiveSubscription, ensureStripeCustomer } from '~/utils/stripe.server'
import { generateUUID } from '~/utils/helpers'

import { Session, User } from '@supabase/gotrue-js/src/lib/types'
import type { SupabaseOutletContext } from '~/root'
import type { MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => {
  return [
    { title: 'Untangled Notes' },
    { name: 'description', content: 'Welcome to Untangled Notes! The audio note taking tool.' },
  ]
}

const CLIENT_IDENTIFIER_KEY = 'identifierForClient'
const ERROR_MESSAGE_FREE_TIER_USED =
  'Not allowed - Please upgrade to a paid plan to continue using the service.'

enum Intent {
  Transcribe = 'transcribe',
  Rephrase = 'rephrase',
}

enum UserStatus {
  FreeUser = 'freeUser',
  Subscriber = 'subscriber',
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const intent = formData.get('intent') as Intent
  const clientIdentifier = formData.get('CLIENT_IDENTIFIER_KEY') as string
  const response = new Response()
  const supabase = supabaseClient({ request, response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id ?? null
  let isActiveSubscriber = false
  if (userId) {
    const stripeCustomerId = await ensureStripeCustomer(userId, session?.user?.email)
    if (!stripeCustomerId) {
      return json({ isActiveSubscriber: false }, { status: 200, headers: response.headers })
    }
    isActiveSubscriber = await hasActiveSubscription(stripeCustomerId)
  }

  let goodToGo = isActiveSubscriber === true
  let userStatus: UserStatus
  if (goodToGo) {
    userStatus = UserStatus.Subscriber
  } else {
    // For free users, we allow one transcription and rephrasing per client
    // Hence, we check if the client has already used the free trial
    userStatus = UserStatus.FreeUser
    const { data: trialNotesData, error: trialNotesError } = await supabase
      .from('trial_notes')
      .select('*')
      .eq('owner', clientIdentifier)

    if (trialNotesError) {
      console.error(trialNotesError)
      return json({ error: trialNotesError.message }, { status: 500 })
    }

    if (trialNotesData.length === 0) {
      goodToGo = true
    }
  }

  if (!goodToGo) {
    return json(
      { message: ERROR_MESSAGE_FREE_TIER_USED },
      { status: 405, headers: response.headers }
    )
  }

  switch (intent) {
    case Intent.Transcribe: {
      try {
        const base64Audio = formData.get('audio')
        if (typeof base64Audio === 'string') {
          const audioBuffer = Buffer.from(base64Audio.split(',')[1], 'base64')
          const audioFile = new File([audioBuffer], 'audio.wav', {
            type: 'audio/wav',
          })

          const timestamp = new Date().toISOString()
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

          if (audioFile instanceof File) {
            try {
              const transcript = await openai.audio.transcriptions.create({
                model: 'whisper-1',
                file: audioFile,
              })

              if (!transcript.text) {
                return new Response('Error creating the transcript', { status: 400 })
              }

              const database =
                userStatus === UserStatus.Subscriber ? 'transcripts' : 'trial_transcripts'
              const { data: newTranscript, error } = await supabase
                .from(database)
                .insert({
                  content: transcript.text,
                  timestamp: timestamp,
                  owner: userStatus === UserStatus.Subscriber ? userId : clientIdentifier,
                })
                .select('*')

              if (error) {
                console.error(error)
                return json({ error: error.message }, { status: 500 })
              }

              return json(
                {
                  transcript: transcript.text,
                  timestamp: timestamp,
                  transcriptId: newTranscript[0].id,
                },
                { status: 200 }
              )
            } catch (error) {
              return new Response('Error transcribing audio', { status: 500 })
            }
          }
        }
      } catch (error) {
        return new Response('Error processing audio', { status: 500 })
      }
      break
    }
    case Intent.Rephrase: {
      try {
        const transcript = formData.get('transcript') as string
        const timestamp = formData.get('timestamp') as string
        const transcriptId = formData.get('transcriptId') as string

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const rephrasedTranscript = await openai.chat.completions.create({
          model: 'gpt-4-1106-preview',
          messages: [
            {
              role: 'system',
              content:
                'You are a sophisticated language model trained to rephrase sentences for enhanced clarity while preserving their original meaning. Your task is to take a given text and rewrite it in a way that makes it clearer and more concise, without changing its intended meaning. Pay attention to the nuances of the original text and ensure that the rephrased version captures all essential elements of the message. Your rephrased text should be grammatically correct and easy to understand. Ensure to kep the text easy to understand and don\'t use jargon unless the original text uses it. You must respond in JSON with the following structure {title: "title_of_the_text", text: "rephrased_text"}',
            },
            {
              role: 'user',
              content: `Your task is to rephrase the following text to enhance its clarity, ensuring the original meaning is preserved. Provide a concise and easy to understand title summarizing the essence of the text and a rewritten version of the text: ${transcript}`,
            },
          ],
          response_format: { type: 'json_object' },
        })

        const data = rephrasedTranscript.choices[0].message.content

        if (data) {
          const parsedData = JSON.parse(data)
          parsedData.timestamp = timestamp
          parsedData.transcript = transcript
          parsedData.owner = userId
          const databaseNotes = userStatus === UserStatus.Subscriber ? 'notes' : 'trial_notes'
          const { data: newRephrase, error } = await supabase
            .from(databaseNotes)
            .insert({
              title: parsedData.title,
              text: parsedData.text,
              transcript: transcriptId,
              timestamp: timestamp,
              owner: userStatus === UserStatus.Subscriber ? userId : clientIdentifier,
            })
            .select('*')
            .single()

          if (error) {
            console.error(error)
            return json({ error: error.message }, { status: 500 })
          }

          return json(newRephrase, { status: 200 })
        } else {
          return new Response('Response data is null', { status: 500 })
        }
      } catch (error) {
        return new Response('Error rephrasing transcript', { status: 500 })
      }
      break
    }
    default: {
      return new Response('Invalid intent', { status: 400 })
    }
  }
}

enum State {
  Initial = 'initial',
  Recording = 'recording',
  LoadingTranscribing = 'loadingTranscribing',
  LoadingRephrasing = 'loadingRephrasing',
  Result = 'result',
}

interface FetcherData {
  id?: string
  title?: string
  text?: string
  transcript: string
  timestamp: string
  transcriptId: string
  message?: string
}

export default function Index() {
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [state, setState] = useState<State>(State.Initial)
  const fetcher = useFetcher()
  const navigate = useNavigate()

  const { startRecording, stopRecording, mediaRecorder, recordingBlob } = useAudioRecorder()

  const { supabase } = useOutletContext<SupabaseOutletContext>()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
    })
  }, [])

  useEffect(() => {
    if (recordingBlob) {
      const url = window.URL.createObjectURL(recordingBlob)
      setAudioURL(url)
      callTranscribeAPI()
      return () => window.URL.revokeObjectURL(url)
    }
  }, [recordingBlob])

  const handleRecord = () => {
    if (user?.id === null) {
      navigate('/signup')
      return
    }

    if (state === State.Initial) {
      startRecording()
      setState(State.Recording)
    } else if (state === State.Recording) {
      stopRecording()
      setState(State.LoadingTranscribing)
    }
  }

  useEffect(() => {
    if (
      state === State.LoadingTranscribing &&
      fetcher.data &&
      (fetcher.data as FetcherData).transcript
    ) {
      setState(State.LoadingRephrasing)
    } else if (
      state === State.LoadingRephrasing &&
      fetcher.data &&
      (fetcher.data as FetcherData).text
    ) {
      navigate('/result', {
        state: {
          id: (fetcher.data as FetcherData).id,
          owner: user?.id,
          text: (fetcher.data as FetcherData).text,
          title: (fetcher.data as FetcherData).title,
          transcript: (fetcher.data as FetcherData).transcript,
          timestamp: (fetcher.data as FetcherData).timestamp,
        },
      })
    } else if (
      state === State.LoadingTranscribing &&
      fetcher.data &&
      (fetcher.data as FetcherData).message &&
      (fetcher.data as FetcherData).message === ERROR_MESSAGE_FREE_TIER_USED
    ) {
      navigate('/upgrade')
    }
  }, [fetcher, state])

  useEffect(() => {
    if (state === State.LoadingRephrasing) {
      callRephraseAPI()
    }
  }, [state])

  const getIdentifierForClient = () => {
    // We are generating or loading the identifier for the client to allow one free transcription per client
    let identifierForClient = generateUUID()
    if (typeof window !== 'undefined') {
      const localStorageItem = window.localStorage.getItem(CLIENT_IDENTIFIER_KEY)
      if (localStorageItem) {
        identifierForClient = localStorageItem
      } else {
        window.localStorage.setItem(CLIENT_IDENTIFIER_KEY, identifierForClient)
      }
    }
    return identifierForClient
  }

  const callRephraseAPI = async () => {
    if (
      state === State.LoadingRephrasing &&
      fetcher.data &&
      (fetcher.data as FetcherData).transcript
    ) {
      try {
        const identifierForClient = getIdentifierForClient()

        const data = {
          CLIENT_IDENTIFIER_KEY: identifierForClient,
          transcript: (fetcher.data as FetcherData).transcript,
          timestamp: (fetcher.data as FetcherData).timestamp,
          transcriptId: (fetcher.data as FetcherData).transcriptId,
          intent: Intent.Rephrase,
        }

        fetcher.submit(data, { method: 'post', action: '/?index' })
      } catch (error) {
        console.error('Error calling the rephrase API to rephrase the transcribed text: ', error)
      }
    }
  }

  const handlePlay = () => {
    if (audioURL) {
      const audio = new Audio(audioURL)
      audio.play()
    }
  }

  const callTranscribeAPI = async () => {
    if (
      state === State.LoadingTranscribing &&
      !fetcher.data &&
      recordingBlob &&
      recordingBlob instanceof Blob
    ) {
      const reader = new FileReader()
      reader.readAsDataURL(recordingBlob)
      reader.onloadend = () => {
        const base64data = reader.result

        if (typeof base64data !== 'string') {
          console.error('Failed to convert blob to base64')
          return
        }
        try {
          const identifierForClient = getIdentifierForClient()

          const data = {
            CLIENT_IDENTIFIER_KEY: identifierForClient,
            audio: base64data,
            intent: Intent.Transcribe,
          }
          fetcher.submit(data, { method: 'post', action: '/?index' })
        } catch (error) {
          console.error('Error submitting the recorded audio: ', error)
        }
      }
    }
  }

  return (
    <>
      {state === State.Initial && (
        <>
          <HeaderInitial />
          <MicrophoneWrapper>
            <RecordingBubble recordingState={RecordingState.Waiting} handleRecord={handleRecord} />
            <Illustration />
          </MicrophoneWrapper>
        </>
      )}
      {state === State.Recording && !mediaRecorder && (
        <>
          <HeaderRecording />
          <MicrophoneWrapper>
            <RecordingBubble recordingState={RecordingState.Activating} />
            <Illustration />
          </MicrophoneWrapper>
        </>
      )}

      {state === State.Recording && mediaRecorder && (
        <>
          <HeaderRecording />
          <MicrophoneWrapper>
            <RecordingBubble
              recordingState={RecordingState.Active}
              handleRecord={handleRecord}
              mediaRecorder={mediaRecorder}
            />
            <Illustration />
          </MicrophoneWrapper>
        </>
      )}

      {(state === State.LoadingTranscribing || state === State.LoadingRephrasing) && (
        <>
          <HeaderLoading state={state} />
          <MicrophoneWrapper>
            <RecordingBubble recordingState={RecordingState.Loading} />
          </MicrophoneWrapper>
        </>
      )}

      {state === State.Result && <></>}
    </>
  )
}

const MicrophoneWrapper = ({ children }: { children: ReactNode }) => (
  <div className='w-full lg:h-96 h-96 sm:h-128 m-12 relative flex justify-center items-center'>
    {children}
  </div>
)

const HeaderInitial = () => (
  <>
    <div className='lg:h-60 h-32 w-full'>
      <Header>
        Turn Tangled Thoughts into Tidied Text, <span className='italic'>Fast</span>
      </Header>
    </div>
    <p className='lg:h-24 h-16 text-lg leading-relaxed w-11/12 mx-auto'>
      Start <span className='underline'>recording</span> and just talk.
      <br />
      AI will rewrite and structure your thoughts.
    </p>
  </>
)

const HeaderRecording = () => (
  <>
    <div className='lg:h-60 h-32 w-full'>
      <Header>Listening ..</Header>
    </div>
    <p className='lg:h-24 h-16 text-lg leading-relaxed w-11/12 mx-auto'></p>
  </>
)

const HeaderLoading = ({ state }: { state: State }) => (
  <>
    <div className='lg:h-60 h-32 w-full'>
      <Header>Working..</Header>
    </div>
    <p className='lg:h-24 h-16 text-lg leading-relaxed w-11/12 mx-auto'>
      {state === State.LoadingTranscribing && <>Transcribing (1/2)</>}
      {state === State.LoadingRephrasing && <>Rephrasing (2/2)</>}
    </p>
  </>
)
