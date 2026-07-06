'use client'
import { api } from '@/lib/api/client'

export const activityLogsApi = {
  list: () => api.get('/activity-logs').then((r) => r.data),
}
