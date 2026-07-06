import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import * as controller from '../controllers/dashboard.controller'

const router = Router()
router.use(requireAuth)

router.get('/admin', asyncHandler(controller.admin))
router.get('/manager', asyncHandler(controller.manager))
router.get('/cfo', asyncHandler(controller.cfo))

export default router
