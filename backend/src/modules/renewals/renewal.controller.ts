import { Request, Response, NextFunction } from 'express';
import { renewalService } from './renewal.service';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

export class RenewalController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const renewal = await renewalService.createRenewal(req.body, req.user);
      ApiResponse.created(res, renewal, 'Renewal request created successfully');
    } catch (error) {
      next(error);
    }
  }

  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;
      const renewal = await renewalService.submitRenewal(id, req.body, req.user);
      ApiResponse.success(res, renewal, 'Replacement instrument details submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;
      const renewal = await renewalService.approveRenewal(id, req.body, req.user);
      ApiResponse.success(res, renewal, 'Renewal approved and replacement instrument activated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;
      const result = await renewalService.getRenewalById(id, req.user);
      ApiResponse.success(res, result, 'Renewal details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const listResult = await renewalService.listRenewals(req.query, req.user);
      ApiResponse.paginated(
        res,
        listResult.data,
        { page: listResult.page, limit: listResult.limit, total: listResult.total },
        'Renewal requests retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async getLineage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { instrumentId } = req.params;
      const lineage = await renewalService.getReplacementHistory(instrumentId, req.user);
      ApiResponse.success(res, lineage, 'Instrument replacement lineage retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const renewalController = new RenewalController();
