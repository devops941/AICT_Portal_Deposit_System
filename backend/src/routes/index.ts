import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import { rolesRouter, permissionsRouter } from '../modules/rbac/rbac.routes';
import institutionRoutes from '../modules/institutions/institution.routes';
import requirementRoutes from '../modules/requirements/requirement.routes';
import fdrRoutes from '../modules/fdrs/fdr.routes';
import documentRoutes from '../modules/documents/document.routes';
import verificationRoutes from '../modules/verifications/verification.routes';
import discrepancyRoutes from '../modules/discrepancies/discrepancy.routes';
import approvalRoutes from '../modules/approvals/approval.routes';
import maturityRoutes from '../modules/maturity/maturity.routes';
import renewalRoutes from '../modules/renewals/renewal.routes';
import releaseRoutes from '../modules/releases/release.routes';
import aiRoutes from '../modules/ai/ai.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import reportsRoutes from '../modules/reports/reports.routes';
import notificationRoutes from '../modules/notifications/notification.routes';

const router = Router();

// Mount root health checks
router.use('/health', healthRoutes);

// API v1 grouping
const v1Router = Router();
v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/roles', rolesRouter);
v1Router.use('/permissions', permissionsRouter);
v1Router.use('/institutions', institutionRoutes);
v1Router.use('/requirements', requirementRoutes);
v1Router.use('/fdrs', fdrRoutes);
v1Router.use('/documents', documentRoutes);
v1Router.use('/verifications', verificationRoutes);
v1Router.use('/discrepancies', discrepancyRoutes);
v1Router.use('/approvals', approvalRoutes);
v1Router.use('/maturity', maturityRoutes);
v1Router.use('/renewals', renewalRoutes);
v1Router.use('/releases', releaseRoutes);
v1Router.use('/ai', aiRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/reports', reportsRoutes);
v1Router.use('/notifications', notificationRoutes);

router.use('/v1', v1Router);
router.use(v1Router);

export default router;
