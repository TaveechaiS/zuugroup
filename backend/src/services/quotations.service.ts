import { supabaseAdmin } from '../lib/supabase'
import { logActivity } from '../lib/activityLog'
import { notifyRole, notifyTeamManager } from '../lib/notify'
import { translateError } from '../lib/translateError'
import { HttpError } from '../lib/httpError'
import { canAccessDoc, getTeamMemberIds } from '../lib/access'
import type { AuthenticatedRequest } from '../middleware/auth'

type User = NonNullable<AuthenticatedRequest['user']>

export type Item = {
  product_id: string
  quantity: number
  unit_price: number
  negotiated_price?: number | null
}

export type QuotationInput = {
  customer_id: string
  vat_percent: number
  include_vat: boolean
  discount_percent: number
  discount_amount: number
  other_label?: string | null
  other_amount: number
  contract_period_days?: number | null
  show_tax_id: boolean
  notes?: string
  status: 'draft' | 'pending'
  items: Item[]
}

function computeTotals(opts: {
  itemsSubtotal: number
  include_vat: boolean
  vat_percent: number
  discount_percent: number
  discount_amount: number
  other_amount: number
}) {
  const discountByPct = (opts.itemsSubtotal * opts.discount_percent) / 100
  const totalDiscount = +(discountByPct + opts.discount_amount).toFixed(2)
  const afterDiscount = Math.max(0, opts.itemsSubtotal - totalDiscount)
  const vat_amount = opts.include_vat ? +(afterDiscount * opts.vat_percent / 100).toFixed(2) : 0
  const total_amount = +(afterDiscount + vat_amount + opts.other_amount).toFixed(2)
  return { subtotal: opts.itemsSubtotal, discount: totalDiscount, vat_amount, total_amount }
}

export async function list(user: User, scope: string, status?: string) {
  let query = supabaseAdmin
    .from('quotations')
    .select('*, customer:customers(company_name), creator:users!created_by(first_name, last_name)')
    .order('created_at', { ascending: false })

  if (scope === 'my') {
    query = query.eq('created_by', user.id)
  } else if (scope === 'team' && user.role === 'manager') {
    const memberIds = await getTeamMemberIds(user.team_id)
    query = query.in('created_by', memberIds)
  } else if (scope === 'pending' && user.role === 'manager') {
    const memberIds = await getTeamMemberIds(user.team_id)
    query = query.in('created_by', memberIds).eq('status', 'pending')
  } else if (user.role === 'sales') {
    query = query.eq('created_by', user.id)
  } else if (user.role === 'manager') {
    const memberIds = await getTeamMemberIds(user.team_id)
    query = query.in('created_by', memberIds)
  }

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getById(user: User, id: string) {
  const { data, error } = await supabaseAdmin
    .from('quotations')
    .select('*, customer:customers(*), creator:users!created_by(first_name, last_name, email, role), items:quotation_items(*, product:products(name, unit, image_url))')
    .eq('id', id).single()
  if (error || !data) throw new HttpError(404, { error: 'Not found' })
  if (!(await canAccessDoc(user, data.created_by))) throw new HttpError(404, { error: 'Not found' })
  return data
}

export async function create(user: User, body: QuotationInput) {
  const itemsSubtotal = body.items.reduce((s, i) => s + (i.negotiated_price ?? i.unit_price) * i.quantity, 0)
  const totals = computeTotals({
    itemsSubtotal,
    include_vat: body.include_vat,
    vat_percent: body.vat_percent,
    discount_percent: body.discount_percent,
    discount_amount: body.discount_amount,
    other_amount: body.other_amount,
  })
  const { subtotal, vat_amount, total_amount } = totals

  const autoApprove = user.role === 'manager' && body.status === 'pending'
  const finalStatus = autoApprove ? 'approved' : body.status

  const { data: quotation, error } = await supabaseAdmin
    .from('quotations')
    .insert({
      customer_id: body.customer_id,
      created_by: user.id,
      vat_percent: body.vat_percent,
      include_vat: body.include_vat,
      discount_percent: body.discount_percent,
      discount_amount: body.discount_amount,
      other_label: body.other_label,
      other_amount: body.other_amount,
      subtotal,
      vat_amount,
      total_amount,
      notes: body.notes,
      contract_period_days: body.contract_period_days,
      show_tax_id: body.show_tax_id,
      status: finalStatus,
      approved_by: autoApprove ? user.id : null,
      approved_at: autoApprove ? new Date().toISOString() : null,
    })
    .select().single()
  if (error) throw error

  const items = body.items.map((i) => ({
    quotation_id: quotation.id,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    negotiated_price: i.negotiated_price,
    total_price: (i.negotiated_price ?? i.unit_price) * i.quantity,
  }))
  await supabaseAdmin.from('quotation_items').insert(items)

  await logActivity({
    userId: user.id,
    action: autoApprove ? 'quotation.create+auto_approve' : `quotation.create.${finalStatus}`,
    entityType: 'quotation',
    entityId: quotation.id,
    description: `สร้างใบเสนอราคา ${quotation.quotation_number} (สถานะ: ${finalStatus}, ยอด ${total_amount})`,
  })

  if (finalStatus === 'pending') {
    await notifyTeamManager(user.id, {
      title: 'มีใบเสนอราคารออนุมัติ',
      message: `${user.email ?? 'พนักงาน'} ส่งใบเสนอราคา ${quotation.quotation_number} (฿${total_amount.toLocaleString()}) รออนุมัติ`,
      type: 'info',
      entityType: 'quotation',
      entityId: quotation.id,
    })
  }
  if (autoApprove) {
    await notifyRole('admin', {
      title: 'ใบเสนอราคาใหม่ (อนุมัติอัตโนมัติ)',
      message: `ผู้จัดการสร้าง+อนุมัติใบเสนอราคา ${quotation.quotation_number} (฿${total_amount.toLocaleString()})`,
      type: 'success',
      entityType: 'quotation',
      entityId: quotation.id,
    })
  }

  return quotation
}

export async function updateMeta(actorId: string, id: string, body: { quotation_number?: string; notes?: string | null }) {
  const { data, error } = await supabaseAdmin
    .from('quotations')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw new HttpError(400, { error: translateError(error.message) })

  await logActivity({
    userId: actorId,
    action: 'quotation.edit_meta',
    entityType: 'quotation',
    entityId: id,
    description: `แก้ไขข้อมูลใบเสนอราคา ${data.quotation_number}`,
  })
  return data
}

export async function update(user: User, id: string, body: QuotationInput) {
  const { data: existing } = await supabaseAdmin.from('quotations').select('*').eq('id', id).single()
  if (!existing) throw new HttpError(404, { error: 'Not found' })
  if (existing.status !== 'draft' && existing.status !== 'pending') {
    throw new HttpError(400, { error: 'Can only edit draft or pending quotations' })
  }
  if (user.role === 'sales' && existing.created_by !== user.id) {
    throw new HttpError(403, { error: 'Forbidden' })
  }
  if (user.role === 'manager' && !(await canAccessDoc(user, existing.created_by))) {
    throw new HttpError(403, { error: 'Forbidden' })
  }

  const subtotal = body.items.reduce((s, i) => s + (i.negotiated_price ?? i.unit_price) * i.quantity, 0)
  const vat_amount = (subtotal * body.vat_percent) / 100
  const total_amount = subtotal + vat_amount

  const { error } = await supabaseAdmin.from('quotations').update({
    customer_id: body.customer_id,
    vat_percent: body.vat_percent,
    subtotal,
    vat_amount,
    total_amount,
    notes: body.notes,
    contract_period_days: body.contract_period_days,
    show_tax_id: body.show_tax_id,
    status: body.status,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw error

  await supabaseAdmin.from('quotation_items').delete().eq('quotation_id', id)
  const items = body.items.map((i) => ({
    quotation_id: id,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    negotiated_price: i.negotiated_price,
    total_price: (i.negotiated_price ?? i.unit_price) * i.quantity,
  }))
  await supabaseAdmin.from('quotation_items').insert(items)

  await logActivity({
    userId: user.id,
    action: 'quotation.update',
    entityType: 'quotation',
    entityId: id,
    description: `แก้ไขใบเสนอราคา ${existing.quotation_number} (สถานะ: ${body.status})`,
  })
}

export async function approve(user: User, id: string) {
  const { data: q } = await supabaseAdmin.from('quotations').select('*').eq('id', id).single()
  if (!q) throw new HttpError(404, { error: 'Not found' })
  if (!(await canAccessDoc(user, q.created_by))) throw new HttpError(403, { error: 'Forbidden' })

  const { data: updated, error: updateError } = await supabaseAdmin.from('quotations').update({
    status: 'approved',
    approved_by: user.id,
    approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (updateError) {
    console.error('Quotation approve update error:', updateError)
    throw new HttpError(500, { error: `อนุมัติไม่สำเร็จ: ${updateError.message}` })
  }
  if (!updated || updated.status !== 'approved') {
    throw new HttpError(500, { error: 'อนุมัติไม่สำเร็จ - ไม่สามารถเปลี่ยนสถานะได้' })
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: q.created_by,
    title: 'ใบเสนอราคาได้รับการอนุมัติ',
    message: `ใบเสนอราคา ${q.quotation_number} ได้รับการอนุมัติแล้ว`,
    type: 'success',
    related_entity_type: 'quotation',
    related_entity_id: q.id,
  })

  await logActivity({
    userId: user.id,
    action: 'quotation.approve',
    entityType: 'quotation',
    entityId: q.id,
    description: `อนุมัติใบเสนอราคา ${q.quotation_number}`,
  })
  return updated
}

export async function reject(user: User, id: string, reason: string) {
  const { data: q } = await supabaseAdmin.from('quotations').select('*').eq('id', id).single()
  if (!q) throw new HttpError(404, { error: 'Not found' })
  if (!(await canAccessDoc(user, q.created_by))) throw new HttpError(403, { error: 'Forbidden' })

  await supabaseAdmin.from('quotations').update({
    status: 'rejected', reject_reason: reason,
  }).eq('id', id)

  await supabaseAdmin.from('notifications').insert({
    user_id: q.created_by,
    title: 'ใบเสนอราคาไม่อนุมัติ',
    message: `ใบเสนอราคา ${q.quotation_number} ไม่ผ่านการอนุมัติ: ${reason}`,
    type: 'error',
    related_entity_type: 'quotation',
    related_entity_id: q.id,
  })

  await logActivity({
    userId: user.id,
    action: 'quotation.reject',
    entityType: 'quotation',
    entityId: q.id,
    description: `ปฏิเสธใบเสนอราคา ${q.quotation_number}: ${reason}`,
  })
}
