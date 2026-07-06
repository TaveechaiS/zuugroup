import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import * as controller from '../controllers/activityLogs.controller'

const router = Router()
router.use(requireAuth, requireRole('admin'))

router.get('/', asyncHandler(controller.list))

export default router
