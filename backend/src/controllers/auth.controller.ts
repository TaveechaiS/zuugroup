import { Request, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import * as service from '../services/auth.service'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

function meta(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] ?? null }
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body)
  const result = await service.login(email, password, meta(req))
  res.json(result)
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  await service.logout(req.user!.id, req.user!.jwt, req.user!.email, meta(req))
  res.json({ success: true })
}

export function me(req: AuthenticatedRequest, res: Response) {
  res.json({ user: req.user })
}

const updateMeSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  new_password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร').optional(),
})

export async function updateMe(req: AuthenticatedRequest, res: Response) {
  const body = updateMeSchema.parse(req.body)
  const data = await service.updateMe(req.user!.id, body, meta(req))
  res.json({ user: data })
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = z.object({ email: z.string().email() }).parse(req.body)
  const frontendUrl =
    process.env.FRONTEND_URL ||
    (req.headers.origin as string | undefined) ||
    'http://localhost:3000'
  await service.forgotPassword(email, frontendUrl)
  res.json({ success: true })
}

export async function resetPassword(req: Request, res: Response) {
  const { access_token, new_password } = z.object({
    access_token: z.string().min(10),
    new_password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  }).parse(req.body)
  await service.resetPassword(access_token, new_password, meta(req))
  res.json({ success: true })
}
