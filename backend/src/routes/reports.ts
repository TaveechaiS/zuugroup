import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import * as controller from '../controllers/reports.controller'

const router = Router()
router.use(requireAuth)

router.get('/admin', requireRole('admin', 'cfo'), asyncHandler(controller.admin))
router.get('/manager', requireRole('manager'), asyncHandler(controller.manager))

export default router
