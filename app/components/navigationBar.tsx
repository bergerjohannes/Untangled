import { Link } from '@remix-run/react'
import { SimpleLogo } from './logo'

const NavigationBar = () => {
  return (
    <nav className='flex justify-start sticky top-0 z-50 w-full p-4'>
      <ul className='flex'>
        <li>
          <Link to='/' className='flex items-center justify-center'>
            <SimpleLogo />
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default NavigationBar
