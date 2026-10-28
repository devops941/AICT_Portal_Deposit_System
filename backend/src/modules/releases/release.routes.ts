import { Router } from 'express';
import { releaseController } from './release.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  createReleaseSchema,
  reviewReleaseSchema,
  clarificationResponseSchema,
  approveReleaseSchema,
  rejectReleaseSchema,
  closeReleaseSchema,
} from './release.validation';

const router = Router();

router.use(authenticateToken);

router.get('/metrics', releaseController.getMetrics);
router.get('/eligibility/:instrumentId', releaseController.assessEligibility);
router.get('/', releaseController.list);
router.post('/', validateRequest(createReleaseSchema), releaseController.create);
router.get('/:id', releaseController.getById);
router.post('/:id/review', validateRequest(reviewReleaseSchema), releaseController.review);
router.post('/:id/clarification', validateRequest(clarificationResponseSchema), releaseController.respondClarification);
router.post('/:id/approve', validateRequest(approveReleaseSchema), releaseController.approve);
router.post('/:id/reject', validateRequest(rejectReleaseSchema), releaseController.reject);
router.post('/:id/authorize', releaseController.authorizeRelease);
router.post('/:id/close', validateRequest(closeReleaseSchema), releaseController.close);

export default router;
