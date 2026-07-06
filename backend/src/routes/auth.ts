import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import * as controller from '../controllers/auth.controller'

const router = Router()

router.post('/login', asyncHandler(controller.login))
router.post('/logout', requireAuth, asyncHandler(controller.logout))
router.get('/me', requireAuth, controller.me)
router.post('/forgot-password', asyncHandler(controller.forgotPassword))
router.post('/reset-password', asyncHandler(controller.resetPassword))

export default router
