import { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/notifications.service'

export async function list(req: AuthenticatedRequest, res: Response) {
  const data = await service.listForUser(req.user!.id)
  res.json({ data })
}

export async function markRead(req: AuthenticatedRequest, res: Response) {
  await service.markRead(req.user!.id, req.params.id)
  res.json({ success: true })
}

export async function markAllRead(req: AuthenticatedRequest, res: Response) {
  await service.markAllRead(req.user!.id)
  res.json({ success: true })
}
