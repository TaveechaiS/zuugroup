import { Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/orders.service'

const itemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
})

const createSchema = z.object({
  customer_id: z.string().uuid(),
  items: z.array(itemSchema).min(1),
  vat_percent: z.number().nonnegative().optional(),
  include_vat: z.boolean().default(true),
  discount_percent: z.number().min(0).max(100).default(0),
  discount_amount: z.number().nonnegative().default(0),
  other_label: z.string().optional().nullable(),
  other_amount: z.number().default(0),
  show_tax_id: z.boolean().default(true),
  source_quotation_id: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'pending_review']).default('pending_review'),
})

const metaSchema = z.object({
  order_number: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
})

export async function list(req: AuthenticatedRequest, res: Response) {
  const { scope = 'visible', status } = req.query as { scope?: string; status?: string }
  res.json({ data: await service.list(req.user!, scope, status) })
}

export async function get(req: AuthenticatedRequest, res: Response) {
  res.json({ data: await service.getById(req.user!, req.params.id) })
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const body = createSchema.parse(req.body)
  const data = await service.create(req.user!, body)
  res.status(201).json({ data })
}

export async function reviewPass(req: AuthenticatedRequest, res: Response) {
  await service.reviewPass(req.user!, req.params.id)
  res.json({ success: true })
}

export async function reviewReject(req: AuthenticatedRequest, res: Response) {
  const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body)
  await service.reviewReject(req.user!, req.params.id, reason)
  res.json({ success: true })
}

export async function updateMeta(req: AuthenticatedRequest, res: Response) {
  const body = metaSchema.parse(req.body)
  const data = await service.updateMeta(req.user!.id, req.params.id, body)
  res.json({ data })
}

export async function confirm(req: AuthenticatedRequest, res: Response) {
  const data = await service.confirm(req.user!.id, req.params.id)
  res.json({ success: true, data })
}

export async function cancel(req: AuthenticatedRequest, res: Response) {
  const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body)
  const data = await service.cancel(req.user!.id, req.params.id, reason)
  res.json({ success: true, data })
}
