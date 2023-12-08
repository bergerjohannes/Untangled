import React, { ReactNode } from 'react'

interface HeaderProps {
  children: ReactNode
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  return (
    <div className='mx-auto w-11/12 md:w-3/4'>
      <h1 className='h-full lg:text-6xl md:text-4xl text-2xl text-center lg:my-16 md:my-8 my-4 font-bold leading-relaxed'>
        {children}
      </h1>
    </div>
  )
}

export default Header