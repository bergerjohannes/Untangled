import NavigationBar from '~/components/navigationBar'
import PageWrapper from '~/components/pageWrapper'
import Header from '~/components/header'

export default function PaymentSuccess() {
  return (
    <>
      <NavigationBar />

      <PageWrapper>
        <Header>Payment Successful</Header>
        <p className='my-12 text-whitish'>
          Thank you for your payment. Your subscription is now active.
        </p>
      </PageWrapper>
    </>
  )
}
