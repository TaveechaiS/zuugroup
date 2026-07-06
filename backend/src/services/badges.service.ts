import { supabaseAdmin } from '../lib/supabase'
import { getTeamMemberIds } from '../lib/access'

export async function getBadges(role: string, userId: string, teamId: string | null) {
  const { count: notifCount } = await supabaseAdmin
    .from('notifications').select('*', { count: 'exact', head: true })
    .eq('user_id', userId).eq('is_read', false)

  const out: Record<string, number> = { notifications: notifCount ?? 0 }

  if (role === 'admin') {
    const [
      { count: customerRequests },
      { count: pendingOrders },
    ] = await Promise.all([
      supabaseAdmin.from('customer_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending_review', 'processing']),
    ])
    out.customer_requests = customerRequests ?? 0
    out.pending_orders = pendingOrders ?? 0
  }

  if (role === 'manager' && teamId) {
    const memberIds = await getTeamMemberIds(teamId)
    const [
      { count: pendingQuotations },
      { count: pendingOrders },
    ] = await Promise.all([
      supabaseAdmin.from('quotations').select('*', { count: 'exact', head: true })
        .in('created_by', memberIds).eq('status', 'pending'),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true })
        .in('created_by', memberIds).eq('status', 'pending_review'),
    ])
    out.pending_quotations = pendingQuotations ?? 0
    out.pending_orders = pendingOrders ?? 0
  }

  return out
}
