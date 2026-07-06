import { supabaseAdmin } from '../lib/supabase'
import { logActivity } from '../lib/activityLog'
import { HttpError } from '../lib/httpError'

export type CustomerInput = Partial<{
  company_name: string
  customer_code: string | null
  zone_id: string | null
  address: string
  contact_name: string
  phone: string
  email: string
  has_tax_id: boolean
  tax_id: string | null
  drug_license_number: string
  location_image_url: string
  drug_license_image_url: string
  hospital_license_image_url: string
}>

const zoneJoin = '*, zone:sales_zones(id, code, name, region, province)'

export async function listAll() {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select(zoneJoin)
    .order('customer_code', { ascending: true })
  if (error) throw error
  return data
}

export async function getById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('customers').select(zoneJoin).eq('id', id).single()
  if (error) throw new HttpError(404, { error: 'Not found' })
  return data
}

export async function create(actorId: string, body: CustomerInput) {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .insert({ ...body, created_by: actorId })
    .select().single()
  if (error) throw error
  await logActivity({
    userId: actorId,
    action: 'customer.create',
    entityType: 'customer',
    entityId: data.id,
    description: `เพิ่มลูกค้า ${data.company_name}`,
  })
  return data
}

export async function update(actorId: string, id: string, body: CustomerInput) {
  const { data, error } = await supabaseAdmin
    .from('customers').update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  await logActivity({
    userId: actorId,
    action: 'customer.update',
    entityType: 'customer',
    entityId: data.id,
    description: `แก้ไขลูกค้า ${data.company_name}`,
  })
  return data
}

export async function remove(actorId: string, id: string) {
  const { data: existing } = await supabaseAdmin.from('customers').select('company_name').eq('id', id).single()
  const { error } = await supabaseAdmin.from('customers').delete().eq('id', id)
  if (error) throw error
  await logActivity({
    userId: actorId,
    action: 'customer.delete',
    entityType: 'customer',
    entityId: id,
    description: `ลบลูกค้า ${existing?.company_name ?? id}`,
  })
}

export async function listPrices(id: string) {
  const { data, error } = await supabaseAdmin
    .from('customer_product_prices')
    .select('product_id, custom_price')
    .eq('customer_id', id)
  if (error) throw error
  return data
}
