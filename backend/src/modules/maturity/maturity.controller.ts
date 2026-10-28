import { Request, Response, NextFunction } from 'express';
import { maturityService } from './maturity.service';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

export class MaturityController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const listResult = await maturityService.getMaturityList(req.query, req.user);

      ApiResponse.paginated(
        res,
        listResult.data,
        { page: listResult.page, limit: listResult.limit, total: listResult.total },
        'Maturity monitoring data retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const metrics = await maturityService.getOverviewMetrics(req.user);
      ApiResponse.success(res, metrics, 'Maturity metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const calendar = await maturityService.getMaturityCalendar(req.user);
      ApiResponse.success(res, calendar, 'Maturity calendar retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const alerts = await maturityService.getMaturityAlerts(req.user);
      ApiResponse.success(res, alerts, 'Maturity alerts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async runJob(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await maturityService.runJob();
      ApiResponse.success(res, result, 'Maturity monitoring job executed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const maturityController = new MaturityController();
