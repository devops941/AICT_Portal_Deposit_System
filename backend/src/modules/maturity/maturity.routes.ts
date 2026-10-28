import { Router } from 'express';
import { maturityController } from './maturity.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', maturityController.list);
router.get('/metrics', maturityController.getMetrics);
router.get('/calendar', maturityController.getCalendar);
router.get('/alerts', maturityController.getAlerts);
router.post('/run-job', maturityController.runJob);

export default router;
