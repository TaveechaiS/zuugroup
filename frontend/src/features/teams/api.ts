'use client'
import { api } from '@/lib/api/client'

export const teamsApi = {
  list: () => api.get('/teams').then((r) => r.data),
  my: () => api.get('/teams/my').then((r) => r.data),
  create: (body: any) => api.post('/teams', body).then((r) => r.data),
  update: (id: string, body: any) => api.patch(`/teams/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/teams/${id}`),
}
