import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticateToken } from '../../middleware/auth.middleware';
import { loginRateLimiter } from '../../middleware/rateLimit.middleware';
import {
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validation';

const router = Router();

router.post('/login', loginRateLimiter, validateRequest(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);
router.post(
  '/change-password',
  authenticateToken,
  validateRequest(changePasswordSchema),
  authController.changePassword
);
router.get('/me', authenticateToken, authController.getMe);

export default router;
