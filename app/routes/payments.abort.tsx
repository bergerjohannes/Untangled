import NavigationBar from '~/components/navigationBar'
import PageWrapper from '~/components/pageWrapper'
import Header from '~/components/header'

export default function AbortPayment() {
  return (
    <>
      <NavigationBar />
      <PageWrapper>
        <Header>Payment Aborted</Header>
      </PageWrapper>
    </>
  )
}