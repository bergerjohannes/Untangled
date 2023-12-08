import { Link } from '@remix-run/react'
import { useOutletContext, useNavigate } from '@remix-run/react'
import { useState } from 'react'

import type { SupabaseOutletContext } from '~/root'
import { LogoWithText } from './logo'
import SimpleButton from './simpleButton'
import ProminentButton from './prominentButton'

export enum AuthType {
  LogIn = 'logIn',
  SignUp = 'signUp',
}

interface AuthProps {
  type: AuthType
  location?: {
    pathname: string
    search: string
    state: any
    hash: string
    key: string
  }
}

const Auth = ({ type, location }: AuthProps) => {
  const title = type === AuthType.LogIn ? 'Log in' : 'Sign up'
  const buttonText = type === AuthType.LogIn ? 'Log in' : 'Sign up'
  const linkText = type === AuthType.LogIn ? 'Create Account' : 'Already have an account? Log in'
  const linkTo = type === AuthType.LogIn ? '/signup' : '/login'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { supabase } = useOutletContext<SupabaseOutletContext>()
  const navigate = useNavigate()

  const handleAction = async () => {
    let error
    if (type === AuthType.LogIn) {
      error = await handleEmailLogin()
    } else if (type === AuthType.SignUp) {
      error = await handleSignUp()
    }
    if (error) {
      console.error(error)
    } else {
      if (location) {
        navigate(location)
      } else {
        navigate('/')
      }
    }
  }

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })
    return error
  }

  const handleEmailLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    return error
  }

  return (
    <div className='flex flex-col md:flex-row m-auto w-full h-full absolute top-0 left-0'>
      <div className='md:w-1/2 bg-whitish text-blackish flex flex-col justify-center items-center'>
        <Link to='/'>
          <LogoWithText />
        </Link>
      </div>
      <div className='md:w-1/2 bg-blackish text-whitish flex flex-col items-center justify-center'>
        <h2 className='text-3xl font-bold mb-4'>{title}</h2>
        <div className='grid grid-rows-3 gap-2'>
          <div className='grid grid-rows-2 grid-cols-3 gap-2'>
            <label className='col-span-1'>Email</label>
            <input
              value={email}
              type='email'
              onChange={(e) => setEmail(e.target.value)}
              className='rounded-3xl px-2 py-1 ml-2 focus:outline-none w-full col-span-2 text-blackish'
            />
            <label className='col-span-1'>Password</label>
            <input
              value={password}
              type='password'
              onChange={(e) => setPassword(e.target.value)}
              className='rounded-3xl px-2 py-1 ml-2 focus:outline-none w-full col-span-2 text-blackish'
            />
          </div>
          <div className='flex w-full h-fit'>
            <ProminentButton onClick={handleAction}>{buttonText}</ProminentButton>
          </div>
        </div>
        <Link to={linkTo}>
          <SimpleButton>{linkText}</SimpleButton>
        </Link>
      </div>
    </div>
  )
}

export default Auth
