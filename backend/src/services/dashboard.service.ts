import { supabaseAdmin } from '../lib/supabase'
import { getTeamMemberIds } from '../lib/access'

const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function aggregateMonthly(
  rows: Array<{ created_at: string; total_amount?: number | null; status?: string }>,
  months = 6,
) {
  const now = new Date()
  const buckets: Array<{ key: string; month: string; orders: number; revenue: number }> = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    buckets.push({ key, month: TH_MONTHS_SHORT[d.getMonth()], orders: 0, revenue: 0 })
  }
  const map = new Map(buckets.map((b) => [b.key, b]))
  for (const r of rows) {
    if (!r.created_at) continue
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = map.get(key)
    if (!bucket) continue
    bucket.orders += 1
    if (r.total_amount != null && (r.status === 'completed' || r.status === 'processing')) {
      bucket.revenue += Number(r.total_amount)
    }
  }
  return Array.from(map.values()).map((b) => ({ month: b.month, orders: b.orders, revenue: b.revenue }))
}

function sixMonthsAgoIso(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 5)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function adminStats() {
  const since = sixMonthsAgoIso()

  const [
    { count: userCount },
    { count: customerCount },
    { count: productCount },
    { count: teamCount },
    { count: orderCount },
    { count: pendingOrders },
    { count: pendingCustomerRequests },
    { data: lowStock },
    { data: recentOrders },
    { data: monthlyOrders },
    { data: statusCounts },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('customers').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('teams').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabaseAdmin.from('customer_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('products').select('id, name, quantity, unit').lt('quantity', 10).order('quantity').limit(10),
    supabaseAdmin.from('orders').select('*, customer:customers(company_name)').order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('orders').select('created_at, total_amount, status').gte('created_at', since),
    supabaseAdmin.from('orders').select('status'),
  ])

  const monthlyData = aggregateMonthly(monthlyOrders ?? [], 6)

  const statusMap: Record<string, number> = {}
  for (const r of statusCounts ?? []) {
    const s = (r as any).status
    statusMap[s] = (statusMap[s] ?? 0) + 1
  }
  const statusBreakdown = [
    { name: 'รอตรวจสอบ', value: statusMap['pending_review'] ?? 0, color: '#f59e0b' },
    { name: 'กำลังดำเนินการ', value: statusMap['processing'] ?? 0, color: '#3b82f6' },
    { name: 'สำเร็จ', value: statusMap['completed'] ?? 0, color: '#10b981' },
    { name: 'ไม่ผ่าน', value: statusMap['rejected'] ?? 0, color: '#ef4444' },
    { name: 'ยกเลิก', value: statusMap['cancelled'] ?? 0, color: '#6b7280' },
  ].filter((s) => s.value > 0)

  return {
    stats: {
      userCount, customerCount, productCount, teamCount,
      orderCount,
      pendingOrderCount: pendingOrders,
      pendingCustomerRequests,
      lowStockProducts: lowStock ?? [],
      recentOrders: recentOrders ?? [],
      monthlyData,
      statusBreakdown,
    },
  }
}

export async function managerStats(teamId: string | null) {
  if (!teamId) return null
  const memberIds = await getTeamMemberIds(teamId)
  const since = sixMonthsAgoIso()

  const [
    { count: teamQuotationCount },
    { count: teamOrderCount },
    { count: pendingQuotations },
    { count: pendingOrders },
    { count: rejectedCount },
    { data: teamSales },
    { data: monthlyOrders },
    { data: quotationStatuses },
  ] = await Promise.all([
    supabaseAdmin.from('quotations').select('*', { count: 'exact', head: true }).in('created_by', memberIds),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).in('created_by', memberIds),
    supabaseAdmin.from('quotations').select('*', { count: 'exact', head: true }).in('created_by', memberIds).eq('status', 'pending'),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).in('created_by', memberIds).eq('status', 'pending_review'),
    supabaseAdmin.from('quotations').select('*', { count: 'exact', head: true }).in('created_by', memberIds).eq('status', 'rejected'),
    supabaseAdmin.from('orders').select('total_amount').in('created_by', memberIds).eq('status', 'completed'),
    supabaseAdmin.from('orders').select('created_at, total_amount, status').in('created_by', memberIds).gte('created_at', since),
    supabaseAdmin.from('quotations').select('status').in('created_by', memberIds),
  ])

  const totalSales = (teamSales ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0)
  const monthlyData = aggregateMonthly(monthlyOrders ?? [], 6)

  const qStatusMap: Record<string, number> = {}
  for (const r of quotationStatuses ?? []) {
    const s = (r as any).status
    qStatusMap[s] = (qStatusMap[s] ?? 0) + 1
  }
  const statusBreakdown = [
    { name: 'อนุมัติ', value: qStatusMap['approved'] ?? 0, color: '#10b981' },
    { name: 'รออนุมัติ', value: qStatusMap['pending'] ?? 0, color: '#f59e0b' },
    { name: 'ฉบับร่าง', value: qStatusMap['draft'] ?? 0, color: '#6b7280' },
    { name: 'ไม่อนุมัติ', value: qStatusMap['rejected'] ?? 0, color: '#ef4444' },
  ].filter((s) => s.value > 0)

  return {
    teamQuotationCount, teamOrderCount, pendingQuotations, pendingOrders, rejectedCount, totalSales,
    monthlyData,
    statusBreakdown,
  }
}

export async function cfoStats() {
  const since = sixMonthsAgoIso()

  const [
    { count: quotationCount },
    { count: orderCount },
    { data: completedOrders },
    { data: orderItems },
    { data: teams },
    { data: recentOrders },
  ] = await Promise.all([
    supabaseAdmin.from('quotations').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders')
      .select('total_amount, created_at, customer_id, customer:customers(company_name)')
      .eq('status', 'completed'),
    supabaseAdmin.from('order_items')
      .select('quantity, total_price, product:products(name), order:orders!inner(status)')
      .eq('order.status', 'completed'),
    supabaseAdmin.from('teams').select('id, name'),
    supabaseAdmin.from('orders').select('created_at, total_amount, status').gte('created_at', since),
  ])

  const totalSales = (completedOrders ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0)

  const productMap = new Map<string, { name: string; quantity: number; sales: number }>()
  ;(orderItems ?? []).forEach((item: any) => {
    const name = item.product?.name ?? 'unknown'
    const prev = productMap.get(name) ?? { name, quantity: 0, sales: 0 }
    productMap.set(name, { name, quantity: prev.quantity + item.quantity, sales: prev.sales + item.total_price })
  })
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.sales - a.sales).slice(0, 5)

  const customerMap = new Map<string, { name: string; sales: number }>()
  ;(completedOrders ?? []).forEach((o: any) => {
    const name = o.customer?.company_name ?? 'unknown'
    const prev = customerMap.get(name) ?? { name, sales: 0 }
    customerMap.set(name, { name, sales: prev.sales + o.total_amount })
  })
  const topCustomers = Array.from(customerMap.values()).sort((a, b) => b.sales - a.sales).slice(0, 5)

  const monthlyAgg = aggregateMonthly(recentOrders ?? [], 6)
  const monthlyData = monthlyAgg.map((m) => ({ month: m.month, sales: m.revenue, orders: m.orders }))

  return {
    stats: { quotationCount, orderCount, totalSales, customerCount: customerMap.size },
    topProducts,
    topCustomers,
    monthlyData,
    teams: teams ?? [],
  }
}
