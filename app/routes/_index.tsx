import { json, ActionFunction } from '@remix-run/node'
import { useOutletContext, useFetcher, useNavigate } from '@remix-run/react'
import { useState, useEffect, ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrophone, faSpinner, faStop } from '@fortawesome/free-solid-svg-icons'
import { OpenAI } from 'openai'
import { useAudioRecorder } from 'react-audio-voice-recorder'
import Illustration from '~/components/illustration'
import AudioVisualizer from '~/components/audioVisualizer'

import { Session, User } from '@supabase/gotrue-js/src/lib/types'
import type { SupabaseOutletContext } from '~/root'
import type { MetaFunction } from '@remix-run/node'

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
    <div className='flex flex-col items-center justify-start text-center'>
      {state === State.Initial && (
        <>
          <HeaderInitial />
          <MicrophoneWrapper>
            <WaitingRecordingBubble handleRecord={handleRecord} />
            <Illustration />
          </MicrophoneWrapper>
        </>
      )}
      {state === State.Recording && !mediaRecorder && (
        <>
          <HeaderRecording />
          <MicrophoneWrapper>
            <ActivatingRecordingBubble />
            <Illustration />
          </MicrophoneWrapper>
        </>
      )}

      {state === State.Recording && mediaRecorder && (
        <>
          <HeaderRecording />
          <MicrophoneWrapper>
            <ActiveRecordingBubble handleRecord={handleRecord} mediaRecorder={mediaRecorder} />
            <Illustration />
          </MicrophoneWrapper>
        </>
      )}

      {state === State.Loading && (
        <>
          <div className='lg:h-96 h-32'></div>
          <MicrophoneWrapper>
            <LoadingRecordingBubble />
          </MicrophoneWrapper>
        </>
      )}

      {state === State.Result && <></>}
    </div>
  )
}

const WaitingRecordingBubble = ({ handleRecord }: { handleRecord: () => void }) => (
  <div
    className='z-20 bg-blackish w-24 h-24 text-2xl rounded-full cursor-pointer hover:animate-ready-movement flex justify-center items-center animate-idle-shadow-movement transition-all duration-300 hover:scale-110 hover:shadow-light-sm shadow-light-lg'
    onClick={handleRecord}
  >
    <FontAwesomeIcon icon={faMicrophone} />
  </div>
)

const ActivatingRecordingBubble = () => (
  <div className='z-20 bg-blackish w-24 h-24 text-2xl rounded-full cursor-default flex justify-center items-center animate-ready-movement shadow-light-sm'>
    <FontAwesomeIcon icon={faSpinner} className='animate-spin' />
  </div>
)

const ActiveRecordingBubble = ({
  handleRecord,
  mediaRecorder,
}: {
  handleRecord: () => void
  mediaRecorder: MediaRecorder
}) => (
  <div
    className='relative z-20 bg-blackish w-24 h-24 text-2xl rounded-full cursor-pointer animate-ready-movement flex justify-center items-center transition-all duration-300 hover:scale-110 shadow-light-sm'
    onClick={handleRecord}
  >
    <div className='absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
      <AudioVisualizer mediaRecorder={mediaRecorder} />
    </div>
    <FontAwesomeIcon icon={faStop} />
  </div>
)

const LoadingRecordingBubble = () => (
  <div className='w-24 h-24 text-2xl bg-whitish rounded-full flex animate-post-action-movement justify-center items-center'></div>
)

const MicrophoneWrapper = ({ children }: { children: ReactNode }) => (
  <div className='w-full lg:h-96 h-160 m-12 relative flex justify-center items-center'>
    {children}
  </div>
)

const HeaderInitial = () => (
  <div className='lg:h-96 h-32 mx-auto'>
    <h1 className='lg:text-6xl md:text-4xl text-2xl w-11/12 md:w-3/4 mx-auto lg:mt-20 mt-4 font-bold leading-relaxed'>
      Turn Tangled Thoughts into Tidied Text, <span className='italic'>Fast</span>
    </h1>
    <p className='text-lg leading-relaxed w-11/12 lg:mt-12 mt-4 mx-auto'>
      Start <span className='underline'>recording</span> and just talk.
      <br />
      AI will rewrite and structure your thoughts.
    </p>
  </div>
)

const HeaderRecording = () => (
  <div className='lg:h-96 h-32 w-full mx-auto'>
    <h1 className='lg:text-6xl md:text-4xl text-2xl w-11/12 md:w-3/4 mx-auto lg:mt-20 mt-4 font-bold leading-relaxed'>
      Listening ..
    </h1>
  </div>
)
