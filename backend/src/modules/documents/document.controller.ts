import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { documentService } from './document.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/appError';
import { cloudinary } from '../../config/cloudinary';

export class DocumentController {
  /**
   * POST /api/v1/documents/upload
   */
  uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw AppError.badRequest('No file provided in form-data field "file"');
    }

    const instrumentId = req.body.instrumentId || '';
    const documentType = req.body.documentType || 'FDR_RECEIPT';
    const institutionId = req.body.institutionId;

    const doc = await documentService.uploadDocument(
      req.file,
      instrumentId,
      documentType,
      req.user!,
      institutionId
    );

    return ApiResponse.success(res, doc, 'Document uploaded and validated successfully', 201);
  });

  /**
   * GET /api/v1/documents/:id
   */
  getDocumentMetadata = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const doc = await documentService.getDocumentById(req.params.id, institutionScope);
    return ApiResponse.success(res, doc, 'Document metadata retrieved successfully');
  });

  /**
   * GET /api/v1/documents/:id/download
   */
  downloadDocument = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const doc = await documentService.getDocumentById(req.params.id, institutionScope);

    try {
      const filePath = documentService.getStoredFilePath(doc);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', doc.mimeType);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(doc.originalFileName)}"`
        );
        res.setHeader('Content-Length', doc.fileSize);

        const stream = fs.createReadStream(filePath);
        return stream.pipe(res);
      }
    } catch {
      // Local file not on disk, check Cloudinary fallback
    }

    if (doc.cloudinaryPublicId) {
      const ext = path.extname(doc.originalFileName).replace('.', '') || 'pdf';
      const signedUrl = cloudinary.utils.private_download_url(
        doc.cloudinaryPublicId,
        ext,
        {
          resource_type: doc.mimeType.startsWith('image/') ? 'image' : 'raw',
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }
      );
      return res.redirect(signedUrl);
    }

    if (doc.cloudinaryUrl) {
      return res.redirect(doc.cloudinaryUrl);
    }

    throw AppError.notFound('Physical document file not found in storage');
  });

  /**
   * GET /api/v1/documents/:id/preview
   */
  previewDocument = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const doc = await documentService.getDocumentById(req.params.id, institutionScope);

    try {
      const filePath = documentService.getStoredFilePath(doc);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', doc.mimeType);
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${encodeURIComponent(doc.originalFileName)}"`
        );
        res.setHeader('Content-Length', doc.fileSize);

        const stream = fs.createReadStream(filePath);
        return stream.pipe(res);
      }
    } catch {
      // Local file not on disk, check Cloudinary fallback
    }

    if (doc.cloudinaryPublicId) {
      const ext = path.extname(doc.originalFileName).replace('.', '') || 'pdf';
      const signedUrl = cloudinary.utils.private_download_url(
        doc.cloudinaryPublicId,
        ext,
        {
          resource_type: doc.mimeType.startsWith('image/') ? 'image' : 'raw',
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }
      );
      return res.redirect(signedUrl);
    }

    if (doc.cloudinaryUrl) {
      return res.redirect(doc.cloudinaryUrl);
    }

    throw AppError.notFound('Physical document file not found in storage');
  });

  /**
   * GET /api/v1/documents/instrument/:instrumentId
   */
  getDocumentsForInstrument = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const docs = await documentService.getDocumentsForInstrument(
      req.params.instrumentId,
      institutionScope
    );
    return ApiResponse.success(res, docs, 'Instrument documents retrieved successfully');
  });
}

export const documentController = new DocumentController();
