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

    const wrapWordsWithSpan = (node: Node) => {
      if (node instanceof HTMLElement) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          Array.from(node.childNodes).forEach((child) => {
            if (child instanceof HTMLElement) {
              wrapWordsWithSpan(child)
            } else if (child.nodeType === Node.TEXT_NODE) {
              wrapWordsWithSpan(child)
            }
          })
        } else {
          console.error(`Unexpected nodeType: ${node.nodeType}`)
        }
      } else if (node instanceof Text) {
        const text = node.textContent || ''
        const wrappedText = text
          .split(' ')
          .map((word) => `<span>${word}</span>`)
          .join(' ')

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

    wrapWordsWithSpan(textRef.current)
    addAnimationDelay(textRef.current)

    const totalAnimationDuration = text.length * 0.005
    setTimeout(() => {
      if (textRef.current) {
        textRef.current.innerHTML = text
      }
      setShowDeleteButton(true)
    }, totalAnimationDuration * 1000)
  }, [textData, animate])

  const [isHovered, setIsHovered] = useState(false)
  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  return (
    <div className={`flex flex-col items-center justify-start text-center w-full mb-12 lg:mb-8`}>
      <div
        className={`w-11/12 max-w-2xl text-left lg:p-4 p-2 rounded-default ${
          isHovered
            ? 'border-2 border-opacity-20 border-whitish'
            : 'border-2 border-opacity-20 border-blackish'
        }`}
      >
        <h1 className='lg:text-3xl md:text-2xl text-xl mx-auto font-bold leading-relaxed'>
          {titleData}
        </h1>
        <p className='md:text-sm mx-auto mt-4'>
          {new Date(timestampData || Date.now()).toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })}
        </p>
        <p className='md:text-lg mx-auto mt-4' ref={textRef}>
          {textData}
        </p>
        {showDeleteButton && (
          <div className='flex w-full items-center justify-start mt-4'>
            <button
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={deleteNote}
              className='delete-button hover:opacity-100 opacity-40'
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
