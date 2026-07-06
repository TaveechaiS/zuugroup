import { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/badges.service'

export async function get(req: AuthenticatedRequest, res: Response) {
  const data = await service.getBadges(req.user!.role, req.user!.id, req.user!.team_id)
  res.json({ data })
}
