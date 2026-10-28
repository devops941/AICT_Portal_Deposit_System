import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { aiService } from './ai.service';
import { DocumentRecord } from '../../models/Document.model';
import { AppError } from '../../utils/appError';
import { AuthUserContext } from '../../middleware/auth.middleware';

export class AiController {
  /**
   * POST /api/v1/ai/ocr/extract
   * Extract OCR text, classification, and statutory fields from file or document reference
   */
  async extractOcr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const file = req.file;
      const { documentId, instrumentId, formValues } = req.body;

      let buffer: Buffer | null = null;
      let mimeType = 'application/pdf';
      let fileName = 'uploaded_document.pdf';

      if (file && file.buffer) {
        buffer = file.buffer;
        mimeType = file.mimetype;
        fileName = file.originalname;
      } else if (documentId) {
        const doc = await DocumentRecord.findOne({ documentId: documentId.toUpperCase() });
        if (!doc) {
          throw AppError.notFound(`Document with ID ${documentId} not found`);
        }
        if (user.institutionId && doc.institutionId && user.institutionId !== doc.institutionId) {
          throw AppError.forbidden('Access denied to access document from another institution');
        }

        const filePath = path.join(process.cwd(), 'storage', 'documents', doc.storageKey);
        if (!fs.existsSync(filePath)) {
          throw AppError.notFound('Underlying document file not found in storage');
        }
        buffer = fs.readFileSync(filePath);
        mimeType = doc.mimeType;
        fileName = doc.originalFileName;
      } else if (req.body.base64Content) {
        buffer = Buffer.from(req.body.base64Content, 'base64');
        mimeType = req.body.mimeType || 'application/pdf';
        fileName = req.body.fileName || 'base64_document.pdf';
      }

      if (!buffer) {
        throw AppError.badRequest('Please upload a file or provide a valid documentId / base64Content');
      }

      let parsedFormValues = undefined;
      if (formValues) {
        try {
          parsedFormValues = typeof formValues === 'string' ? JSON.parse(formValues) : formValues;
        } catch {
          parsedFormValues = undefined;
        }
      }

      const extraction = await aiService.extractDocumentIntelligence({
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
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/ai/documents/classify
   */
  async classifyDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      let buffer: Buffer | null = null;
      let mimeType = 'application/pdf';
      let fileName = 'document.pdf';

      if (file && file.buffer) {
        buffer = file.buffer;
        mimeType = file.mimetype;
        fileName = file.originalname;
      } else if (req.body.text) {
        buffer = Buffer.from(req.body.text, 'utf-8');
        mimeType = 'text/plain';
        fileName = req.body.fileName || 'text.txt';
      } else if (req.body.base64Content) {
        buffer = Buffer.from(req.body.base64Content, 'base64');
        mimeType = req.body.mimeType || 'application/pdf';
        fileName = req.body.fileName || 'document.pdf';
      }

      if (!buffer) {
        throw AppError.badRequest('File buffer or text required for classification');
      }

      const classification = await aiService.classifyDocument(buffer, mimeType, fileName);

      res.status(200).json({
        success: true,
        data: classification,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/ai/documents/compare
   */
  async compareDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const { extractionId, instrumentId, formValues } = req.body;

      const result = await aiService.compareDocument({
        extractionId,
        instrumentId,
        formValues,
        user,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/ai/extractions/:id
   */
  async getExtraction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const { id } = req.params;

      const extraction = await aiService.getExtractionById(id, user);

      res.status(200).json({
        success: true,
        data: extraction,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/ai/extractions/:id/correct
   */
  async manualCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const { id } = req.params;
      const input = req.body;

      const updated = await aiService.manualCorrection(id, input, user);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Manual correction saved and verification updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/ai/risk-flags
   */
  async getRiskFlags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const flags = await aiService.getRiskFlags(user);

      res.status(200).json({
        success: true,
        data: flags,
        total: flags.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/ai/search
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const { query } = req.body;

      const result = await aiService.search(query, user);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AiController();
