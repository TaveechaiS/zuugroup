'use client'
import { api } from '@/lib/api/client'

export const customerRequestsApi = {
  list: () => api.get('/customer-requests').then((r) => r.data),
  get: (id: string) => api.get(`/customer-requests/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/customer-requests', body).then((r) => r.data),
  approve: (id: string) => api.post(`/customer-requests/${id}/approve`),
  reject: (id: string, reason: string) => api.post(`/customer-requests/${id}/reject`, { reason }),
}
