import { Request, Response } from 'express'
import * as service from '../services/activityLogs.service'

export async function list(_req: Request, res: Response) {
  const data = await service.listRecent()
  res.json({ data })
}
