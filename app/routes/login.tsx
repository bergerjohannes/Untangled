import { useLocation } from '@remix-run/react'
import Auth, { AuthType } from '../components/auth'

const Login = () => {
  const location = useLocation()
  const from = location.state?.from || '/'
  return <Auth type={AuthType.LogIn} location={from} />
}

export default Login
