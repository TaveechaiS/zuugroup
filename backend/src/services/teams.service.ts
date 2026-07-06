import { supabaseAdmin } from '../lib/supabase'
import { logActivity } from '../lib/activityLog'

export async function listAll() {
  const { data, error } = await supabaseAdmin
    .from('teams')
    .select('*, members:users(id, first_name, last_name, role, email)')
    .order('name')
  if (error) throw error
  return data
}

export async function getMyTeam(teamId: string | null) {
  if (!teamId) return { team: null, members: [] }
  const { data: team } = await supabaseAdmin
    .from('teams').select('*').eq('id', teamId).single()
  const { data: members } = await supabaseAdmin
    .from('users').select('*').eq('team_id', teamId).order('first_name')
  return { team, members }
}

export async function create(actorId: string, body: { name: string; description?: string }) {
  const { data, error } = await supabaseAdmin
    .from('teams').insert(body)
    .select('*, members:users(*)').single()
  if (error) throw error
  await logActivity({
    userId: actorId,
    action: 'team.create',
    entityType: 'team',
    entityId: data.id,
    description: `สร้างทีม ${data.name}`,
  })
  return data
}

export async function update(actorId: string, id: string, body: Partial<{ name: string; description: string }>) {
  const { data, error } = await supabaseAdmin
    .from('teams').update(body).eq('id', id).select().single()
  if (error) throw error
  await logActivity({
    userId: actorId,
    action: 'team.update',
    entityType: 'team',
    entityId: data.id,
    description: `แก้ไขทีม ${data.name}`,
  })
  return data
}

export async function remove(actorId: string, id: string) {
  const { data: existing } = await supabaseAdmin.from('teams').select('name').eq('id', id).single()
  const { error } = await supabaseAdmin.from('teams').delete().eq('id', id)
  if (error) throw error
  await logActivity({
    userId: actorId,
    action: 'team.delete',
    entityType: 'team',
    entityId: id,
    description: `ลบทีม ${existing?.name ?? id}`,
  })
}
