import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// All dashboard endpoints require authentication
router.use(authenticateToken);

// 1. Role-tailored Executive Summary & Universal KPIs
router.get('/summary', dashboardController.getSummary);

// 2. Maturity Forecast & Brackets
router.get('/maturity', dashboardController.getMaturity);

// 3. Compliance & Financial Analytics
router.get('/compliance', dashboardController.getCompliance);

// 4. Verification Trends & Bank Distribution
router.get('/verification', dashboardController.getVerification);

export default router;
