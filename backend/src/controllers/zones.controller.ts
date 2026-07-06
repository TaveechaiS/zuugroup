import { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/zones.service'

const zoneSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  region: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export async function list(_req: Request, res: Response) {
  res.json({ data: await service.listAll() })
}

export async function get(req: Request, res: Response) {
  res.json({ data: await service.getById(req.params.id) })
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const body = zoneSchema.parse(req.body)
  const data = await service.create(req.user!.id, body)
  res.status(201).json({ data })
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const body = zoneSchema.partial().parse(req.body)
  const data = await service.update(req.user!.id, req.params.id, body)
  res.json({ data })
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  await service.remove(req.user!.id, req.params.id)
  res.json({ success: true })
}
