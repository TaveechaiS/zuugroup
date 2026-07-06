import { supabaseAdmin } from '../lib/supabase'
import { logActivity } from '../lib/activityLog'
import { notifyRole, notifyTeamManager } from '../lib/notify'
import { translateError } from '../lib/translateError'
import { HttpError } from '../lib/httpError'
import { canAccessDoc, getTeamMemberIds } from '../lib/access'
import type { AuthenticatedRequest } from '../middleware/auth'

type User = NonNullable<AuthenticatedRequest['user']>

export type Item = { product_id: string; quantity: number; unit_price: number }

export type OrderInput = {
  customer_id: string
  items: Item[]
  vat_percent?: number
  include_vat: boolean
  discount_percent: number
  discount_amount: number
  other_label?: string | null
  other_amount: number
  show_tax_id: boolean
  source_quotation_id?: string | null
  notes?: string
  status: 'draft' | 'pending_review'
}

export async function list(user: User, scope: string, status?: string) {
  let query = supabaseAdmin
    .from('orders')
    .select('*, customer:customers(company_name), creator:users!created_by(first_name, last_name)')
    .order('created_at', { ascending: false })

  if (scope === 'my') {
    query = query.eq('created_by', user.id)
  } else if ((scope === 'team' || scope === 'pending') && user.role === 'manager') {
    const memberIds = await getTeamMemberIds(user.team_id)
    query = query.in('created_by', memberIds)
    if (scope === 'pending') query = query.eq('status', 'pending_review')
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
    .from('orders')
    .select('*, customer:customers(*), creator:users!created_by(first_name, last_name, email, role), items:order_items(*, product:products(name, unit, image_url))')
    .eq('id', id).single()
  if (error || !data) throw new HttpError(404, { error: 'Not found' })
  if (!(await canAccessDoc(user, data.created_by))) throw new HttpError(404, { error: 'Not found' })
  return data
}

export async function create(user: User, body: OrderInput) {
  const isDraft = body.status === 'draft'

  if (body.source_quotation_id) {
    const { data: srcQ } = await supabaseAdmin
      .from('quotations').select('id, status, created_by, quotation_number')
      .eq('id', body.source_quotation_id).maybeSingle()
    if (!srcQ) throw new HttpError(404, { error: 'ไม่พบใบเสนอราคาต้นทาง' })
    if (!(await canAccessDoc(user, srcQ.created_by))) {
      throw new HttpError(403, { error: 'ไม่มีสิทธิ์ใช้ใบเสนอราคานี้' })
    }
    if (srcQ.status !== 'approved') {
      throw new HttpError(400, {
        error: srcQ.status === 'ordered'
          ? 'ใบเสนอราคานี้ออกคำสั่งซื้อไปแล้ว'
          : 'ใบเสนอราคาต้องได้รับการอนุมัติก่อน จึงจะออกคำสั่งซื้อได้',
      })
    }
  }

  if (!isDraft) {
    const productIds = body.items.map((i) => i.product_id)
    const { data: stockRows } = await supabaseAdmin
      .from('products').select('id, name, quantity, unit').in('id', productIds)
    const stockMap = new Map((stockRows ?? []).map((p: any) => [p.id, p]))
    const insufficient = body.items
      .map((i) => {
        const p = stockMap.get(i.product_id)
        return p && i.quantity > p.quantity
          ? { name: p.name, requested: i.quantity, available: p.quantity, unit: p.unit ?? '' }
          : null
      })
      .filter(Boolean) as Array<{ name: string; requested: number; available: number; unit: string }>

    if (insufficient.length > 0) {
      throw new HttpError(400, { error: 'จำนวนสินค้าไม่เพียงพอ', detail: insufficient })
    }
  }

  const itemsSubtotal = body.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const vat_percent = body.vat_percent ?? 7
  const discountByPct = (itemsSubtotal * body.discount_percent) / 100
  const totalDiscount = +(discountByPct + body.discount_amount).toFixed(2)
  const afterDiscount = Math.max(0, itemsSubtotal - totalDiscount)
  const vat_amount = body.include_vat ? +(afterDiscount * vat_percent / 100).toFixed(2) : 0
  const total = +(afterDiscount + vat_amount + body.other_amount).toFixed(2)

  const autoApprove = user.role === 'manager'
  const fromApprovedQuotation = !!body.source_quotation_id
  const finalStatus = isDraft
    ? 'draft'
    : fromApprovedQuotation
      ? 'processing'
      : 'pending_review'
  const stampReviewed = autoApprove || fromApprovedQuotation

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_id: body.customer_id,
      created_by: user.id,
      subtotal: itemsSubtotal,
      vat_percent,
      include_vat: body.include_vat,
      discount_percent: body.discount_percent,
      discount_amount: body.discount_amount,
      other_label: body.other_label,
      other_amount: body.other_amount,
      vat_amount,
      total_amount: total,
      show_tax_id: body.show_tax_id,
      source_quotation_id: body.source_quotation_id ?? null,
      notes: body.notes ?? null,
      status: finalStatus,
      reviewed_by: stampReviewed ? user.id : null,
      reviewed_at: stampReviewed ? new Date().toISOString() : null,
    })
    .select().single()
  if (error) throw error

  await supabaseAdmin.from('order_items').insert(
    body.items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.unit_price * i.quantity,
    })),
  )

  if (body.source_quotation_id && !isDraft) {
    await supabaseAdmin.from('quotations')
      .update({ status: 'ordered', updated_at: new Date().toISOString() })
      .eq('id', body.source_quotation_id)
    await logActivity({
      userId: user.id,
      action: 'quotation.convert_to_order',
      entityType: 'quotation',
      entityId: body.source_quotation_id,
      description: `ออกคำสั่งซื้อ ${order.order_number} จากใบเสนอราคา`,
    })
  }

  await logActivity({
    userId: user.id,
    action: autoApprove ? 'order.create+auto_approve' : 'order.create',
    entityType: 'order',
    entityId: order.id,
    description: `สร้างคำสั่งซื้อ ${order.order_number} (สถานะ: ${finalStatus}, ยอด ${total})`,
  })

  if (finalStatus === 'pending_review') {
    await notifyTeamManager(user.id, {
      title: 'มีคำสั่งซื้อรอตรวจสอบ',
      message: `${user.email ?? 'พนักงาน'} ส่งคำสั่งซื้อ ${order.order_number} (฿${total.toLocaleString()}) รอตรวจสอบ`,
      type: 'info',
      entityType: 'order',
      entityId: order.id,
    })
  }
  if (autoApprove && finalStatus === 'pending_review') {
    await notifyRole('admin', {
      title: 'มีคำสั่งซื้อรอยืนยันการขาย (จากผู้จัดการ)',
      message: `ผู้จัดการสร้างคำสั่งซื้อ ${order.order_number} (฿${total.toLocaleString()}) — พร้อมยืนยันการขาย`,
      type: 'info',
      entityType: 'order',
      entityId: order.id,
    })
  }
  if (finalStatus === 'processing') {
    await notifyRole('admin', {
      title: 'คำสั่งซื้อพร้อมยืนยันการขาย (จากใบเสนอราคาที่อนุมัติแล้ว)',
      message: `คำสั่งซื้อ ${order.order_number} (฿${total.toLocaleString()}) แปลงจากใบเสนอราคาที่อนุมัติแล้ว — ข้ามขั้นตรวจสอบ พร้อมยืนยันการขาย`,
      type: 'info',
      entityType: 'order',
      entityId: order.id,
    })
  }

  return order
}

export async function reviewPass(user: User, id: string) {
  const { data: o } = await supabaseAdmin.from('orders').select('*').eq('id', id).single()
  if (!o) throw new HttpError(404, { error: 'Not found' })
  if (!(await canAccessDoc(user, o.created_by))) throw new HttpError(403, { error: 'Forbidden' })

  await supabaseAdmin.from('orders').update({
    status: 'processing',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', id)

  await supabaseAdmin.from('notifications').insert({
    user_id: o.created_by,
    title: 'คำสั่งซื้อผ่านการตรวจสอบ',
    message: `คำสั่งซื้อ ${o.order_number} ผ่านการตรวจสอบ กำลังดำเนินการ`,
    type: 'success',
    related_entity_type: 'order',
    related_entity_id: o.id,
  })

  await logActivity({
    userId: user.id,
    action: 'order.review_pass',
    entityType: 'order',
    entityId: o.id,
    description: `อนุมัติการตรวจสอบคำสั่งซื้อ ${o.order_number}`,
  })

  await notifyRole('admin', {
    title: 'คำสั่งซื้อพร้อมยืนยันการขาย',
    message: `คำสั่งซื้อ ${o.order_number} (฿${(o.total_amount ?? 0).toLocaleString()}) ผ่านการตรวจสอบจากผู้จัดการแล้ว`,
    type: 'info',
    entityType: 'order',
    entityId: o.id,
  })
}

export async function reviewReject(user: User, id: string, reason: string) {
  const { data: o } = await supabaseAdmin.from('orders').select('*').eq('id', id).single()
  if (!o) throw new HttpError(404, { error: 'Not found' })
  if (!(await canAccessDoc(user, o.created_by))) throw new HttpError(403, { error: 'Forbidden' })

  await supabaseAdmin.from('orders').update({
    status: 'rejected',
    reject_reason: reason,
  }).eq('id', id)

  await supabaseAdmin.from('notifications').insert({
    user_id: o.created_by,
    title: 'คำสั่งซื้อไม่ผ่าน',
    message: `คำสั่งซื้อ ${o.order_number} ไม่ผ่าน: ${reason}`,
    type: 'error',
    related_entity_type: 'order',
    related_entity_id: o.id,
  })

  await logActivity({
    userId: user.id,
    action: 'order.review_reject',
    entityType: 'order',
    entityId: o.id,
    description: `ปฏิเสธคำสั่งซื้อ ${o.order_number}: ${reason}`,
  })
}

export async function updateMeta(actorId: string, id: string, body: { order_number?: string; notes?: string | null }) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw new HttpError(400, { error: translateError(error.message) })

  await logActivity({
    userId: actorId,
    action: 'order.edit_meta',
    entityType: 'order',
    entityId: id,
    description: `แก้ไขข้อมูลคำสั่งซื้อ ${data.order_number}`,
  })
  return data
}

export async function confirm(actorId: string, id: string) {
  const { data: o } = await supabaseAdmin.from('orders').select('*').eq('id', id).single()
  if (!o) throw new HttpError(404, { error: 'ไม่พบคำสั่งซื้อ' })

  const { data: updated, error: updateError } = await supabaseAdmin.from('orders').update({
    status: 'completed',
    processed_by: actorId,
    processed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (updateError) {
    console.error('Order confirm update error:', updateError)
    throw new HttpError(500, { error: `ยืนยันการขายไม่สำเร็จ: ${updateError.message}` })
  }
  if (!updated || updated.status !== 'completed') {
    throw new HttpError(500, { error: 'ยืนยันการขายไม่สำเร็จ - ไม่สามารถเปลี่ยนสถานะได้' })
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: o.created_by,
    title: 'คำสั่งซื้อยืนยันเรียบร้อย',
    message: `คำสั่งซื้อ ${o.order_number} ได้รับการยืนยันสำเร็จ`,
    type: 'success',
    related_entity_type: 'order',
    related_entity_id: o.id,
  })

  await logActivity({
    userId: actorId,
    action: 'order.confirm',
    entityType: 'order',
    entityId: o.id,
    description: `ยืนยันการขายคำสั่งซื้อ ${o.order_number}`,
  })

  await notifyTeamManager(o.created_by, {
    title: 'มีคำสั่งซื้อยืนยันการขายแล้ว',
    message: `คำสั่งซื้อ ${o.order_number} (฿${(o.total_amount ?? 0).toLocaleString()}) ยืนยันการขายเรียบร้อย`,
    type: 'success',
    entityType: 'order',
    entityId: o.id,
  })
  await notifyRole('cfo', {
    title: 'มียอดขายใหม่',
    message: `คำสั่งซื้อ ${o.order_number} ยืนยันการขาย ฿${(o.total_amount ?? 0).toLocaleString()}`,
    type: 'success',
    entityType: 'order',
    entityId: o.id,
  })

  return updated
}

export async function cancel(actorId: string, id: string, reason: string) {
  const { data: o } = await supabaseAdmin.from('orders').select('order_number').eq('id', id).single()
  if (!o) throw new HttpError(404, { error: 'ไม่พบคำสั่งซื้อ' })

  const { data: updated, error: updateError } = await supabaseAdmin.from('orders').update({
    status: 'cancelled',
    reject_reason: reason,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (updateError) {
    console.error('Order cancel update error:', updateError)
    throw new HttpError(500, { error: `ยกเลิกคำสั่งซื้อไม่สำเร็จ: ${updateError.message}` })
  }
  if (!updated || updated.status !== 'cancelled') {
    throw new HttpError(500, { error: 'ยกเลิกคำสั่งซื้อไม่สำเร็จ - ไม่สามารถเปลี่ยนสถานะได้' })
  }

  await logActivity({
    userId: actorId,
    action: 'order.cancel',
    entityType: 'order',
    entityId: id,
    description: `ยกเลิกคำสั่งซื้อ ${o?.order_number ?? id}: ${reason}`,
  })
  return updated
}
