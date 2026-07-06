'use client'
import { api } from '@/lib/api/client'

export const reportsApi = {
  admin: () => api.get('/reports/admin').then((r) => r.data),
  manager: () => api.get('/reports/manager').then((r) => r.data),
}

export const reportsAdminApi = (filters?: Record<string, any>) =>
  api.get('/reports/admin', filters).then((r) => r.data)
