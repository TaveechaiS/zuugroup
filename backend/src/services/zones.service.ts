import { supabaseAdmin } from '../lib/supabase'
import { logActivity } from '../lib/activityLog'
import { translateError } from '../lib/translateError'
import { HttpError } from '../lib/httpError'

export type ZoneInput = {
  code: string
  name: string
  region?: string | null
  province?: string | null
  description?: string | null
}

export async function listAll() {
  const { data, error } = await supabaseAdmin
    .from('sales_zones').select('*').order('code', { ascending: true })
  if (error) throw error
  return data
}

export async function getById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('sales_zones').select('*').eq('id', id).single()
  if (error) throw new HttpError(404, { error: 'Zone not found' })
  return data
}

export async function create(actorId: string, body: ZoneInput) {
  const { data, error } = await supabaseAdmin
    .from('sales_zones')
    .insert({ ...body, created_by: actorId })
    .select().single()
  if (error) throw new HttpError(400, { error: translateError(error.message) })
  await logActivity({
    userId: actorId,
    action: 'zone.create',
    entityType: 'sales_zone',
    entityId: data.id,
    description: `สร้างเขตการขาย ${data.code} - ${data.name}`,
  })
  return data
}

export async function update(actorId: string, id: string, body: Partial<ZoneInput>) {
  const { data, error } = await supabaseAdmin
    .from('sales_zones')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw new HttpError(400, { error: translateError(error.message) })
  await logActivity({
    userId: actorId,
    action: 'zone.update',
    entityType: 'sales_zone',
    entityId: data.id,
    description: `แก้ไขเขตการขาย ${data.code} - ${data.name}`,
  })
  return data
}

export async function remove(actorId: string, id: string) {
  const { data: existing } = await supabaseAdmin
    .from('sales_zones').select('code, name').eq('id', id).single()
  const { error } = await supabaseAdmin
    .from('sales_zones').delete().eq('id', id)
  if (error) throw new HttpError(400, { error: translateError(error.message) })
  await logActivity({
    userId: actorId,
    action: 'zone.delete',
    entityType: 'sales_zone',
    entityId: id,
    description: `ลบเขตการขาย ${existing?.code ?? id} - ${existing?.name ?? ''}`,
  })
}
