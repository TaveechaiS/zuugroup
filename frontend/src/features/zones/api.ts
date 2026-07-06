'use client'
import { api } from '@/lib/api/client'

export const zonesApi = {
  list: () => api.get('/zones').then((r) => r.data as any[]),
  get: (id: string) => api.get(`/zones/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/zones', body).then((r) => r.data),
  update: (id: string, body: any) => api.patch(`/zones/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/zones/${id}`),
}
