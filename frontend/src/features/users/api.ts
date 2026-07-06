'use client'
import { api } from '@/lib/api/client'

export const usersApi = {
  list: () => api.get('/users').then((r) => r.data),
  get: (id: string) => api.get(`/users/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/users', body).then((r) => r.data),
  update: (id: string, body: any) => api.patch(`/users/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`),
}
