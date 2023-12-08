import { json, ActionFunction } from '@remix-run/node'
import { useOutletContext, useFetcher, useNavigate } from '@remix-run/react'
import { useState, useEffect, ReactNode } from 'react'
import { OpenAI } from 'openai'
import { useAudioRecorder } from 'react-audio-voice-recorder'
import Illustration from '~/components/illustration'
import Header from '../components/header'
import PageWrapper from '~/components/pageWrapper'
import RecordingBubble, { RecordingState } from '~/components/recordingBubble'

import { Session, User } from '@supabase/gotrue-js/src/lib/types'
import type { SupabaseOutletContext } from '~/root'
import type { MetaFunction } from '@remix-run/node'
import NavigationBar from '~/components/navigationBar'

export const meta: MetaFunction = () => {
  return [
    { title: 'Untangled Notes' },
    { name: 'description', content: 'Welcome to Untangled Notes! The audio note taking tool.' },
  ]
}

export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData()
    const base64Audio = formData.get('audio')
    if (typeof base64Audio === 'string') {
      const audioBuffer = Buffer.from(base64Audio.split(',')[1], 'base64')
      const audioFile = new File([audioBuffer], 'audio.wav', {
        type: 'audio/wav',
      })

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
                content: `Your task is to rephrase the following text to enhance its clarity, ensuring the original meaning is preserved. Provide a concise and easy to understand title summarizing the essence of the text and a rewritten version of the text: ${transcript.text}`,
              },
            ],
            response_format: { type: 'json_object' },
          })

          const data = rephrasedTranscript.choices[0].message.content

          if (data) {
            const parsedData = JSON.parse(data)
            parsedData.timestamp = new Date().toISOString()
            parsedData.transcript = transcript.text
            return json(parsedData, { status: 200 })
          } else {
            return new Response('Response data is null', { status: 500 })
          }
        } catch (error) {
          return new Response('Error processing audio', { status: 500 })
        }
      } else {
        return new Response('Audio data is not a string', { status: 400 })
      }
    } else {
      return new Response('No audio file found in sent data', { status: 400 })
    }
  } catch (error) {
    return new Response('Error', { status: 500 })
  }
}

enum State {
  Initial = 'initial',
  Recording = 'recording',
  Loading = 'loading',
  Result = 'result',
}

interface FetcherData {
  title: string
  text: string
  transcript: string
  timestamp: string
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
      callAPI()
      return () => window.URL.revokeObjectURL(url)
    }
  }, [recordingBlob])

  const handleRecord = () => {
    if (state === State.Initial) {
      startRecording()
      setState(State.Recording)
    } else if (state === State.Recording) {
      stopRecording()
      setState(State.Loading)
    }
  }

  useEffect(() => {
    if (state === State.Loading && fetcher.data && (fetcher.data as FetcherData).text) {
      navigate('/result', {
        state: {
          textData: (fetcher.data as FetcherData).text,
          titleData: (fetcher.data as FetcherData).title,
          transcriptData: (fetcher.data as FetcherData).transcript,
          timestampData: (fetcher.data as FetcherData).timestamp,
        },
      })
    }
  }, [fetcher, state])

  const handlePlay = () => {
    if (audioURL) {
      const audio = new Audio(audioURL)
      audio.play()
    }
  }

  const callAPI = async () => {
    if (!recordingBlob) return
    if (!(recordingBlob instanceof Blob)) return

    const reader = new FileReader()
    reader.readAsDataURL(recordingBlob)
    reader.onloadend = () => {
      const base64data = reader.result

      const formData = new FormData()
      if (typeof base64data === 'string') {
        formData.append('audio', base64data)
      } else {
        console.error('Failed to convert blob to base64')
        return
      }
      try {
        const data = { audio: base64data }
        fetcher.submit(data, { method: 'post', action: '/?index' })
      } catch (error) {
        console.error('Error submitting the recorded audio: ', error)
      }
    }
  }

  return (
    <>
      <NavigationBar />

      <PageWrapper>
        {state === State.Initial && (
          <>
            <HeaderInitial />
            <MicrophoneWrapper>
              <RecordingBubble
                recordingState={RecordingState.Waiting}
                handleRecord={handleRecord}
              />
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

        {state === State.Loading && (
          <>
            <div className='lg:h-84 h-48'></div>
            <MicrophoneWrapper>
              <RecordingBubble recordingState={RecordingState.Loading} />
            </MicrophoneWrapper>
          </>
        )}

        {state === State.Result && <></>}
      </PageWrapper>
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
