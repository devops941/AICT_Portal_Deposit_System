import { Router } from 'express';
import { requirementController } from './requirement.controller';
import { authenticateToken, authorizePermissions } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  createRequirementSchema,
  updateRequirementSchema,
  requirementIdParamSchema,
  pledgeInstrumentSchema,
  verifyInstrumentSchema,
  requirementQuerySchema,
} from './requirement.validation';

const router = Router();

// Protect all requirement endpoints with authentication
router.use(authenticateToken);

// 1. Dashboard Metrics
router.get(
  '/metrics',
  authorizePermissions('DEPOSITS:READ'),
  requirementController.getDashboardMetrics
);

// 2. Institution Compliance Overview
router.get(
  '/institution/:institutionId/compliance',
  authorizePermissions('DEPOSITS:READ'),
  requirementController.getInstitutionCompliance
);

// 3. List Requirements (with filtering, pagination & live shortfall)
router.get(
  '/',
  authorizePermissions('DEPOSITS:READ'),
  validateRequest(requirementQuerySchema),
  requirementController.getRequirements
);

// 4. Create Deposit Requirement
router.post(
  '/',
  authorizePermissions('DEPOSITS:CREATE'),
  validateRequest(createRequirementSchema),
  requirementController.createRequirement
);

// 5. Get Requirement Details
router.get(
  '/:id',
  authorizePermissions('DEPOSITS:READ'),
  validateRequest(requirementIdParamSchema),
  requirementController.getRequirementById
);

// 6. Update Requirement
router.patch(
  '/:id',
  authorizePermissions('DEPOSITS:UPDATE'),
  validateRequest(updateRequirementSchema),
  requirementController.updateRequirement
);

// 7. Get Live Financial Compliance Breakdown
router.get(
  '/:id/compliance',
  authorizePermissions('DEPOSITS:READ'),
  validateRequest(requirementIdParamSchema),
  requirementController.getCompliance
);

// 8. Pledge Instrument against Requirement
router.post(
  '/:id/pledge',
  authorizePermissions('DEPOSITS:SUBMIT'),
  validateRequest(pledgeInstrumentSchema),
  requirementController.pledgeInstrument
);

// 9. Verify / Reject Pledged Instrument (Official action)
router.patch(
  '/:id/instruments/:instrumentId/verify',
  authorizePermissions('DEPOSITS:VERIFY'),
  validateRequest(verifyInstrumentSchema),
  requirementController.verifyInstrument
);

export default router;
