import Header from '~/components/header'

export default function PaymentError() {
  return (
    <>
        <Header>Payment Error</Header>
        <p className='my-12 text-whitish'>
          There was an error processing your request. Please try again!
        </p>
    </>
  )
}
