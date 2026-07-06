import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import * as controller from '../controllers/users.controller'

const router = Router()
router.use(requireAuth)

router.get('/', requireRole('admin', 'cfo'), asyncHandler(controller.list))
router.get('/:id', requireRole('admin'), asyncHandler(controller.get))
router.post('/', requireRole('admin'), asyncHandler(controller.create))
router.patch('/:id', requireRole('admin'), asyncHandler(controller.update))
router.delete('/:id', requireRole('admin'), asyncHandler(controller.remove))

export default router
