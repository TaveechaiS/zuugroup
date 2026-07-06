import { supabaseAdmin } from '../lib/supabase'
import { logActivity } from '../lib/activityLog'
import { translateError } from '../lib/translateError'
import { HttpError } from '../lib/httpError'

const categoryJoin = '*, category:product_categories(id, name)'

export function stripForRole(row: any, role: string): any {
  if (!row) return row
  const { cost_price, ...rest } = row
  if (role === 'sales' || role === 'manager') return rest
  return row
}

export type ProductInput = Partial<{
  name: string
  product_code: string | null
  quantity: number
  price_per_unit: number
  cost_price: number
  category_id: string | null
  unit: string
  image_url: string
  status: 'available' | 'unavailable'
  lot_number: string | null
  manufacture_date: string | null
  expiry_date: string | null
}>

export async function listAll() {
  const { data, error } = await supabaseAdmin
    .from('products').select(categoryJoin)
    .order('product_code', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function listCategories() {
  const { data, error } = await supabaseAdmin
    .from('product_categories').select('*').order('name')
  if (error) throw error
  return data
}

export async function getById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('products').select(categoryJoin).eq('id', id).single()
  if (error) throw new HttpError(404, { error: 'Not found' })
  return data
}

export async function getStockLogs(productId: string) {
  const { data, error } = await supabaseAdmin
    .from('stock_logs')
    .select('*, performed_by_user:users!performed_by(first_name, last_name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function create(actorId: string, body: ProductInput) {
  if (body.product_code === '') body.product_code = null
  if (body.lot_number === '') body.lot_number = null
  if (body.manufacture_date === '') body.manufacture_date = null
  if (body.expiry_date === '') body.expiry_date = null

  const { data, error } = await supabaseAdmin
    .from('products').insert(body as any)
    .select(categoryJoin).single()
  if (error) throw new HttpError(400, { error: translateError(error.message) })

  if (data.quantity > 0) {
    await supabaseAdmin.from('stock_logs').insert({
      product_id: data.id,
      change: data.quantity,
      before_qty: 0,
      after_qty: data.quantity,
      action: 'initial',
      reason: 'สต๊อกเริ่มต้นจากการสร้างสินค้า',
      lot_number: data.lot_number,
      expiry_date: data.expiry_date,
      performed_by: actorId,
    })
  }

  await logActivity({
    userId: actorId,
    action: 'product.create',
    entityType: 'product',
    entityId: data.id,
    description: `สร้างสินค้า ${data.product_code ?? ''} ${data.name} (จำนวน ${data.quantity}, ราคา ${data.price_per_unit})`,
  })
  return data
}

export async function update(actorId: string, id: string, body: ProductInput) {
  const { data: prev } = await supabaseAdmin.from('products').select('*').eq('id', id).single()
  if (!prev) throw new HttpError(404, { error: 'ไม่พบสินค้า' })

  const { data, error } = await supabaseAdmin
    .from('products').update({ ...body, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select(categoryJoin).single()
  if (error) throw new HttpError(400, { error: translateError(error.message) })

  if (body.quantity !== undefined && body.quantity !== prev.quantity) {
    const delta = body.quantity - prev.quantity
    await supabaseAdmin.from('stock_logs').insert({
      product_id: data.id,
      change: delta,
      before_qty: prev.quantity,
      after_qty: body.quantity,
      action: delta > 0 ? 'refill' : 'manual_adjust',
      reason: delta > 0 ? 'เติมสินค้าโดยผู้ดูแล' : 'ปรับสต๊อกโดยผู้ดูแล',
      lot_number: data.lot_number,
      expiry_date: data.expiry_date,
      performed_by: actorId,
    })
  }

  await logActivity({
    userId: actorId,
    action: 'product.update',
    entityType: 'product',
    entityId: data.id,
    description: `แก้ไขสินค้า ${data.product_code ?? ''} ${data.name}`,
  })
  return data
}

export async function remove(actorId: string, id: string) {
  const { data: existing } = await supabaseAdmin.from('products').select('name, product_code').eq('id', id).single()
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (error) throw new HttpError(400, { error: translateError(error.message) })
  await logActivity({
    userId: actorId,
    action: 'product.delete',
    entityType: 'product',
    entityId: id,
    description: `ลบสินค้า ${existing?.product_code ?? ''} ${existing?.name ?? id}`,
  })
}
