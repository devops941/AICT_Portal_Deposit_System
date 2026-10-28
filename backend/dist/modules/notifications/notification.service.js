"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const Notification_model_1 = require("../../models/Notification.model");
const NotificationPreference_model_1 = require("../../models/NotificationPreference.model");
const appError_1 = require("../../utils/appError");
const logger_1 = require("../../config/logger");
const mailer_1 = require("../../config/mailer");
const env_1 = require("../../config/env");
class NotificationService {
    templates = {
        MATURITY_APPROACHING: (v) => ({
            title: `Upcoming Maturity Alert: FDR #${v.fdrNumber || v.instrumentId}`,
            message: `Deposit instrument #${v.fdrNumber} (₹${v.amount}) issued by ${v.bankName} is maturing on ${v.maturityDate}. Please initiate timely renewal.`,
        }),
        VERIFICATION_STATUS: (v) => ({
            title: `Verification Update: FDR #${v.fdrNumber}`,
            message: `Your deposit instrument #${v.fdrNumber} verification status is now ${v.status}. Remarks: ${v.remarks || 'Verification scrutiny completed.'}`,
        }),
        APPROVAL_REQUIRED: (v) => ({
            title: `Approval Required: ${v.workflowType || 'Release Request'} #${v.requestId}`,
            message: `A financial request for ₹${v.amount} requires your authorized review and decision.`,
        }),
        DISCREPANCY_FLAG: (v) => ({
            title: `Discrepancy Alert: Instrument #${v.fdrNumber}`,
            message: `AI scrutiny identified a potential ${v.discrepancyType} on your submitted FDR. Please review discrepancy details.`,
        }),
        RELEASE_DECISION: (v) => ({
            title: `Release Sanction: #${v.requestId}`,
            message: `Your deposit release request for ₹${v.amount} has been ${v.decision}. Remarks: ${v.remarks || 'Disbursement authorized.'}`,
        }),
    };
    async createNotification(params) {
        const { userId, userEmail, institutionId, type, templateId, templateVariables, channel = 'BOTH', actionUrl, metadata, simulateEmailFailure = false, } = params;
        let title = params.title;
        let message = params.message;
        if (templateId && this.templates[templateId] && templateVariables) {
            const rendered = this.templates[templateId](templateVariables);
            title = rendered.title;
            message = rendered.message;
        }
        const notificationId = `NOTIF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
        const prefs = await this.getPreferences(userId);
        let effectiveChannel = channel;
        if (!prefs.email && channel === 'BOTH')
            effectiveChannel = 'IN_APP';
        if (!prefs.inApp && channel === 'BOTH')
            effectiveChannel = 'EMAIL';
        let deliveryStatus = 'SENT';
        let errorMessage = undefined;
        if (effectiveChannel === 'EMAIL' || effectiveChannel === 'BOTH') {
            const targetEmail = userEmail || (userId.includes('@') ? userId : undefined);
            if (simulateEmailFailure) {
                deliveryStatus = 'FAILED';
                errorMessage = 'SMTP Gateway connection timeout (simulated delivery failure)';
                logger_1.logger.warn(`Simulated email delivery failure for notification ${notificationId}`);
            }
            else if (targetEmail && env_1.env.SMTP_USER && env_1.env.SMTP_PASS) {
                const emailSent = await (0, mailer_1.sendEmail)({
                    to: targetEmail,
                    subject: title,
                    text: message,
                    html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="margin-bottom: 20px; border-bottom: 2px solid #4f46e5; padding-bottom: 12px;">
                <span style="font-size: 16px; font-weight: bold; color: #1e1b4b;">AICTE Security Deposit Portal</span>
              </div>
              <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">${title}</h2>
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">${message}</p>
              ${actionUrl ? `<div style="margin: 24px 0;"><a href="${actionUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block;">View in Portal</a></div>` : ''}
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">This is an automated statutory notice from ${env_1.env.FROM_NAME} Escrow Management Engine. Please do not reply directly to this email.</p>
            </div>
          `,
                });
                if (!emailSent) {
                    deliveryStatus = 'FAILED';
                    errorMessage = 'SMTP dispatch failed. Check server logs.';
                }
            }
            else {
                logger_1.logger.info(`Email dispatch skipped (No valid recipient or SMTP not configured) for ${notificationId}`);
            }
        }
        const notification = await Notification_model_1.Notification.create({
            notificationId,
            userId,
            userEmail,
            institutionId: institutionId ? institutionId.toUpperCase() : undefined,
            type,
            title,
            message,
            templateId,
            templateVariables,
            channel: effectiveChannel,
            status: deliveryStatus,
            isRead: false,
            deliveryAttempts: 1,
            maxRetries: 3,
            lastAttemptAt: new Date(),
            errorMessage,
            actionUrl,
            metadata,
        });
        return notification;
    }
    async listNotifications(user, query) {
        const userId = user.id || user.userId;
        const filter = {
            $or: [
                { userId },
                ...(user.institutionId ? [{ institutionId: user.institutionId.toUpperCase() }] : []),
            ],
        };
        if (query.unreadOnly === 'true') {
            filter.isRead = false;
        }
        if (query.type) {
            filter.type = query.type.toUpperCase();
        }
        const page = Math.max(1, parseInt(query.page || '1', 10));
        const limit = Math.max(1, Math.min(100, parseInt(query.limit || '20', 10)));
        const skip = (page - 1) * limit;
        const [data, total, unreadCount] = await Promise.all([
            Notification_model_1.Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification_model_1.Notification.countDocuments(filter),
            Notification_model_1.Notification.countDocuments({
                $or: [
                    { userId },
                    ...(user.institutionId ? [{ institutionId: user.institutionId.toUpperCase() }] : []),
                ],
                isRead: false,
            }),
        ]);
        return {
            data: data,
            unreadCount,
            total,
            page,
            limit,
        };
    }
    async markAsRead(notificationId, user) {
        const userId = user.id || user.userId;
        const notif = await Notification_model_1.Notification.findOne({
            notificationId: notificationId.toUpperCase(),
            $or: [
                { userId },
                ...(user.institutionId ? [{ institutionId: user.institutionId.toUpperCase() }] : []),
                ...(user.userType === 'ADMIN' ? [{}] : []),
            ],
        });
        if (!notif) {
            throw appError_1.AppError.notFound(`Notification ${notificationId} not found`);
        }
        notif.isRead = true;
        notif.readAt = new Date();
        notif.status = 'READ';
        await notif.save();
        return notif;
    }
    async markAllAsRead(user) {
        const userId = user.id || user.userId;
        const result = await Notification_model_1.Notification.updateMany({
            $or: [
                { userId },
                ...(user.institutionId ? [{ institutionId: user.institutionId.toUpperCase() }] : []),
            ],
            isRead: false,
        }, {
            $set: {
                isRead: true,
                readAt: new Date(),
                status: 'READ',
            },
        });
        return { modifiedCount: result.modifiedCount };
    }
    async retryFailedNotifications() {
        const failedList = await Notification_model_1.Notification.find({
            status: 'FAILED',
            deliveryAttempts: { $lt: 3 },
        }).limit(50);
        let succeededCount = 0;
        for (const notif of failedList) {
            notif.deliveryAttempts += 1;
            notif.lastAttemptAt = new Date();
            try {
                notif.status = 'SENT';
                notif.errorMessage = undefined;
                await notif.save();
                succeededCount += 1;
                logger_1.logger.info(`Notification ${notif.notificationId} retry succeeded on attempt ${notif.deliveryAttempts}`);
            }
            catch (err) {
                notif.errorMessage = err.message;
                await notif.save();
            }
        }
        return {
            retriedCount: failedList.length,
            succeededCount,
        };
    }
    async getPreferences(userId) {
        let pref = await NotificationPreference_model_1.NotificationPreference.findOne({ userId });
        if (!pref) {
            pref = await NotificationPreference_model_1.NotificationPreference.create({
                userId,
                email: true,
                inApp: true,
                maturityAlerts: true,
                verificationAlerts: true,
                approvalAlerts: true,
                renewalAlerts: true,
                releaseAlerts: true,
                discrepancyAlerts: true,
                systemAlerts: true,
            });
        }
        return pref;
    }
    async updatePreferences(userId, updates) {
        let pref = await NotificationPreference_model_1.NotificationPreference.findOne({ userId });
        if (!pref) {
            pref = new NotificationPreference_model_1.NotificationPreference({ userId, ...updates });
        }
        else {
            Object.assign(pref, updates);
        }
        await pref.save();
        return pref;
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
