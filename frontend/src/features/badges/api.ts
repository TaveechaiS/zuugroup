'use client'
import { api } from '@/lib/api/client'

export const badgesApi = {
  get: () => api.get('/badges').then((r) => r.data as Record<string, number>),
}
