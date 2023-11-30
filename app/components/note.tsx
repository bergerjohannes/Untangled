import { useEffect, useRef, useState } from 'react'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

type NoteProps = {
  title: string
  text: string
  timestamp: number
  animate?: boolean
  deleteNote: () => void
}

export default function Note({ title, text, timestamp, animate = true, deleteNote }: NoteProps) {
  const textRef = useRef<HTMLDivElement>(null)
  const [textData, setTextData] = useState<string | null>(text)
  const [titleData, setTitleData] = useState<string | null>(title)
  const [timestampData, setTimestampData] = useState<number | null>(timestamp)
  const [showDeleteButton, setShowDeleteButton] = useState<boolean>(!animate)

  useEffect(() => {
    if (!textData || !textRef.current || !animate) return

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
      setShowDeleteButton(true)
    }, totalAnimationDuration * 1000)
  }, [textData, animate])

  return (
    <div className='flex flex-col items-center justify-start text-center'>
      <div className='w-11/12 max-w-2xl text-left'>
        <h1 className='lg:text-3xl md:text-2xl text-xl mx-auto lg:mt-20 mt-4 font-bold leading-relaxed'>
          {titleData}
        </h1>
        <p className='md:text-sm mx-auto mt-4'>
          {new Date(timestampData || Date.now()).toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })}
        </p>
        <p className='md:text-lg mx-auto mt-4' ref={textRef}>{textData}</p>
        {showDeleteButton && (
          <div className='flex w-full items-center justify-start mt-4'>
            <button onClick={deleteNote} className='delete-button'>
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
