import { supabaseAdmin } from '../lib/supabase'

export async function listRecent(limit = 500) {
  const { data, error } = await supabaseAdmin
    .from('activity_logs')
    .select('*, user:users(first_name, last_name, role)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
