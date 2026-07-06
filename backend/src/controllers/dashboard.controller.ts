import { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/dashboard.service'

export async function admin(_req: Request, res: Response) {
  res.json({ data: await service.adminStats() })
}

export async function manager(req: AuthenticatedRequest, res: Response) {
  res.json({ data: await service.managerStats(req.user!.team_id) })
}

export async function cfo(_req: Request, res: Response) {
  res.json({ data: await service.cfoStats() })
}
