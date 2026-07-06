import { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/teams.service'

const teamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function list(_req: Request, res: Response) {
  res.json({ data: await service.listAll() })
}

export async function my(req: AuthenticatedRequest, res: Response) {
  res.json({ data: await service.getMyTeam(req.user!.team_id) })
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const body = teamSchema.parse(req.body)
  const data = await service.create(req.user!.id, body)
  res.status(201).json({ data })
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const body = teamSchema.partial().parse(req.body)
  const data = await service.update(req.user!.id, req.params.id, body)
  res.json({ data })
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  await service.remove(req.user!.id, req.params.id)
  res.json({ success: true })
}
