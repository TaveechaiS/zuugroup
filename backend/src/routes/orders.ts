import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import * as controller from '../controllers/orders.controller'

const router = Router()
router.use(requireAuth)

router.get('/', asyncHandler(controller.list))
router.get('/:id', asyncHandler(controller.get))
router.post('/', requireRole('sales', 'manager'), asyncHandler(controller.create))
router.post('/:id/review-pass', requireRole('manager', 'admin'), asyncHandler(controller.reviewPass))
router.post('/:id/review-reject', requireRole('manager', 'admin'), asyncHandler(controller.reviewReject))
router.patch('/:id', requireRole('admin'), asyncHandler(controller.updateMeta))
router.post('/:id/confirm', requireRole('admin'), asyncHandler(controller.confirm))
router.post('/:id/cancel', requireRole('admin'), asyncHandler(controller.cancel))

export default router
