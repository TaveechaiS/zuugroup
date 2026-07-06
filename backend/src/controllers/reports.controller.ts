import { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/reports.service'

export async function admin(req: Request, res: Response) {
  const data = await service.adminReport(req.query as any)
  res.json({ data })
}

export async function manager(req: AuthenticatedRequest, res: Response) {
  const data = await service.managerReport(req.user!.team_id)
  res.json({ data })
}
