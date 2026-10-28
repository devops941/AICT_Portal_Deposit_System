import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { AuthUserContext } from '../../middleware/auth.middleware';

export class NotificationController {
  /**
   * POST /api/v1/notifications/send
   */
  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const notif = await notificationService.createNotification({
        ...req.body,
        userId: req.body.userId || user.id || (user as any).userId,
        userEmail: req.body.userEmail || user.email,
        institutionId: req.body.institutionId || user.institutionId,
      });

      res.status(201).json({
        success: true,
        data: notif,
        message: 'Notification created and dispatched successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/notifications
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const result = await notificationService.listNotifications(user, req.query);

      res.status(200).json({
        success: true,
        data: result.data,
        unreadCount: result.unreadCount,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const { id } = req.params;
      const updated = await notificationService.markAsRead(id, user);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Notification marked as read',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const result = await notificationService.markAllAsRead(user);

      res.status(200).json({
        success: true,
        message: `Marked ${result.modifiedCount} notifications as read`,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/notifications/retry
   */
  async retryFailed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationService.retryFailedNotifications();

      res.status(200).json({
        success: true,
        data: result,
        message: `Retried ${result.retriedCount} notifications (${result.succeededCount} succeeded)`,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/notifications/preferences
   */
  async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const userId = user.id || (user as any).userId;
      const prefs = await notificationService.getPreferences(userId);

      res.status(200).json({
        success: true,
        data: prefs,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/notifications/preferences
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const userId = user.id || (user as any).userId;
      const updated = await notificationService.updatePreferences(userId, req.body);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Notification preferences updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
