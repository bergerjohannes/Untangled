import { useLocation } from '@remix-run/react'
import { useRef, useEffect, useState } from 'react'
import { useOutletContext } from '@remix-run/react'
import NavigationBar from '~/components/navigationBar'

import type { SupabaseOutletContext } from '~/root'
import { Session, User } from '@supabase/gotrue-js/src/lib/types'

interface CustomLocationState extends Location {
  textData: string
  titleData: string
  timestampData: number
}

export default function Result() {
  const textRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState<string | null>(null)
  const [title, setTitle] = useState<string | null>(null)
  const [timestamp, setTimestamp] = useState<number | null>(null)

  const location = useLocation()
  const state = location.state as CustomLocationState
  const { textData, titleData, timestampData } = state || {}

  if (text === null) setText(textData)
  if (title === null) setTitle(titleData)
  if (timestamp === null) setTimestamp(timestampData)

  const { supabase } = useOutletContext<SupabaseOutletContext>()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!text || !textRef.current) return

    const wrapLettersWithSpan = (node: Node) => {
      if (node instanceof HTMLElement) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          Array.from(node.childNodes).forEach((child) => {
            if (child instanceof HTMLElement) {
              wrapLettersWithSpan(child)
            } else if (child.nodeType === Node.TEXT_NODE) {
              wrapLettersWithSpan(child)
            }
          })
        } else {
          console.error(`Unexpected nodeType: ${node.nodeType}`)
        }
      } else if (node instanceof Text) {
        const text = node.textContent || ''
        const wrappedText = Array.from(text)
          .map((letter) => `<span>${letter}</span>`)
          .join('')

        const spanContainer = document.createElement('span')
        spanContainer.innerHTML = wrappedText
        node.replaceWith(spanContainer)
      } else {
        console.error(`Unexpected nodeType: ${node.nodeType}`)
      }
    }

    const addAnimationDelay = (node: HTMLDivElement) => {
      node.querySelectorAll('span > span').forEach((span: any, index) => {
        ;(span as HTMLElement).style.animationDelay = `${index * 0.001}s`
      })
    }

    wrapLettersWithSpan(textRef.current)
    addAnimationDelay(textRef.current)

    const totalAnimationDuration = text.length * 0.005
    setTimeout(() => {
      if (textRef.current) {
        textRef.current.innerHTML = text
      }
    }, totalAnimationDuration * 1000)
  }, [text])

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
      <div className='flex flex-col items-center justify-start text-center'>
        <div className='w-11/12 max-w-2xl text-left'>
          <h1 className='lg:text-3xl md:text-2xl text-xl mx-auto lg:mt-20 mt-4 font-bold leading-relaxed'>
            {title}
          </h1>
          <p className='md:text-sm mx-auto mt-4'>
            {new Date(timestamp || Date.now()).toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })}
          </p>
          <p className='md:text-lg mx-auto mt-4' ref={textRef}>
            {text}
          </p>
        </div>
      </div>
    </>
  )
}
