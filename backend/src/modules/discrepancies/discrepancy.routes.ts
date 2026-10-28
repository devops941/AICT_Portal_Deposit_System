import { Router } from 'express';
import { discrepancyController } from './discrepancy.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createDiscrepancySchema, resolveDiscrepancySchema } from './discrepancy.validation';

const router = Router();

router.use(authenticateToken);

router.get('/', discrepancyController.list);
router.post('/', validate(createDiscrepancySchema), discrepancyController.create);
router.patch('/:id/resolve', validate(resolveDiscrepancySchema), discrepancyController.resolve);
router.get('/instrument/:instrumentId', discrepancyController.getByInstrument);

export default router;
