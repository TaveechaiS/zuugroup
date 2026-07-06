import { supabaseAdmin } from '../lib/supabase'
import { getTeamMemberIds } from '../lib/access'

export type AdminReportFilters = {
  from?: string
  to?: string
  zone_id?: string
  team_id?: string
  province?: string
  region?: string
  status?: string
}

export async function adminReport(q: AdminReportFilters) {
  let memberIds: string[] | null = null
  if (q.team_id) memberIds = await getTeamMemberIds(q.team_id)

  let customerIds: string[] | null = null
  if (q.zone_id || q.province || q.region) {
    const { data: custs } = await supabaseAdmin
      .from('customers').select('id, zone:sales_zones(id, code, province, region)')
    customerIds = (custs ?? []).filter((c: any) => {
      if (q.zone_id && c.zone?.id !== q.zone_id) return false
      if (q.province && c.zone?.province !== q.province) return false
      if (q.region && c.zone?.region !== q.region) return false
      return true
    }).map((c: any) => c.id)
  }

  let oQ = supabaseAdmin
    .from('orders')
    .select('*, customer:customers(id, company_name, zone:sales_zones(code, name, province, region)), creator:users!created_by(first_name, last_name, team_id)')

  if (q.from) oQ = oQ.gte('created_at', new Date(q.from).toISOString())
  if (q.to) oQ = oQ.lte('created_at', new Date(q.to + 'T23:59:59').toISOString())
  if (q.status) oQ = oQ.eq('status', q.status)
  if (memberIds) oQ = oQ.in('created_by', memberIds)
  if (customerIds) oQ = oQ.in('customer_id', customerIds)

  const [
    { data: orders },
    { data: products },
    { data: customers },
    { data: orderItems },
    { data: zones },
    { data: teams },
  ] = await Promise.all([
    oQ,
    supabaseAdmin.from('products').select('*'),
    supabaseAdmin.from('customers').select('id, company_name, created_at, zone:sales_zones(id, code, name, province, region)'),
    supabaseAdmin.from('order_items')
      .select('*, product:products(name), order:orders!inner(status, total_amount)')
      .eq('order.status', 'completed'),
    supabaseAdmin.from('sales_zones').select('*').order('code'),
    supabaseAdmin.from('teams').select('id, name'),
  ])

  return { orders, products, customers, orderItems, zones, teams }
}

export async function managerReport(teamId: string | null) {
  const { data: members } = await supabaseAdmin
    .from('users').select('id, first_name, last_name').eq('team_id', teamId ?? '')
  const memberIds = (members ?? []).map((m: any) => m.id)

  const [{ data: quotations }, { data: orders }] = await Promise.all([
    supabaseAdmin.from('quotations').select('*').in('created_by', memberIds),
    supabaseAdmin.from('orders').select('*').in('created_by', memberIds),
  ])

  return { quotations, orders, teamMembers: members ?? [] }
}
