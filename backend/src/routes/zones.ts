import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import * as controller from '../controllers/zones.controller'

const router = Router()
router.use(requireAuth)

router.get('/', asyncHandler(controller.list))
router.get('/:id', asyncHandler(controller.get))
router.post('/', requireRole('manager', 'admin'), asyncHandler(controller.create))
router.patch('/:id', requireRole('admin'), asyncHandler(controller.update))
router.delete('/:id', requireRole('admin'), asyncHandler(controller.remove))

export default router
