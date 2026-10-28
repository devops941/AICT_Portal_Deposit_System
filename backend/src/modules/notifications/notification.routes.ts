import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// All notification endpoints require authentication
router.use(authenticateToken);

// 1. Send / Dispatch notification
router.post('/send', (req, res, next) => notificationController.send(req, res, next));

// 2. Get user notifications
router.get('/', (req, res, next) => notificationController.list(req, res, next));

// 2. Mark specific notification as read
router.patch('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));

// 3. Mark all notifications as read
router.patch('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));

// 4. Retry failed notification dispatches
router.post('/retry', (req, res, next) => notificationController.retryFailed(req, res, next));

// 5. User Notification Preferences
router.get('/preferences', (req, res, next) => notificationController.getPreferences(req, res, next));
router.put('/preferences', (req, res, next) => notificationController.updatePreferences(req, res, next));

export default router;
