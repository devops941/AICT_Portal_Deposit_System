import { Router } from 'express';
import { fdrController } from './fdr.controller';
import { authenticateToken, authorizePermissions } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  createFdrSchema,
  updateFdrSchema,
  fdrIdParamSchema,
  fdrQuerySchema,
} from './fdr.validation';

const router = Router();

// Protect all FDR endpoints with authentication
router.use(authenticateToken);

// 1. Dashboard Metrics
router.get('/metrics', authorizePermissions('FDR:READ'), fdrController.getDashboardMetrics);

// 2. List FDRs (with search, filters & pagination)
router.get(
  '/',
  authorizePermissions('FDR:READ'),
  validateRequest(fdrQuerySchema),
  fdrController.getFdrs
);

// 3. Register New FDR (Save as Draft or Submit)
router.post(
  '/',
  authorizePermissions('FDR:CREATE'),
  validateRequest(createFdrSchema),
  fdrController.createFdr
);

// 4. Get FDR Details
router.get(
  '/:id',
  authorizePermissions('FDR:READ'),
  validateRequest(fdrIdParamSchema),
  fdrController.getFdrById
);

// 5. Update FDR (Draft editing)
router.patch(
  '/:id',
  authorizePermissions('FDR:UPDATE'),
  validateRequest(updateFdrSchema),
  fdrController.updateFdr
);

// 6. Submit Draft FDR for Official Verification
router.post(
  '/:id/submit',
  authorizePermissions('FDR:SUBMIT'),
  validateRequest(fdrIdParamSchema),
  fdrController.submitFdr
);

// 7. View FDR Activity & Audit History
router.get(
  '/:id/history',
  authorizePermissions('FDR:READ'),
  validateRequest(fdrIdParamSchema),
  fdrController.getFdrHistory
);

export default router;
