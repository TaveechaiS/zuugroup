import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import * as controller from '../controllers/badges.controller'

const router = Router()
router.use(requireAuth)

router.get('/', asyncHandler(controller.get))

export default router
