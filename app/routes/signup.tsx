import { useLocation } from '@remix-run/react'
import Auth, { AuthType } from '../components/auth'

const Signup = () => {
  const location = useLocation()
  const from = location.state?.from || '/'
  return <Auth type={AuthType.SignUp} location={from} />
}

export default Signup
