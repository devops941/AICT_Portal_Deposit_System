"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maturityMonitoringJob = exports.MaturityMonitoringJob = exports.CONFIGURABLE_REMINDER_INTERVALS = void 0;
const Fdr_model_1 = require("../../models/Fdr.model");
const MaturityAlert_model_1 = require("../../models/MaturityAlert.model");
const Renewal_model_1 = require("../../models/Renewal.model");
const logger_1 = require("../../config/logger");
const mailer_1 = require("../../config/mailer");
exports.CONFIGURABLE_REMINDER_INTERVALS = [90, 60, 30, 15, 7];
class MaturityMonitoringJob {
    async runDailyMaturityCheck() {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const result = {
            instrumentsScanned: 0,
            approachingMaturityDetected: 0,
            maturedTransitioned: 0,
            alertsCreated: 0,
            duplicatesSkipped: 0,
            timestamp: now.toISOString(),
        };
        const instruments = await Fdr_model_1.Fdr.find({
            lifecycleStatus: { $in: ['ACTIVE', 'MATURED'] },
        });
        result.instrumentsScanned = instruments.length;
        for (const fdr of instruments) {
            const maturityTime = new Date(fdr.maturityDate).getTime();
            const diffMs = maturityTime - now.getTime();
            const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (daysRemaining <= 0) {
                if (fdr.lifecycleStatus === 'ACTIVE') {
                    fdr.lifecycleStatus = 'MATURED';
                    result.maturedTransitioned++;
                    fdr.history.push({
                        action: 'INSTRUMENT_MATURED',
                        performedBy: 'Automated Maturity Job',
                        performedByEmail: 'system@aicte-india.org',
                        details: `Instrument #${fdr.fdrNumber} reached maturity on ${new Date(fdr.maturityDate).toLocaleDateString()}. Status transitioned to MATURED.`,
                        timestamp: now,
                    });
                }
                const activeRenewal = await Renewal_model_1.Renewal.findOne({
                    previousInstrumentId: fdr.fdrId,
                    status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
                });
                if (!activeRenewal) {
                    const overdueKey = `${fdr.fdrId}:OVERDUE:${todayStr}`;
                    const existingAlert = await MaturityAlert_model_1.MaturityAlert.findOne({ idempotencyKey: overdueKey });
                    if (!existingAlert) {
                        const year = now.getFullYear();
                        const suffix = Math.floor(10000 + Math.random() * 90000);
                        const targetEmail = fdr.createdBy && fdr.createdBy.includes('@') ? fdr.createdBy : 'devops@kaizeninfinities.com';
                        const alertMessage = `Instrument #${fdr.fdrNumber} (${fdr.bankName}) matured ${Math.abs(daysRemaining)} days ago with no active renewal request on record. Immediate statutory replacement required.`;
                        await MaturityAlert_model_1.MaturityAlert.create({
                            alertId: `ALT-${year}-${suffix}`,
                            instrumentId: fdr.fdrId,
                            institutionId: fdr.institutionId,
                            institutionName: fdr.institutionName,
                            requirementId: fdr.requirementId,
                            intervalDays: 0,
                            maturityDate: fdr.maturityDate,
                            daysRemaining,
                            severity: 'CRITICAL',
                            alertMessage,
                            isResolved: false,
                            isEscalated: Math.abs(daysRemaining) > 15,
                            sentToEmails: [targetEmail, 'admin@aicte-india.org'],
                            idempotencyKey: overdueKey,
                        });
                        await (0, mailer_1.sendEmail)({
                            to: targetEmail,
                            subject: `🚨 CRITICAL STATUTORY ALERT: Instrument #${fdr.fdrNumber} Matured - Replacement Required`,
                            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                  <div style="background-color: #be123c; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">AICTE Security Deposit Portal</h2>
                    <p style="margin: 5px 0 0; font-size: 14px;">Maturity & Statutory Compliance Notice</p>
                  </div>
                  <div style="padding: 24px; color: #1e293b;">
                    <h3 style="color: #be123c; margin-top: 0;">Critical Overdue Security Deposit Notice</h3>
                    <p>${alertMessage}</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                      <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Institution:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${fdr.institutionName} (${fdr.institutionId})</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Certificate Number:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${fdr.fdrNumber}</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Bank & Branch:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${fdr.bankName} (${fdr.bankBranch})</td></tr>
                      <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Maturity Date:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #be123c;">${new Date(fdr.maturityDate).toLocaleDateString()}</td></tr>
                    </table>
                    <p style="font-size: 13px; color: #64748b;">
                      Under AICTE Statutory Norms, expired joint accounts must be replaced by a renewed FDR or Bank Guarantee immediately.
                    </p>
                  </div>
                  <div style="background-color: #f8fafc; padding: 12px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                    All India Council for Technical Education • Security Deposit Bureau
                  </div>
                </div>
              `,
                            text: alertMessage,
                        });
                        result.alertsCreated++;
                    }
                    else {
                        result.duplicatesSkipped++;
                    }
                }
            }
            else {
                for (const interval of exports.CONFIGURABLE_REMINDER_INTERVALS) {
                    if (daysRemaining <= interval) {
                        result.approachingMaturityDetected++;
                        const maturityDateStr = new Date(fdr.maturityDate).toISOString().slice(0, 10);
                        const idempotencyKey = `${fdr.fdrId}:${interval}:${maturityDateStr}`;
                        const existingAlert = await MaturityAlert_model_1.MaturityAlert.findOne({ idempotencyKey });
                        if (!existingAlert) {
                            const year = now.getFullYear();
                            const suffix = Math.floor(10000 + Math.random() * 90000);
                            const severity = interval <= 7 ? 'CRITICAL' : interval <= 30 ? 'WARNING' : 'INFO';
                            const targetEmail = fdr.createdBy && fdr.createdBy.includes('@') ? fdr.createdBy : 'devops@kaizeninfinities.com';
                            const alertMessage = `Renewal Reminder: Instrument #${fdr.fdrNumber} at ${fdr.bankName} is maturing in ${daysRemaining} days (threshold: ${interval} days). Institution must submit replacement FDR.`;
                            await MaturityAlert_model_1.MaturityAlert.create({
                                alertId: `ALT-${year}-${suffix}`,
                                instrumentId: fdr.fdrId,
                                institutionId: fdr.institutionId,
                                institutionName: fdr.institutionName,
                                requirementId: fdr.requirementId,
                                intervalDays: interval,
                                maturityDate: fdr.maturityDate,
                                daysRemaining,
                                severity,
                                alertMessage,
                                isResolved: false,
                                isEscalated: interval <= 7,
                                sentToEmails: [targetEmail, 'officer@aicte-india.org'],
                                idempotencyKey,
                            });
                            await (0, mailer_1.sendEmail)({
                                to: targetEmail,
                                subject: `⚠️ AICTE Security Deposit Notice: #${fdr.fdrNumber} Maturing in ${daysRemaining} Days`,
                                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
                      <h2 style="margin: 0;">AICTE Security Deposit Portal</h2>
                      <p style="margin: 5px 0 0; font-size: 14px;">Automated Maturity Early-Warning Notice</p>
                    </div>
                    <div style="padding: 24px; color: #1e293b;">
                      <h3 style="color: #4f46e5; margin-top: 0;">Upcoming Maturity Warning (${daysRemaining} Days Remaining)</h3>
                      <p>${alertMessage}</p>
                      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                        <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Institution:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${fdr.institutionName} (${fdr.institutionId})</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Certificate Number:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${fdr.fdrNumber}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Bank & Branch:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${fdr.bankName} (${fdr.bankBranch})</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Maturity Date:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #d97706;">${new Date(fdr.maturityDate).toLocaleDateString()}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Reminder Threshold:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Within ${interval} Days</td></tr>
                      </table>
                      <p style="font-size: 13px; color: #64748b;">
                        Please initiate an FDR rollover or renewal request on the portal before the statutory expiration date.
                      </p>
                    </div>
                    <div style="background-color: #f8fafc; padding: 12px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                      All India Council for Technical Education • Security Deposit Bureau
                    </div>
                  </div>
                `,
                                text: alertMessage,
                            });
                            if (!fdr.sentMaturityReminders) {
                                fdr.sentMaturityReminders = [];
                            }
                            if (!fdr.sentMaturityReminders.includes(interval)) {
                                fdr.sentMaturityReminders.push(interval);
                            }
                            fdr.lastMaturityAlertSentAt = now;
                            result.alertsCreated++;
                        }
                        else {
                            result.duplicatesSkipped++;
                        }
                        break;
                    }
                }
            }
            await fdr.save();
        }
        logger_1.logger.info(`Daily Maturity Job complete: Scanned ${result.instrumentsScanned}, Matured ${result.maturedTransitioned}, Alerts created ${result.alertsCreated}, Duplicates skipped ${result.duplicatesSkipped}`);
        return result;
    }
}
exports.MaturityMonitoringJob = MaturityMonitoringJob;
exports.maturityMonitoringJob = new MaturityMonitoringJob();
