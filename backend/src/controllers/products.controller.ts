import { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/products.service'

const productSchema = z.object({
  name: z.string().min(1),
  product_code: z.string().optional().nullable(),
  quantity: z.number().int().nonnegative(),
  price_per_unit: z.number().nonnegative(),
  cost_price: z.number().nonnegative().optional(),
  category_id: z.string().uuid().nullable().optional(),
  unit: z.string().optional(),
  image_url: z.string().optional().or(z.literal('')),
  status: z.enum(['available', 'unavailable']).default('available'),
  lot_number: z.string().optional().nullable(),
  manufacture_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
})

export async function list(req: AuthenticatedRequest, res: Response) {
  const data = await service.listAll()
  const role = req.user!.role
  res.json({ data: data.map((p: any) => service.stripForRole(p, role)) })
}

export async function categories(_req: Request, res: Response) {
  res.json({ data: await service.listCategories() })
}

export async function get(req: AuthenticatedRequest, res: Response) {
  const data = await service.getById(req.params.id)
  res.json({ data: service.stripForRole(data, req.user!.role) })
}

export async function stockLogs(req: Request, res: Response) {
  res.json({ data: await service.getStockLogs(req.params.id) })
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const body = productSchema.parse(req.body)
  const data = await service.create(req.user!.id, body)
  res.status(201).json({ data })
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const body = productSchema.partial().parse(req.body)
  const data = await service.update(req.user!.id, req.params.id, body)
  res.json({ data })
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  await service.remove(req.user!.id, req.params.id)
  res.json({ success: true })
}
