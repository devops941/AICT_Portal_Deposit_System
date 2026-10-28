import { Router } from 'express';
import multer from 'multer';
import { aiController } from './ai.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  aiSearchSchema,
  aiCompareSchema,
  aiManualCorrectionSchema,
} from './ai.validation';

const router = Router();

// Memory storage for OCR inspection
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
});

// All AI endpoints require authentication
router.use(authenticateToken);

// 1. OCR Extraction (file upload or documentId / base64)
router.post('/ocr/extract', upload.single('file'), aiController.extractOcr);

// 2. Document Classification
router.post('/documents/classify', upload.single('file'), aiController.classifyDocument);

// 3. Form and OCR Comparison
router.post('/documents/compare', validateRequest(aiCompareSchema), aiController.compareDocument);

// 4. Extraction Details & History
router.get('/extractions/:id', aiController.getExtraction);

// 5. Manual Officer Field Correction & Confirmation
router.post(
  '/extractions/:id/correct',
  validateRequest(aiManualCorrectionSchema),
  aiController.manualCorrection
);

// 6. Duplicate & Discrepancy Risk Flags
router.get('/risk-flags', aiController.getRiskFlags);

// 7. Natural-Language AI Search
router.post('/search', validateRequest(aiSearchSchema), aiController.search);

export default router;
