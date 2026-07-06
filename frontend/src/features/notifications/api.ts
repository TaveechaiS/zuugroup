'use client'
import { api } from '@/lib/api/client'

export const notificationsApi = {
  list: () => api.get('/notifications').then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
}
