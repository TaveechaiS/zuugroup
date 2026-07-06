import { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/customers.service'

const customerSchema = z.object({
  company_name: z.string().min(1),
  customer_code: z.string().optional().nullable(),
  zone_id: z.string().uuid().nullable().optional(),
  address: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  has_tax_id: z.boolean().optional(),
  tax_id: z.string().optional().nullable(),
  drug_license_number: z.string().optional(),
  location_image_url: z.string().optional().or(z.literal('')),
  drug_license_image_url: z.string().optional().or(z.literal('')),
  hospital_license_image_url: z.string().optional().or(z.literal('')),
})

export async function list(_req: Request, res: Response) {
  res.json({ data: await service.listAll() })
}

export async function get(req: Request, res: Response) {
  res.json({ data: await service.getById(req.params.id) })
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const body = customerSchema.parse(req.body)
  const data = await service.create(req.user!.id, body)
  res.status(201).json({ data })
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const body = customerSchema.partial().parse(req.body)
  const data = await service.update(req.user!.id, req.params.id, body)
  res.json({ data })
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  await service.remove(req.user!.id, req.params.id)
  res.json({ success: true })
}

export async function prices(req: Request, res: Response) {
  res.json({ data: await service.listPrices(req.params.id) })
}
