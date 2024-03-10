import Header from '~/components/header'

export default function PaymentSuccess() {
  return (
    <>
      <Header>Payment Successful</Header>
      <p className='my-12 text-whitish'>
        Thank you for your payment. Your subscription is now active.
      </p>
    </>
  )
}
