'use client'
import { api } from '@/lib/api/client'

export const productsApi = {
  list: () => api.get('/products').then((r) => r.data),
  categories: () => api.get('/products/categories').then((r) => r.data),
  get: (id: string) => api.get(`/products/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/products', body).then((r) => r.data),
  update: (id: string, body: any) => api.patch(`/products/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/products/${id}`),
}

export const stockLogsApi = {
  forProduct: (productId: string) =>
    api.get(`/products/${productId}/stock-logs`).then((r) => r.data as any[]),
}
