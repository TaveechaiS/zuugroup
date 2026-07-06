import { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/customerRequests.service'

const requestSchema = z.object({
  company_name: z.string().min(1),
  address: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  drug_license_number: z.string().optional(),
  location_image_url: z.string().optional().or(z.literal('')),
  drug_license_image_url: z.string().optional().or(z.literal('')),
  hospital_license_image_url: z.string().optional().or(z.literal('')),
})

export async function list(_req: Request, res: Response) {
  res.json({ data: await service.listPending() })
}

export async function get(req: Request, res: Response) {
  res.json({ data: await service.getById(req.params.id) })
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const body = requestSchema.parse(req.body)
  const data = await service.create({ id: req.user!.id, email: req.user!.email }, body)
  res.status(201).json({ data })
}

export async function approve(req: AuthenticatedRequest, res: Response) {
  await service.approve(req.user!.id, req.params.id)
  res.json({ success: true })
}

export async function reject(req: AuthenticatedRequest, res: Response) {
  const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body)
  await service.reject(req.user!.id, req.params.id, reason)
  res.json({ success: true })
}
