import { Link } from '@remix-run/react'
import Header from '~/components/header'
import ProminentButton from '~/components/prominentButton'

export default function Upgrade() {
  return (
    <>
      <Header>Subscribe to Untangled Notes Plus</Header>
      <p className='my-12 text-whitish'>To get more transcriptions, upgrade. </p>
      <Link to='/subscribe'>
        <ProminentButton>Upgrade</ProminentButton>
      </Link>
    </>
  )
}
