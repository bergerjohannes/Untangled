import SimpleButton from './simpleButton'
import ProminentButton from './prominentButton'
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react'

interface ModalProps {
  headerText: string
  children: React.ReactNode
  cancelButtonText?: string
  confirmButtonText: string
  cancelAction?: () => void
  confirmAction: () => void
}

export interface ModalRef {
  show: () => void
  hide: () => void
  isVisible: () => boolean
}

const Modal = forwardRef<ModalRef, ModalProps>((props: ModalProps, ref: React.Ref<ModalRef>) => {
  const { headerText, children, cancelButtonText, confirmButtonText, cancelAction, confirmAction } =
    props
  const [isShown, setIsShown] = useState(false)

  useEffect(() => {
    if (isShown) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
  }, [isShown])

  useImperativeHandle(ref, () => ({
    show,
    hide,
    isVisible: () => isShown,
  }))

  const show = () => setIsShown(true)
  const hide = () => setIsShown(false)

  const renderCancelButton = () => {
    if (cancelButtonText) {
      return <SimpleButton onClick={cancelAction}>{cancelButtonText}</SimpleButton>
    }
  }

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget && cancelAction) {
      cancelAction()
    }
  }

  if (!isShown) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-opacity-90 bg-blackish'
      onClick={handleOutsideClick}
    >
      <div className='opacity-100 bg-blackish relative w-auto my-6 mx-auto max-w-3xl rounded-lg shadow-lg flex flex-col outline-none focus:outline-none p-8 border-2 border-opacity-20 border-whitish'>
        <h1 className='text-2xl font-bold mb-4'>{headerText}</h1>
        {children}
        <div className='flex space-x-4 justify-end w-full mt-8'>
          {renderCancelButton()}
          <ProminentButton onClick={confirmAction}>{confirmButtonText}</ProminentButton>
        </div>
      </div>
    </div>
  )
})

export default Modal
