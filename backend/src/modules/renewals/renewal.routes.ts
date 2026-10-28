import { Router } from 'express';
import { renewalController } from './renewal.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  createRenewalSchema,
  submitRenewalSchema,
  approveRenewalSchema,
} from './renewal.validation';

const router = Router();

router.use(authenticateToken);

router.get('/', renewalController.list);
router.post('/', validateRequest(createRenewalSchema), renewalController.create);
router.get('/lineage/:instrumentId', renewalController.getLineage);
router.get('/:id', renewalController.getById);
router.post('/:id/submit', validateRequest(submitRenewalSchema), renewalController.submit);
router.post('/:id/approve', validateRequest(approveRenewalSchema), renewalController.approve);

export default router;
