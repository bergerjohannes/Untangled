import React from 'react'

interface PageWrapperProps {
  children: React.ReactNode
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return <div className='w-full flex flex-col items-center justify-start text-center'>{children}</div>
}

export default PageWrapper
