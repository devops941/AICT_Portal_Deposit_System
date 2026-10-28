import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { DocumentRecord, IDocumentRecord, DocumentType, DocumentVerificationStatus } from '../../models/Document.model';
import { Fdr } from '../../models/Fdr.model';
import { validateFileContent } from '../../utils/fileValidation';
import { AppError } from '../../utils/appError';
import { AuthUserContext } from '../../middleware/auth.middleware';
import { cloudinary } from '../../config/cloudinary';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

const STORAGE_DIR = process.env.VERCEL
  ? path.join('/tmp', 'storage', 'documents')
  : path.join(process.cwd(), 'storage', 'documents');

// Ensure secure private storage directory exists
try {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
} catch (dirErr) {
  logger.warn('Storage directory initialization bypassed (read-only filesystem)');
}

const uploadToCloudinary = (
  buffer: Buffer,
  publicId: string,
  extension: string,
  mimeType: string
): Promise<{ secure_url: string; public_id: string }> => {
  const isImage = mimeType.startsWith('image/');
  const resourceType = isImage ? 'image' : 'raw';
  const fullPublicId = isImage ? publicId : `${publicId}.${extension}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'aicte_security_deposit/documents',
        public_id: fullPublicId,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload returned empty result'));
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    );
    stream.end(buffer);
  });
};

export class DocumentService {
  /**
   * Upload and cryptographically validate a document
   */
  async uploadDocument(
    file: Express.Multer.File,
    instrumentId: string,
    documentType: DocumentType,
    user: AuthUserContext,
    targetInstitutionId?: string
  ): Promise<IDocumentRecord> {
    if (!file || !file.buffer) {
      throw AppError.badRequest('No file uploaded or file buffer is empty');
    }

    // 1. Deep Magic-Number Validation on Raw Binary Content
    const validation = validateFileContent(file.buffer);
    if (!validation.isValid) {
      throw AppError.badRequest(validation.error || 'Invalid file format');
    }

    // 2. Check File Size Limit (15 MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.buffer.length > MAX_SIZE) {
      throw AppError.badRequest('File size exceeds 15 MB limit');
    }

    // 3. Resolve Target Institution & Enforce Tenant Access
    let resolvedInstitutionId = targetInstitutionId || user.institutionId || '';

    // If instrumentId corresponds to an existing FDR, verify ownership
    if (instrumentId) {
      const fdr = await Fdr.findOne({
        $or: [
          { fdrId: instrumentId.toUpperCase() },
          ...(mongoose.Types.ObjectId.isValid(instrumentId) ? [{ _id: instrumentId }] : []),
        ],
      });
      if (fdr) {
        resolvedInstitutionId = fdr.institutionId;
        if (user.institutionId && user.institutionId !== fdr.institutionId) {
          throw AppError.forbidden('Access denied to upload documents for an FDR of another institution');
        }
      }
    }

    if (!resolvedInstitutionId) {
      resolvedInstitutionId = 'AICTE-CENTRAL';
    }

    // 4. Generate Unique Secure Storage Key (Never expose actual original filename directly on filesystem)
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const documentId = `DOC-${year}-${randomSuffix}`;
    const storageKey = `${documentId}_${Date.now()}.${validation.detectedExtension}`;
    const destinationPath = path.join(STORAGE_DIR, storageKey);

    // 5. Write File to Private Local Storage (if filesystem allows)
    try {
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }
      fs.writeFileSync(destinationPath, file.buffer);
    } catch (writeErr) {
      logger.warn('Could not write document to local disk (serverless ephemeral environment):', writeErr);
    }

    // 5b. Upload to Cloudinary if credentials configured
    let cloudinaryResult: { secure_url: string; public_id: string } | null = null;
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      try {
        cloudinaryResult = await uploadToCloudinary(
          file.buffer,
          documentId,
          validation.detectedExtension || 'pdf',
          validation.detectedMimeType || file.mimetype
        );
        logger.info(`Successfully stored document on Cloudinary CDN: [${cloudinaryResult.secure_url}]`);
      } catch (cloudErr) {
        logger.error('Failed to upload document to Cloudinary (local file saved):', cloudErr);
      }
    }

    // 6. Create Document Record in DB
    const doc = await DocumentRecord.create({
      documentId,
      instrumentId: instrumentId ? instrumentId.toUpperCase() : 'GENERAL',
      institutionId: resolvedInstitutionId,
      documentType: documentType || 'FDR_RECEIPT',
      originalFileName: file.originalname,
      storageKey,
      cloudinaryUrl: cloudinaryResult?.secure_url,
      cloudinaryPublicId: cloudinaryResult?.public_id,
      mimeType: validation.detectedMimeType!,
      fileSize: file.buffer.length,
      fileHash: validation.fileHash,
      uploadedBy: user.fullName || user.email,
      uploadedByEmail: user.email,
      uploadedAt: new Date(),
      verificationStatus: 'PENDING',
    });

    // 7. If instrumentId is an FDR, link document to FDR record
    if (instrumentId) {
      await Fdr.findOneAndUpdate(
        {
          $or: [
            { fdrId: instrumentId.toUpperCase() },
            ...(mongoose.Types.ObjectId.isValid(instrumentId) ? [{ _id: instrumentId }] : []),
          ],
        },
        {
          $addToSet: { documentReferences: documentId },
          $push: {
            history: {
              action: 'DOCUMENT_UPLOADED',
              performedBy: user.fullName || user.email,
              performedByEmail: user.email,
              details: `Uploaded ${documentType} '${file.originalname}' (${(file.buffer.length / 1024).toFixed(1)} KB)`,
              timestamp: new Date(),
            },
          },
        }
      );
    }

    return doc;
  }

  /**
   * Retrieve document metadata with strict tenant authorization
   */
  async getDocumentById(documentId: string, institutionScope?: string): Promise<IDocumentRecord> {
    const doc = await DocumentRecord.findOne({
      $or: [
        { documentId: documentId.toUpperCase() },
        ...(mongoose.Types.ObjectId.isValid(documentId) ? [{ _id: documentId }] : []),
      ],
    });

    if (!doc) {
      throw AppError.notFound(`Document '${documentId}' not found`);
    }

    if (institutionScope && doc.institutionId !== institutionScope && doc.institutionId !== 'AICTE-CENTRAL') {
      throw AppError.forbidden('Access denied to access document belonging to another institution');
    }

    return doc;
  }

  /**
   * Get physical file path on disk for secure streaming
   */
  getStoredFilePath(doc: IDocumentRecord): string {
    const filePath = path.join(STORAGE_DIR, doc.storageKey);
    if (!fs.existsSync(filePath)) {
      throw AppError.notFound('Physical document file not found in private storage');
    }
    return filePath;
  }

  /**
   * List documents for an instrument or institution
   */
  async getDocumentsForInstrument(instrumentId: string, institutionScope?: string): Promise<IDocumentRecord[]> {
    const query: any = { instrumentId: instrumentId.toUpperCase() };
    if (institutionScope) {
      query.institutionId = institutionScope;
    }
    return DocumentRecord.find(query).sort({ uploadedAt: -1 });
  }

  /**
   * Update document verification status
   */
  async verifyDocument(
    documentId: string,
    verificationStatus: DocumentVerificationStatus,
    user: AuthUserContext,
    remarks?: string
  ): Promise<IDocumentRecord> {
    const doc = await DocumentRecord.findOne({
      $or: [
        { documentId: documentId.toUpperCase() },
        ...(mongoose.Types.ObjectId.isValid(documentId) ? [{ _id: documentId }] : []),
      ],
    });

    if (!doc) {
      throw AppError.notFound(`Document '${documentId}' not found`);
    }

    doc.verificationStatus = verificationStatus;
    if (remarks) doc.remarks = remarks;
    await doc.save();

    return doc;
  }
}

export const documentService = new DocumentService();
