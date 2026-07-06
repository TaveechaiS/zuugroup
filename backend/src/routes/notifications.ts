import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import * as controller from '../controllers/notifications.controller'

const router = Router()
router.use(requireAuth)

router.get('/', asyncHandler(controller.list))
router.patch('/mark-all-read', asyncHandler(controller.markAllRead))
router.patch('/:id/read', asyncHandler(controller.markRead))

export default router
