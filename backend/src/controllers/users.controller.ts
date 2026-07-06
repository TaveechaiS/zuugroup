import { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/users.service'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: z.enum(['admin', 'manager', 'sales', 'cfo']),
  team_id: z.string().uuid().nullable().optional(),
  zone_id: z.string().uuid().nullable().optional(),
  phone: z.string().optional(),
})

const updateUserSchema = createUserSchema.partial().omit({ email: true }).extend({
  password: z.string().min(6).optional(),
})

export async function list(req: Request, res: Response) {
  const includeInactive = String((req.query as any).include_inactive ?? '') === 'true'
  res.json({ data: await service.listAll(includeInactive) })
}

export async function get(req: Request, res: Response) {
  res.json({ data: await service.getById(req.params.id) })
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const body = createUserSchema.parse(req.body)
  const data = await service.create(req.user!.id, body)
  res.status(201).json({ data })
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const body = updateUserSchema.parse(req.body)
  const data = await service.update(req.user!.id, req.params.id, body)
  res.json({ data })
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  await service.deactivate(req.user!.id, req.params.id)
  res.json({ success: true })
}
