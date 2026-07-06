import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import * as controller from '../controllers/quotations.controller'

const router = Router()
router.use(requireAuth)

router.get('/', asyncHandler(controller.list))
router.get('/:id', asyncHandler(controller.get))
router.post('/', requireRole('sales', 'manager'), asyncHandler(controller.create))
router.patch('/:id/meta', requireRole('admin'), asyncHandler(controller.updateMeta))
router.patch('/:id', requireRole('sales', 'manager', 'admin'), asyncHandler(controller.update))
router.post('/:id/approve', requireRole('manager', 'admin'), asyncHandler(controller.approve))
router.post('/:id/reject', requireRole('manager', 'admin'), asyncHandler(controller.reject))

export default router
