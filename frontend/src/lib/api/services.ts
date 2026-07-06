// Barrel — re-exports feature APIs so legacy imports keep working.
// New code should import directly from '@/features/<name>/api'.

export { customersApi } from '@/features/customers/api'
export { customerRequestsApi } from '@/features/customerRequests/api'
export { productsApi, stockLogsApi } from '@/features/products/api'
export { usersApi } from '@/features/users/api'
export { teamsApi } from '@/features/teams/api'
export { quotationsApi } from '@/features/quotations/api'
export { ordersApi } from '@/features/orders/api'
export { notificationsApi } from '@/features/notifications/api'
export { dashboardApi } from '@/features/dashboard/api'
export { reportsApi, reportsAdminApi } from '@/features/reports/api'
export { activityLogsApi } from '@/features/activityLogs/api'
export { badgesApi } from '@/features/badges/api'
export { zonesApi } from '@/features/zones/api'
