import { supabase } from '~/utils/supabase.server'
import { redirect } from '@remix-run/node'

export async function ensureUserIsLoggedIn() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('session', session)

  const userId = session?.user?.id ?? null
  console.log('userId', userId)
  if (!userId) {
    throw redirect('/signup')
  }
  return userId
}