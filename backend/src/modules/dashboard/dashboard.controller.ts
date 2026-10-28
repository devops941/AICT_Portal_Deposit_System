import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { AuthUserContext } from '../../middleware/auth.middleware';

export class DashboardController {
  /**
   * GET /api/v1/dashboard/summary
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const data = await dashboardService.getSummary(user);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/maturity
   */
  async getMaturity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const data = await dashboardService.getMaturityMetrics(user);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/compliance
   */
  async getCompliance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const data = await dashboardService.getComplianceMetrics(user);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/verification
   */
  async getVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const data = await dashboardService.getVerificationMetrics(user);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
