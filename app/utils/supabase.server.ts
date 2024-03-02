import { createServerClient as _createServerClient } from '@supabase/auth-helpers-remix'
import type { Database } from 'supabase_types'

interface ServerClientParams {
  request: Request
  response: Response
}

export default ({ request, response }: ServerClientParams) =>
  _createServerClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    request,
    response,
  })
