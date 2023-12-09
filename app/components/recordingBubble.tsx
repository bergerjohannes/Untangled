import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrophone, faSpinner, faStop } from '@fortawesome/free-solid-svg-icons'
import AudioVisualizer from './audioVisualizer'

export enum RecordingState {
  Waiting = 'waiting',
  Activating = 'activating',
  Active = 'active',
  Loading = 'loading',
}

interface RecordingBubbleProps {
  recordingState: RecordingState
  handleRecord?: () => void
  mediaRecorder?: MediaRecorder
}

const RecordingBubble: React.FC<RecordingBubbleProps> = ({
  recordingState,
  handleRecord,
  mediaRecorder,
}) => {
  switch (recordingState) {
    case RecordingState.Waiting:
      return handleRecord ? <WaitingRecordingBubble handleRecord={handleRecord} /> : null
    case RecordingState.Activating:
      return <ActivatingRecordingBubble />
    case RecordingState.Active:
      return handleRecord && mediaRecorder ? <ActiveRecordingBubble handleRecord={handleRecord} mediaRecorder={mediaRecorder} /> : null
    case RecordingState.Loading:
      return <LoadingRecordingBubble />
    default:
      return null
  }
}

const WaitingRecordingBubble = ({ handleRecord }: { handleRecord: () => void }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
    setIsLeaving(false)
    setIsReady(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setIsLeaving(true)
    setIsReady(false)
    setTimeout(() => setIsLeaving(false), 1000) // 1000ms is the duration of your unready-movement animation
  }

  return (
    <div
      className={`z-20 bg-blackish lg:w-24 lg:h-24 w-20 h-20 text-2xl rounded-full cursor-pointer flex justify-center items-center transition-all duration-300 hover:scale-110 ${
        isLeaving
          ? 'animate-unready-movement'
          : isReady
          ? 'animate-ready-movement'
          : 'animate-idle-shadow-movement'
      }`}
      onClick={handleRecord}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <FontAwesomeIcon icon={faMicrophone} />
    </div>
  )
}

const ActivatingRecordingBubble = () => (
  <div className='z-20 bg-blackish lg:w-24 lg:h-24 w-20 h-20 text-2xl rounded-full cursor-default flex justify-center items-center shadow-light-sm'>
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
    className='relative z-20 bg-blackish lg:w-24 lg:h-24 w-20 h-20 text-2xl rounded-full cursor-pointer flex justify-center items-center transition-all duration-300 hover:scale-110 shadow-light-sm'
    onClick={handleRecord}
  >
    <div className='lg:w-24 lg:h-24 w-20 h-20 absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
      <AudioVisualizer mediaRecorder={mediaRecorder} />
    </div>
    <FontAwesomeIcon icon={faStop} />
  </div>
)

const LoadingRecordingBubble = () => (
  <div className='lg:w-24 lg:h-24 w-20 h-20 text-2xl bg-whitish rounded-full flex animate-post-action-movement justify-center items-center'></div>
)

export default RecordingBubble
