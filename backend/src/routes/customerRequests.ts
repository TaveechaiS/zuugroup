import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import * as controller from '../controllers/customerRequests.controller'

const router = Router()
router.use(requireAuth)

router.get('/', requireRole('admin'), asyncHandler(controller.list))
router.get('/:id', requireRole('admin'), asyncHandler(controller.get))
router.post('/', requireRole('sales', 'manager'), asyncHandler(controller.create))
router.post('/:id/approve', requireRole('admin'), asyncHandler(controller.approve))
router.post('/:id/reject', requireRole('admin'), asyncHandler(controller.reject))

export default router
