'use client'
import { api } from '@/lib/api/client'

export const customersApi = {
  list: () => api.get('/customers').then((r) => r.data),
  get: (id: string) => api.get(`/customers/${id}`).then((r) => r.data),
  prices: (id: string) => api.get(`/customers/${id}/prices`).then((r) => r.data),
  create: (body: any) => api.post('/customers', body).then((r) => r.data),
  update: (id: string, body: any) => api.patch(`/customers/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/customers/${id}`),
}
