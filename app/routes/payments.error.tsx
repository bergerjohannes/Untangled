import NavigationBar from '~/components/navigationBar'
import PageWrapper from '~/components/pageWrapper'
import Header from '~/components/header'

export default function PaymentError() {
  return (
    <>
      <NavigationBar />
      <PageWrapper>
        <Header>Payment Error</Header>
        <p className='my-12 text-whitish'>
          There was an error processing your request. Please try again!
        </p>
      </PageWrapper>
    </>
  )
}
