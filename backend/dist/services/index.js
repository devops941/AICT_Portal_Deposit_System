"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.storageService = exports.SmtpEmailService = exports.LocalStorageService = void 0;
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
class LocalStorageService {
    async uploadFile(_file, filename) {
        logger_1.logger.info(`Mock uploading file: ${filename} to local bucket: ${env_1.env.DOCUMENT_STORAGE_BUCKET}`);
        return `uploads/${filename}`;
    }
    async downloadFile(fileKey) {
        logger_1.logger.info(`Mock downloading file: ${fileKey}`);
        return Buffer.from('');
    }
    async deleteFile(fileKey) {
        logger_1.logger.info(`Mock deleting file: ${fileKey}`);
        return true;
    }
}
exports.LocalStorageService = LocalStorageService;
const mailer_1 = require("../config/mailer");
class SmtpEmailService {
    async sendEmail(to, subject, htmlContent) {
        return (0, mailer_1.sendEmail)({
            to,
            subject,
            html: htmlContent,
            text: subject,
        });
    }
}
exports.SmtpEmailService = SmtpEmailService;
exports.storageService = new LocalStorageService();
exports.emailService = new SmtpEmailService();
