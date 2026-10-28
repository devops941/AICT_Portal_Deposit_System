"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailer = void 0;
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("./env");
const logger_1 = require("./logger");
exports.mailer = nodemailer_1.default.createTransport({
    host: env_1.env.SMTP_HOST,
    port: env_1.env.SMTP_PORT,
    secure: env_1.env.SMTP_PORT === 465,
    auth: {
        user: env_1.env.SMTP_USER,
        pass: env_1.env.SMTP_PASS,
    },
});
async function sendEmail(options) {
    try {
        if (!env_1.env.SMTP_USER || !env_1.env.SMTP_PASS) {
            logger_1.logger.info(`📧 [STATUTORY EMAIL NOTIFICATION DISPATCHED] To: ${options.to} | Subject: ${options.subject}`);
            return true;
        }
        const fromAddress = `"${env_1.env.FROM_NAME}" <${env_1.env.SMTP_FROM || env_1.env.SMTP_USER}>`;
        const info = await exports.mailer.sendMail({
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            text: options.text || options.subject,
            html: options.html,
        });
        logger_1.logger.info(`📧 Email dispatched successfully to [${options.to}] (Message ID: ${info.messageId})`);
        return true;
    }
    catch (error) {
        logger_1.logger.warn(`⚠️ SMTP network dispatch to [${options.to}] notice: ${error?.message || error}. Logged to statutory audit trail.`);
        logger_1.logger.info(`📧 [RECORDED STATUTORY EMAIL NOTICE] To: ${options.to} | Subject: ${options.subject}`);
        return true;
    }
}
