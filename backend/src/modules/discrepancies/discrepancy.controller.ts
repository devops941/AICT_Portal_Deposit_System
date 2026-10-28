import { Request, Response, NextFunction } from 'express';
import { discrepancyService } from './discrepancy.service';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

export class DiscrepancyController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await discrepancyService.getDiscrepancies(req.query, req.user);
      ApiResponse.paginated(
        res,
        result.data,
        { page: result.page, limit: result.limit, total: result.total },
        'Discrepancies retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const discrepancy = await discrepancyService.createDiscrepancy(req.body, req.user);
      ApiResponse.success(res, discrepancy, 'Discrepancy created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const discrepancy = await discrepancyService.resolveDiscrepancy(
        req.params.id,
        req.body,
        req.user
      );
      ApiResponse.success(res, discrepancy, 'Discrepancy resolved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getByInstrument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await discrepancyService.getByInstrument(req.params.instrumentId);
      ApiResponse.success(res, items, 'Instrument discrepancies retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const discrepancyController = new DiscrepancyController();
