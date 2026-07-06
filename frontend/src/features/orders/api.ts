'use client'
import { api } from '@/lib/api/client'

export const ordersApi = {
  list: (params?: { scope?: string; status?: string }) =>
    api.get('/orders', params).then((r) => r.data),
  get: (id: string) => api.get(`/orders/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/orders', body).then((r) => r.data),
  updateMeta: (id: string, body: { order_number?: string; notes?: string }) =>
    api.patch(`/orders/${id}`, body).then((r) => r.data),
  reviewPass: (id: string) => api.post(`/orders/${id}/review-pass`),
  reviewReject: (id: string, reason: string) => api.post(`/orders/${id}/review-reject`, { reason }),
  confirm: (id: string) => api.post(`/orders/${id}/confirm`),
  cancel: (id: string, reason: string) => api.post(`/orders/${id}/cancel`, { reason }),
}
