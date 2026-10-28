"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentController = exports.DocumentController = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const document_service_1 = require("./document.service");
const apiResponse_1 = require("../../utils/apiResponse");
const asyncHandler_1 = require("../../utils/asyncHandler");
const appError_1 = require("../../utils/appError");
const cloudinary_1 = require("../../config/cloudinary");
class DocumentController {
    uploadDocument = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file) {
            throw appError_1.AppError.badRequest('No file provided in form-data field "file"');
        }
        const instrumentId = req.body.instrumentId || '';
        const documentType = req.body.documentType || 'FDR_RECEIPT';
        const institutionId = req.body.institutionId;
        const doc = await document_service_1.documentService.uploadDocument(req.file, instrumentId, documentType, req.user, institutionId);
        return apiResponse_1.ApiResponse.success(res, doc, 'Document uploaded and validated successfully', 201);
    });
    getDocumentMetadata = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const doc = await document_service_1.documentService.getDocumentById(req.params.id, institutionScope);
        return apiResponse_1.ApiResponse.success(res, doc, 'Document metadata retrieved successfully');
    });
    downloadDocument = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const doc = await document_service_1.documentService.getDocumentById(req.params.id, institutionScope);
        try {
            const filePath = document_service_1.documentService.getStoredFilePath(doc);
            if (fs_1.default.existsSync(filePath)) {
                res.setHeader('Content-Type', doc.mimeType);
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.originalFileName)}"`);
                res.setHeader('Content-Length', doc.fileSize);
                const stream = fs_1.default.createReadStream(filePath);
                return stream.pipe(res);
            }
        }
        catch {
        }
        if (doc.cloudinaryPublicId) {
            const ext = path_1.default.extname(doc.originalFileName).replace('.', '') || 'pdf';
            const signedUrl = cloudinary_1.cloudinary.utils.private_download_url(doc.cloudinaryPublicId, ext, {
                resource_type: doc.mimeType.startsWith('image/') ? 'image' : 'raw',
                type: 'upload',
                expires_at: Math.floor(Date.now() / 1000) + 3600,
            });
            return res.redirect(signedUrl);
        }
        if (doc.cloudinaryUrl) {
            return res.redirect(doc.cloudinaryUrl);
        }
        throw appError_1.AppError.notFound('Physical document file not found in storage');
    });
    previewDocument = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const doc = await document_service_1.documentService.getDocumentById(req.params.id, institutionScope);
        try {
            const filePath = document_service_1.documentService.getStoredFilePath(doc);
            if (fs_1.default.existsSync(filePath)) {
                res.setHeader('Content-Type', doc.mimeType);
                res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.originalFileName)}"`);
                res.setHeader('Content-Length', doc.fileSize);
                const stream = fs_1.default.createReadStream(filePath);
                return stream.pipe(res);
            }
        }
        catch {
        }
        if (doc.cloudinaryPublicId) {
            const ext = path_1.default.extname(doc.originalFileName).replace('.', '') || 'pdf';
            const signedUrl = cloudinary_1.cloudinary.utils.private_download_url(doc.cloudinaryPublicId, ext, {
                resource_type: doc.mimeType.startsWith('image/') ? 'image' : 'raw',
                type: 'upload',
                expires_at: Math.floor(Date.now() / 1000) + 3600,
            });
            return res.redirect(signedUrl);
        }
        if (doc.cloudinaryUrl) {
            return res.redirect(doc.cloudinaryUrl);
        }
        throw appError_1.AppError.notFound('Physical document file not found in storage');
    });
    getDocumentsForInstrument = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const docs = await document_service_1.documentService.getDocumentsForInstrument(req.params.instrumentId, institutionScope);
        return apiResponse_1.ApiResponse.success(res, docs, 'Instrument documents retrieved successfully');
    });
}
exports.DocumentController = DocumentController;
exports.documentController = new DocumentController();
