import { env } from '../config/env';
import { logger } from '../config/logger';

export interface StorageService {
  uploadFile(file: Buffer, filename: string, mimeType: string): Promise<string>;
  downloadFile(fileKey: string): Promise<Buffer>;
  deleteFile(fileKey: string): Promise<boolean>;
}

export interface EmailService {
  sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean>;
}

export class LocalStorageService implements StorageService {
  async uploadFile(_file: Buffer, filename: string): Promise<string> {
    logger.info(`Mock uploading file: ${filename} to local bucket: ${env.DOCUMENT_STORAGE_BUCKET}`);
    return `uploads/${filename}`;
  }

  async downloadFile(fileKey: string): Promise<Buffer> {
    logger.info(`Mock downloading file: ${fileKey}`);
    return Buffer.from('');
  }

  async deleteFile(fileKey: string): Promise<boolean> {
    logger.info(`Mock deleting file: ${fileKey}`);
    return true;
  }
}

import { sendEmail as dispatchEmail } from '../config/mailer';

export class SmtpEmailService implements EmailService {
  async sendEmail(to: string, subject: string, htmlContent?: string): Promise<boolean> {
    return dispatchEmail({
      to,
      subject,
      html: htmlContent,
      text: subject,
    });
  }
}

export const storageService = new LocalStorageService();
export const emailService = new SmtpEmailService();
