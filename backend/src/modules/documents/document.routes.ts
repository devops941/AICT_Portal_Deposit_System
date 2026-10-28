import { Router } from 'express';
import multer from 'multer';
import { documentController } from './document.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Memory storage so file buffer is available for deep magic-number inspection
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
});

// All document endpoints require authentication
router.use(authenticateToken);

// 1. Upload & cryptographically validate document
router.post('/upload', upload.single('file'), documentController.uploadDocument);

// 2. Get document metadata
router.get('/:id', documentController.getDocumentMetadata);

// 3. Authorized document download stream
router.get('/:id/download', documentController.downloadDocument);

// 4. Authorized document inline preview stream
router.get('/:id/preview', documentController.previewDocument);

// 5. Get all documents for an instrument
router.get('/instrument/:instrumentId', documentController.getDocumentsForInstrument);

export default router;
