import { supabaseAdmin } from '../lib/supabase'
import { logActivity } from '../lib/activityLog'
import { notifyUser } from '../lib/notify'
import { translateError } from '../lib/translateError'
import { HttpError } from '../lib/httpError'

export type Role = 'admin' | 'manager' | 'sales' | 'cfo'

export type CreateUserInput = {
  email: string
  password: string
  first_name: string
  last_name: string
  role: Role
  team_id?: string | null
  zone_id?: string | null
  phone?: string
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'email'>>

export async function listAll(includeInactive: boolean) {
  let q = supabaseAdmin
    .from('users')
    .select('*, team:teams(name)')
    .order('created_at', { ascending: false })
  if (!includeInactive) q = q.eq('is_active', true)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, team:teams(id, name)')
    .eq('id', id)
    .single()
  if (error) throw new HttpError(404, { error: 'User not found' })
  return data
}

export async function create(actorId: string, body: CreateUserInput) {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  })
  if (authError) throw new HttpError(400, { error: translateError(authError.message) })

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      role: body.role,
      team_id: body.team_id ?? null,
      zone_id: body.zone_id ?? null,
      phone: body.phone,
      is_active: true,
    })
    .select()
    .single()

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    throw new HttpError(400, { error: translateError(profileError.message) })
  }

  await logActivity({
    userId: actorId,
    action: 'user.create',
    entityType: 'user',
    entityId: profile.id,
    description: `สร้างผู้ใช้ ${profile.first_name} ${profile.last_name} (${profile.email}) บทบาท: ${profile.role}`,
  })

  await notifyUser(profile.id, {
    title: 'ยินดีต้อนรับสู่ ZUUGROUP',
    message: `บัญชีของคุณถูกสร้างเรียบร้อย ในบทบาท ${profile.role}`,
    type: 'success',
    entityType: 'user',
    entityId: profile.id,
  })

  return profile
}

export async function update(actorId: string, id: string, body: UpdateUserInput) {
  const { password, ...rest } = body

  if (password) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { password })
    if (authError) throw new HttpError(400, { error: translateError(authError.message) })
  }

  const { data, error } = await supabaseAdmin
    .from('users').update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error

  await logActivity({
    userId: actorId,
    action: password ? 'user.update+password' : 'user.update',
    entityType: 'user',
    entityId: id,
    description: `แก้ไขผู้ใช้ ${data.first_name} ${data.last_name}${password ? ' (เปลี่ยนรหัสผ่าน)' : ''}`,
  })

  if (id !== actorId) {
    await notifyUser(id, {
      title: password ? 'รหัสผ่านของคุณถูกเปลี่ยน' : 'ข้อมูลบัญชีของคุณถูกแก้ไข',
      message: password
        ? 'ผู้ดูแลระบบเปลี่ยนรหัสผ่านบัญชีของคุณ — กรุณาเข้าสู่ระบบใหม่'
        : 'ข้อมูลบัญชีของคุณถูกอัปเดตโดยผู้ดูแลระบบ',
      type: password ? 'warning' : 'info',
      entityType: 'user',
      entityId: id,
    })
  }

  return data
}

export async function deactivate(actorId: string, id: string) {
  if (id === actorId) throw new HttpError(400, { error: 'ลบบัญชีของตัวเองไม่ได้' })

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('first_name, last_name, email, is_active')
    .eq('id', id).single()

  if (!existing) throw new HttpError(404, { error: 'ไม่พบผู้ใช้' })

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      is_active: false,
      team_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error

  try {
    await supabaseAdmin.auth.admin.signOut(id, 'global' as any)
  } catch { /* best-effort */ }

  await logActivity({
    userId: actorId,
    action: 'user.deactivate',
    entityType: 'user',
    entityId: id,
    description: `ลบผู้ใช้ ${existing?.first_name ?? ''} ${existing?.last_name ?? ''} (${existing?.email ?? id}) — เอกสารยังเก็บไว้`,
  })
}
