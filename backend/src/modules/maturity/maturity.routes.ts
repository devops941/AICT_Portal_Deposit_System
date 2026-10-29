import { Router } from 'express';
import { maturityController } from './maturity.controller';
import { authenticateToken, authorizeRoles, authorizePermissions } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', authorizePermissions('FDR:READ'), maturityController.list);
router.get('/metrics', authorizePermissions('FDR:READ'), maturityController.getMetrics);
router.get('/calendar', authorizePermissions('FDR:READ'), maturityController.getCalendar);
router.get('/alerts', authorizePermissions('FDR:READ'), maturityController.getAlerts);
router.post('/run-job', authorizeRoles('SYSTEM_ADMINISTRATOR'), maturityController.runJob);

export default router;
