import { supabaseAdmin } from '../lib/supabase'
import { logActivity } from '../lib/activityLog'
import { notifyRole } from '../lib/notify'
import { HttpError } from '../lib/httpError'

const requesterJoin = '*, requester:users!requested_by(first_name, last_name, email)'

export type RequestInput = {
  company_name: string
  address?: string
  contact_name?: string
  phone?: string
  email?: string
  drug_license_number?: string
  location_image_url?: string
  drug_license_image_url?: string
  hospital_license_image_url?: string
}

export async function listPending() {
  const { data, error } = await supabaseAdmin
    .from('customer_requests').select(requesterJoin)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('customer_requests').select(requesterJoin).eq('id', id).single()
  if (error) throw new HttpError(404, { error: 'Not found' })
  return data
}

export async function create(actor: { id: string; email: string | null }, body: RequestInput) {
  const { data, error } = await supabaseAdmin
    .from('customer_requests')
    .insert({ ...body, requested_by: actor.id, status: 'pending' })
    .select().single()
  if (error) throw error

  await logActivity({
    userId: actor.id,
    action: 'customer_request.create',
    entityType: 'customer_request',
    entityId: data.id,
    description: `ส่งคำขอเพิ่มลูกค้า ${data.company_name}`,
  })
  await notifyRole('admin', {
    title: 'มีคำขอเพิ่มลูกค้าใหม่',
    message: `${actor.email ?? 'ผู้ใช้'} ส่งคำขอเพิ่มลูกค้า "${data.company_name}"`,
    type: 'info',
    entityType: 'customer_request',
    entityId: data.id,
  })
  return data
}

export async function approve(actorId: string, id: string) {
  const { data: request } = await supabaseAdmin
    .from('customer_requests').select('*').eq('id', id).single()
  if (!request) throw new HttpError(404, { error: 'Request not found' })

  await supabaseAdmin.from('customers').insert({
    company_name: request.company_name,
    address: request.address,
    contact_name: request.contact_name,
    phone: request.phone,
    email: request.email,
    drug_license_number: request.drug_license_number,
    location_image_url: request.location_image_url,
    drug_license_image_url: request.drug_license_image_url,
    hospital_license_image_url: request.hospital_license_image_url,
    created_by: request.requested_by,
  })

  await supabaseAdmin.from('customer_requests').update({
    status: 'approved',
    reviewed_by: actorId,
    reviewed_at: new Date().toISOString(),
  }).eq('id', id)

  await supabaseAdmin.from('notifications').insert({
    user_id: request.requested_by,
    title: 'คำขอเพิ่มลูกค้าได้รับอนุมัติ',
    message: `คำขอเพิ่ม "${request.company_name}" ได้รับอนุมัติแล้ว`,
    type: 'success',
  })

  await logActivity({
    userId: actorId,
    action: 'customer_request.approve',
    entityType: 'customer_request',
    entityId: id,
    description: `อนุมัติคำขอเพิ่มลูกค้า ${request.company_name}`,
  })
}

export async function reject(actorId: string, id: string, reason: string) {
  const { data: request } = await supabaseAdmin
    .from('customer_requests').select('*').eq('id', id).single()
  if (!request) throw new HttpError(404, { error: 'Not found' })

  await supabaseAdmin.from('customer_requests').update({
    status: 'rejected',
    reviewed_by: actorId,
    reviewed_at: new Date().toISOString(),
    reject_reason: reason,
  }).eq('id', id)

  await supabaseAdmin.from('notifications').insert({
    user_id: request.requested_by,
    title: 'คำขอเพิ่มลูกค้าถูกปฏิเสธ',
    message: `คำขอเพิ่ม "${request.company_name}" ถูกปฏิเสธ: ${reason}`,
    type: 'error',
  })

  await logActivity({
    userId: actorId,
    action: 'customer_request.reject',
    entityType: 'customer_request',
    entityId: id,
    description: `ปฏิเสธคำขอเพิ่มลูกค้า ${request.company_name}: ${reason}`,
  })
}
