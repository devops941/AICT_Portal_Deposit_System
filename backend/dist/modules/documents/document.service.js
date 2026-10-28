"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentService = exports.DocumentService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const Document_model_1 = require("../../models/Document.model");
const Fdr_model_1 = require("../../models/Fdr.model");
const fileValidation_1 = require("../../utils/fileValidation");
const appError_1 = require("../../utils/appError");
const cloudinary_1 = require("../../config/cloudinary");
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
const STORAGE_DIR = process.env.VERCEL
    ? path_1.default.join('/tmp', 'storage', 'documents')
    : path_1.default.join(process.cwd(), 'storage', 'documents');
try {
    if (!fs_1.default.existsSync(STORAGE_DIR)) {
        fs_1.default.mkdirSync(STORAGE_DIR, { recursive: true });
    }
}
catch (dirErr) {
    logger_1.logger.warn('Storage directory initialization bypassed (read-only filesystem)');
}
const uploadToCloudinary = (buffer, publicId, extension, mimeType) => {
    const isImage = mimeType.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';
    const fullPublicId = isImage ? publicId : `${publicId}.${extension}`;
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.cloudinary.uploader.upload_stream({
            folder: 'aicte_security_deposit/documents',
            public_id: fullPublicId,
            resource_type: resourceType,
        }, (error, result) => {
            if (error || !result) {
                reject(error || new Error('Cloudinary upload returned empty result'));
            }
            else {
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        });
        stream.end(buffer);
    });
};
class DocumentService {
    async uploadDocument(file, instrumentId, documentType, user, targetInstitutionId) {
        if (!file || !file.buffer) {
            throw appError_1.AppError.badRequest('No file uploaded or file buffer is empty');
        }
        const validation = (0, fileValidation_1.validateFileContent)(file.buffer);
        if (!validation.isValid) {
            throw appError_1.AppError.badRequest(validation.error || 'Invalid file format');
        }
        const MAX_SIZE = 15 * 1024 * 1024;
        if (file.buffer.length > MAX_SIZE) {
            throw appError_1.AppError.badRequest('File size exceeds 15 MB limit');
        }
        let resolvedInstitutionId = targetInstitutionId || user.institutionId || '';
        if (instrumentId) {
            const fdr = await Fdr_model_1.Fdr.findOne({
                $or: [
                    { fdrId: instrumentId.toUpperCase() },
                    ...(mongoose_1.default.Types.ObjectId.isValid(instrumentId) ? [{ _id: instrumentId }] : []),
                ],
            });
            if (fdr) {
                resolvedInstitutionId = fdr.institutionId;
                if (user.institutionId && user.institutionId !== fdr.institutionId) {
                    throw appError_1.AppError.forbidden('Access denied to upload documents for an FDR of another institution');
                }
            }
        }
        if (!resolvedInstitutionId) {
            resolvedInstitutionId = 'AICTE-CENTRAL';
        }
        const year = new Date().getFullYear();
        const randomSuffix = Math.floor(10000 + Math.random() * 90000);
        const documentId = `DOC-${year}-${randomSuffix}`;
        const storageKey = `${documentId}_${Date.now()}.${validation.detectedExtension}`;
        const destinationPath = path_1.default.join(STORAGE_DIR, storageKey);
        try {
            if (!fs_1.default.existsSync(STORAGE_DIR)) {
                fs_1.default.mkdirSync(STORAGE_DIR, { recursive: true });
            }
            fs_1.default.writeFileSync(destinationPath, file.buffer);
        }
        catch (writeErr) {
            logger_1.logger.warn('Could not write document to local disk (serverless ephemeral environment):', writeErr);
        }
        let cloudinaryResult = null;
        if (env_1.env.CLOUDINARY_CLOUD_NAME && env_1.env.CLOUDINARY_API_KEY && env_1.env.CLOUDINARY_API_SECRET) {
            try {
                cloudinaryResult = await uploadToCloudinary(file.buffer, documentId, validation.detectedExtension || 'pdf', validation.detectedMimeType || file.mimetype);
                logger_1.logger.info(`Successfully stored document on Cloudinary CDN: [${cloudinaryResult.secure_url}]`);
            }
            catch (cloudErr) {
                logger_1.logger.error('Failed to upload document to Cloudinary (local file saved):', cloudErr);
            }
        }
        const doc = await Document_model_1.DocumentRecord.create({
            documentId,
            instrumentId: instrumentId ? instrumentId.toUpperCase() : 'GENERAL',
            institutionId: resolvedInstitutionId,
            documentType: documentType || 'FDR_RECEIPT',
            originalFileName: file.originalname,
            storageKey,
            cloudinaryUrl: cloudinaryResult?.secure_url,
            cloudinaryPublicId: cloudinaryResult?.public_id,
            mimeType: validation.detectedMimeType,
            fileSize: file.buffer.length,
            fileHash: validation.fileHash,
            uploadedBy: user.fullName || user.email,
            uploadedByEmail: user.email,
            uploadedAt: new Date(),
            verificationStatus: 'PENDING',
        });
        if (instrumentId) {
            await Fdr_model_1.Fdr.findOneAndUpdate({
                $or: [
                    { fdrId: instrumentId.toUpperCase() },
                    ...(mongoose_1.default.Types.ObjectId.isValid(instrumentId) ? [{ _id: instrumentId }] : []),
                ],
            }, {
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
            });
        }
        return doc;
    }
    async getDocumentById(documentId, institutionScope) {
        const doc = await Document_model_1.DocumentRecord.findOne({
            $or: [
                { documentId: documentId.toUpperCase() },
                ...(mongoose_1.default.Types.ObjectId.isValid(documentId) ? [{ _id: documentId }] : []),
            ],
        });
        if (!doc) {
            throw appError_1.AppError.notFound(`Document '${documentId}' not found`);
        }
        if (institutionScope && doc.institutionId !== institutionScope && doc.institutionId !== 'AICTE-CENTRAL') {
            throw appError_1.AppError.forbidden('Access denied to access document belonging to another institution');
        }
        return doc;
    }
    getStoredFilePath(doc) {
        const filePath = path_1.default.join(STORAGE_DIR, doc.storageKey);
        if (!fs_1.default.existsSync(filePath)) {
            throw appError_1.AppError.notFound('Physical document file not found in private storage');
        }
        return filePath;
    }
    async getDocumentsForInstrument(instrumentId, institutionScope) {
        const query = { instrumentId: instrumentId.toUpperCase() };
        if (institutionScope) {
            query.institutionId = institutionScope;
        }
        return Document_model_1.DocumentRecord.find(query).sort({ uploadedAt: -1 });
    }
    async verifyDocument(documentId, verificationStatus, user, remarks) {
        const doc = await Document_model_1.DocumentRecord.findOne({
            $or: [
                { documentId: documentId.toUpperCase() },
                ...(mongoose_1.default.Types.ObjectId.isValid(documentId) ? [{ _id: documentId }] : []),
            ],
        });
        if (!doc) {
            throw appError_1.AppError.notFound(`Document '${documentId}' not found`);
        }
        doc.verificationStatus = verificationStatus;
        if (remarks)
            doc.remarks = remarks;
        await doc.save();
        return doc;
    }
}
exports.DocumentService = DocumentService;
exports.documentService = new DocumentService();
