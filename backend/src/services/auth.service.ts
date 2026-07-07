import { supabaseAdmin } from '../lib/supabase'
import { logActivity } from '../lib/activityLog'
import { translateError } from '../lib/translateError'
import { HttpError } from '../lib/httpError'

type ReqMeta = { ip?: string | null; userAgent?: string | null }

export async function login(email: string, password: string, meta: ReqMeta) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
  if (error) throw new HttpError(401, { error: translateError(error.message) })

  const { data: profile } = await supabaseAdmin
    .from('users').select('*, team:teams(id, name)').eq('id', data.user.id).single()

  if (!profile) throw new HttpError(404, { error: 'ไม่พบโปรไฟล์ผู้ใช้' })
  if (profile.is_active === false) {
    try { await supabaseAdmin.auth.admin.signOut(data.session?.access_token ?? '') } catch { /* ignore */ }
    throw new HttpError(403, { error: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' })
  }

  await logActivity({
    userId: data.user.id,
    action: 'login',
    description: `เข้าสู่ระบบ (${profile?.email ?? data.user.email})`,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  })

  return { session: data.session, user: profile }
}

export async function logout(userId: string, jwt: string, email: string | null, meta: ReqMeta) {
  await supabaseAdmin.auth.admin.signOut(jwt)
  await logActivity({
    userId,
    action: 'logout',
    description: `ออกจากระบบ (${email ?? ''})`,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  })
}

// In-memory rate-limiter (per-process; use Redis in prod-multi-instance)
const RESET_COOLDOWN_MS = 2 * 60 * 1000
const RESET_DAILY_CAP = 10
const RESET_DAY_MS = 24 * 60 * 60 * 1000

interface ResetAttempt { count: number; firstAt: number; lastAt: number }
const resetAttempts = new Map<string, ResetAttempt>()

function checkResetRateLimit(email: string): { ok: true } | { ok: false; message: string } {
  const now = Date.now()
  const key = email.toLowerCase().trim()
  const entry = resetAttempts.get(key)

  if (!entry || now - entry.firstAt > RESET_DAY_MS) {
    resetAttempts.set(key, { count: 1, firstAt: now, lastAt: now })
    return { ok: true }
  }
  if (entry.count >= RESET_DAILY_CAP) {
    const hoursLeft = Math.ceil((RESET_DAY_MS - (now - entry.firstAt)) / (60 * 60 * 1000))
    return { ok: false, message: `ขอลิงก์รีเซ็ตเกิน ${RESET_DAILY_CAP} ครั้งต่อวันแล้ว กรุณารออีก ${hoursLeft} ชั่วโมง` }
  }
  const sinceLast = now - entry.lastAt
  if (sinceLast < RESET_COOLDOWN_MS) {
    const secsLeft = Math.ceil((RESET_COOLDOWN_MS - sinceLast) / 1000)
    return { ok: false, message: `กรุณารออีก ${secsLeft} วินาทีก่อนขอลิงก์รีเซ็ตอีกครั้ง` }
  }
  entry.count += 1
  entry.lastAt = now
  return { ok: true }
}

export async function forgotPassword(email: string, frontendUrl: string) {
  const limit = checkResetRateLimit(email)
  if (!limit.ok) throw new HttpError(429, { error: limit.message })

  const redirectTo = `${frontendUrl.replace(/\/$/, '')}/auth/reset-password`
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) {
    const msg = (error.message ?? '').toLowerCase()
    if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
      throw new HttpError(429, {
        error: 'ระบบส่งอีเมลถูกจำกัดชั่วคราว กรุณารอประมาณ 60 นาที หรือติดต่อผู้ดูแลระบบเพื่อเพิ่ม SMTP custom',
      })
    }
    throw new HttpError(400, { error: translateError(error.message) })
  }
}

export async function updateMe(
  userId: string,
  body: { first_name?: string; last_name?: string; phone?: string; new_password?: string },
  meta: ReqMeta,
) {
  const { new_password, ...rest } = body

  if (new_password) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: new_password })
    if (authError) throw new HttpError(400, { error: translateError(authError.message) })
  }

  const { data, error } = await supabaseAdmin
    .from('users').update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', userId).select('*, team:teams(id, name)').single()
  if (error) throw error

  await logActivity({
    userId,
    action: new_password ? 'user.self_update+password' : 'user.self_update',
    entityType: 'user',
    entityId: userId,
    description: `แก้ไขข้อมูลส่วนตัว${new_password ? ' (เปลี่ยนรหัสผ่าน)' : ''} (${data.email})`,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  })

  return data
}

export async function resetPassword(accessToken: string, newPassword: string, meta: ReqMeta) {
  const { data: userData, error: getErr } = await supabaseAdmin.auth.getUser(accessToken)
  if (getErr || !userData?.user) {
    throw new HttpError(400, { error: 'ลิงก์รีเซ็ตหมดอายุหรือไม่ถูกต้อง กรุณาขอใหม่' })
  }
  const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(
    userData.user.id, { password: newPassword },
  )
  if (updErr) throw new HttpError(400, { error: updErr.message })

  await logActivity({
    userId: userData.user.id,
    action: 'user.reset_password',
    description: `รีเซ็ตรหัสผ่าน (${userData.user.email})`,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  })
}
