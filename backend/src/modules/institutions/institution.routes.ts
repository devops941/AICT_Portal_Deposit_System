import { Router } from 'express';
import { institutionController } from './institution.controller';
import {
  authenticateToken,
  authorizePermissions,
} from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  createInstitutionSchema,
  updateInstitutionSchema,
  updateStatusSchema,
  verifyInstitutionSchema,
  addDocumentSchema,
  institutionIdParamSchema,
} from './institution.validation';

const router = Router();

// Protect all institution routes with authentication
router.use(authenticateToken);

// 1. List Institutions
router.get(
  '/',
  authorizePermissions('INSTITUTIONS:READ'),
  institutionController.getInstitutions
);

// 2. Register / Create Institution
router.post(
  '/',
  authorizePermissions('INSTITUTIONS:CREATE'),
  validateRequest(createInstitutionSchema),
  institutionController.createInstitution
);

// 3. Get Institution Details
router.get(
  '/:id',
  authorizePermissions('INSTITUTIONS:READ'),
  validateRequest(institutionIdParamSchema),
  institutionController.getInstitutionById
);

// 4. Update Institution Profile
router.patch(
  '/:id',
  authorizePermissions('INSTITUTIONS:UPDATE'),
  validateRequest(updateInstitutionSchema),
  institutionController.updateInstitution
);

// 5. Update Status (Activate/Deactivate/Suspend)
router.patch(
  '/:id/status',
  authorizePermissions('INSTITUTIONS:UPDATE'),
  validateRequest(updateStatusSchema),
  institutionController.updateStatus
);

// 6. Verify Institution
router.patch(
  '/:id/verify',
  authorizePermissions('INSTITUTIONS:VERIFY'),
  validateRequest(verifyInstitutionSchema),
  institutionController.verifyInstitution
);

// 7. Add / Upload Document
router.post(
  '/:id/documents',
  authorizePermissions('INSTITUTIONS:UPDATE'),
  validateRequest(addDocumentSchema),
  institutionController.addDocument
);

// 8. Get Users belonging to this Institution
router.get(
  '/:id/users',
  authorizePermissions('USERS:READ'),
  validateRequest(institutionIdParamSchema),
  institutionController.getInstitutionUsers
);

export default router;
