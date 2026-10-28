"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = exports.AiController = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ai_service_1 = require("./ai.service");
const Document_model_1 = require("../../models/Document.model");
const appError_1 = require("../../utils/appError");
class AiController {
    async extractOcr(req, res, next) {
        try {
            const user = req.user;
            const file = req.file;
            const { documentId, instrumentId, formValues } = req.body;
            let buffer = null;
            let mimeType = 'application/pdf';
            let fileName = 'uploaded_document.pdf';
            if (file && file.buffer) {
                buffer = file.buffer;
                mimeType = file.mimetype;
                fileName = file.originalname;
            }
            else if (documentId) {
                const doc = await Document_model_1.DocumentRecord.findOne({ documentId: documentId.toUpperCase() });
                if (!doc) {
                    throw appError_1.AppError.notFound(`Document with ID ${documentId} not found`);
                }
                if (user.institutionId && doc.institutionId && user.institutionId !== doc.institutionId) {
                    throw appError_1.AppError.forbidden('Access denied to access document from another institution');
                }
                const filePath = path_1.default.join(process.cwd(), 'storage', 'documents', doc.storageKey);
                if (!fs_1.default.existsSync(filePath)) {
                    throw appError_1.AppError.notFound('Underlying document file not found in storage');
                }
                buffer = fs_1.default.readFileSync(filePath);
                mimeType = doc.mimeType;
                fileName = doc.originalFileName;
            }
            else if (req.body.base64Content) {
                buffer = Buffer.from(req.body.base64Content, 'base64');
                mimeType = req.body.mimeType || 'application/pdf';
                fileName = req.body.fileName || 'base64_document.pdf';
            }
            if (!buffer) {
                throw appError_1.AppError.badRequest('Please upload a file or provide a valid documentId / base64Content');
            }
            let parsedFormValues = undefined;
            if (formValues) {
                try {
                    parsedFormValues = typeof formValues === 'string' ? JSON.parse(formValues) : formValues;
                }
                catch {
                    parsedFormValues = undefined;
                }
            }
            const extraction = await ai_service_1.aiService.extractDocumentIntelligence({
                buffer,
                mimeType,
                fileName,
                instrumentId,
                documentId,
                formValues: parsedFormValues,
                user,
            });
            res.status(200).json({
                success: true,
                data: extraction,
                message: 'Document intelligence extraction completed successfully',
            });
        }
        catch (err) {
            next(err);
        }
    }
    async classifyDocument(req, res, next) {
        try {
            const file = req.file;
            let buffer = null;
            let mimeType = 'application/pdf';
            let fileName = 'document.pdf';
            if (file && file.buffer) {
                buffer = file.buffer;
                mimeType = file.mimetype;
                fileName = file.originalname;
            }
            else if (req.body.text) {
                buffer = Buffer.from(req.body.text, 'utf-8');
                mimeType = 'text/plain';
                fileName = req.body.fileName || 'text.txt';
            }
            else if (req.body.base64Content) {
                buffer = Buffer.from(req.body.base64Content, 'base64');
                mimeType = req.body.mimeType || 'application/pdf';
                fileName = req.body.fileName || 'document.pdf';
            }
            if (!buffer) {
                throw appError_1.AppError.badRequest('File buffer or text required for classification');
            }
            const classification = await ai_service_1.aiService.classifyDocument(buffer, mimeType, fileName);
            res.status(200).json({
                success: true,
                data: classification,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async compareDocument(req, res, next) {
        try {
            const user = req.user;
            const { extractionId, instrumentId, formValues } = req.body;
            const result = await ai_service_1.aiService.compareDocument({
                extractionId,
                instrumentId,
                formValues,
                user,
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getExtraction(req, res, next) {
        try {
            const user = req.user;
            const { id } = req.params;
            const extraction = await ai_service_1.aiService.getExtractionById(id, user);
            res.status(200).json({
                success: true,
                data: extraction,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async manualCorrection(req, res, next) {
        try {
            const user = req.user;
            const { id } = req.params;
            const input = req.body;
            const updated = await ai_service_1.aiService.manualCorrection(id, input, user);
            res.status(200).json({
                success: true,
                data: updated,
                message: 'Manual correction saved and verification updated successfully',
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getRiskFlags(req, res, next) {
        try {
            const user = req.user;
            const flags = await ai_service_1.aiService.getRiskFlags(user);
            res.status(200).json({
                success: true,
                data: flags,
                total: flags.length,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async search(req, res, next) {
        try {
            const user = req.user;
            const { query } = req.body;
            const result = await ai_service_1.aiService.search(query, user);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AiController = AiController;
exports.aiController = new AiController();
