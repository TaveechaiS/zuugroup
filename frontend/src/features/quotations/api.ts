'use client'
import { api } from '@/lib/api/client'

export const quotationsApi = {
  list: (params?: { scope?: string; status?: string }) =>
    api.get('/quotations', params).then((r) => r.data),
  get: (id: string) => api.get(`/quotations/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/quotations', body).then((r) => r.data),
  update: (id: string, body: any) => api.patch(`/quotations/${id}`, body).then((r) => r.data),
  approve: (id: string) => api.post(`/quotations/${id}/approve`).then((r) => r),
  reject: (id: string, reason: string) => api.post(`/quotations/${id}/reject`, { reason }),
  updateMeta: (id: string, body: { quotation_number?: string; notes?: string }) =>
    api.patch(`/quotations/${id}/meta`, body).then((r) => r.data),
}
