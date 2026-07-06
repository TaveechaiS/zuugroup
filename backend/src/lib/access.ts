import { supabaseAdmin } from './supabase'
import type { AuthenticatedRequest } from '../middleware/auth'

export async function canAccessDoc(
  user: NonNullable<AuthenticatedRequest['user']>,
  createdBy: string,
): Promise<boolean> {
  if (user.role === 'admin' || user.role === 'cfo') return true
  if (createdBy === user.id) return true
  if (user.role === 'manager' && user.team_id) {
    const { data } = await supabaseAdmin
      .from('users').select('id')
      .eq('id', createdBy).eq('team_id', user.team_id).maybeSingle()
    return !!data
  }
  return false
}

export async function getTeamMemberIds(teamId: string | null): Promise<string[]> {
  if (!teamId) return []
  const { data } = await supabaseAdmin
    .from('users').select('id').eq('team_id', teamId)
  return (data ?? []).map((m: any) => m.id)
}
