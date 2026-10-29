import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticateToken, authorizePermissions } from '../../middleware/auth.middleware';

const router = Router();

// All reports require authentication
router.use(authenticateToken);

// 1. Institution-wise FDR report & Active deposit report & Pending verification report
router.get('/fdrs', authorizePermissions('REPORTS:READ'), (req, res, next) => reportsController.getFdrsReport(req, res, next));

// 2. Maturity Report
router.get('/maturity', authorizePermissions('REPORTS:READ'), (req, res, next) => reportsController.getMaturityReport(req, res, next));

// 3. Renewals Report
router.get('/renewals', authorizePermissions('REPORTS:READ'), (req, res, next) => reportsController.getRenewalsReport(req, res, next));

// 4. Releases Report
router.get('/releases', authorizePermissions('REPORTS:READ'), (req, res, next) => reportsController.getReleasesReport(req, res, next));

// 5. Compliance Report
router.get('/compliance', authorizePermissions('REPORTS:READ'), (req, res, next) => reportsController.getComplianceReport(req, res, next));

// 6. Discrepancies Report
router.get('/discrepancies', authorizePermissions('REPORTS:READ'), (req, res, next) => reportsController.getDiscrepanciesReport(req, res, next));

// 7. Audit Activity Report (Strictly restricted to AUDIT:READ)
router.get('/audit', authorizePermissions('AUDIT:READ'), (req, res, next) => reportsController.getAuditActivityReport(req, res, next));

export default router;
