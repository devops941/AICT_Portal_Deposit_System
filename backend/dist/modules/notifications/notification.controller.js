"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
class NotificationController {
    async send(req, res, next) {
        try {
            const user = req.user;
            const notif = await notification_service_1.notificationService.createNotification({
                ...req.body,
                userId: req.body.userId || user.id || user.userId,
                userEmail: req.body.userEmail || user.email,
                institutionId: req.body.institutionId || user.institutionId,
            });
            res.status(201).json({
                success: true,
                data: notif,
                message: 'Notification created and dispatched successfully',
            });
        }
        catch (err) {
            next(err);
        }
    }
    async list(req, res, next) {
        try {
            const user = req.user;
            const result = await notification_service_1.notificationService.listNotifications(user, req.query);
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
        }
        catch (err) {
            next(err);
        }
    }
    async markAsRead(req, res, next) {
        try {
            const user = req.user;
            const { id } = req.params;
            const updated = await notification_service_1.notificationService.markAsRead(id, user);
            res.status(200).json({
                success: true,
                data: updated,
                message: 'Notification marked as read',
            });
        }
        catch (err) {
            next(err);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            const user = req.user;
            const result = await notification_service_1.notificationService.markAllAsRead(user);
            res.status(200).json({
                success: true,
                message: `Marked ${result.modifiedCount} notifications as read`,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async retryFailed(req, res, next) {
        try {
            const result = await notification_service_1.notificationService.retryFailedNotifications();
            res.status(200).json({
                success: true,
                data: result,
                message: `Retried ${result.retriedCount} notifications (${result.succeededCount} succeeded)`,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getPreferences(req, res, next) {
        try {
            const user = req.user;
            const userId = user.id || user.userId;
            const prefs = await notification_service_1.notificationService.getPreferences(userId);
            res.status(200).json({
                success: true,
                data: prefs,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async updatePreferences(req, res, next) {
        try {
            const user = req.user;
            const userId = user.id || user.userId;
            const updated = await notification_service_1.notificationService.updatePreferences(userId, req.body);
            res.status(200).json({
                success: true,
                data: updated,
                message: 'Notification preferences updated successfully',
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
