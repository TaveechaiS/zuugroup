'use client'
import { api } from '@/lib/api/client'

export const dashboardApi = {
  admin: () => api.get('/dashboard/admin').then((r) => r.data),
  manager: () => api.get('/dashboard/manager').then((r) => r.data),
  cfo: () => api.get('/dashboard/cfo').then((r) => r.data),
}
