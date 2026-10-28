import { Router } from 'express';
import { healthController } from './health.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { healthQuerySchema } from './health.validation';

const router = Router();

router.get('/', healthController.checkQuick);
router.get('/system', validateRequest(healthQuerySchema), healthController.checkSystem);

export default router;
