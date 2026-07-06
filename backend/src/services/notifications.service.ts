import { supabaseAdmin } from '../lib/supabase'

export async function listForUser(userId: string, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function markRead(userId: string, notificationId: string) {
  const { error } = await supabaseAdmin
    .from('notifications').update({ is_read: true })
    .eq('id', notificationId).eq('user_id', userId)
  if (error) throw error
}

export async function markAllRead(userId: string) {
  const { error } = await supabaseAdmin
    .from('notifications').update({ is_read: true })
    .eq('user_id', userId).eq('is_read', false)
  if (error) throw error
}
