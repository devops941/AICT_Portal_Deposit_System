import { Request, Response, NextFunction } from 'express';
import { releaseService } from './release.service';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

export class ReleaseController {
  async assessEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { instrumentId } = req.params;
      const result = await releaseService.assessEligibility(instrumentId, req.user);
      ApiResponse.success(res, result, 'Eligibility assessment completed');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const release = await releaseService.createRelease(req.body, req.user);
      ApiResponse.created(res, release, 'Release request submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const metrics = await releaseService.getDashboardMetrics(req.user);
      ApiResponse.success(res, metrics, 'Release metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await releaseService.listReleases(req.query, req.user);
      ApiResponse.paginated(
        res,
        result.data,
        { page: result.page, limit: result.limit, total: result.total },
        'Release requests retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;
      const result = await releaseService.getReleaseById(id, req.user);
      ApiResponse.success(res, result, 'Release request details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;
      const release = await releaseService.reviewRelease(id, req.body, req.user);
      ApiResponse.success(res, release, 'Release review updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async respondClarification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;
      const release = await releaseService.respondClarification(id, req.body, req.user);
      ApiResponse.success(res, release, 'Clarification response submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;
      const release = await releaseService.approveRelease(id, req.body, req.user);
      ApiResponse.success(res, release, 'Release request approved successfully');
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;
      const release = await releaseService.rejectRelease(id, req.body, req.user);
      ApiResponse.success(res, release, 'Release request rejected');
    } catch (error) {
      next(error);
    }
  }

  async authorizeRelease(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;
      const release = await releaseService.authorizeRelease(id, req.user);
      ApiResponse.success(res, release, 'Release officially authorized and deposit discharged');
    } catch (error) {
      next(error);
    }
  }

  async close(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { id } = req.params;
      const release = await releaseService.closeRelease(id, req.body, req.user);
      ApiResponse.success(res, release, 'Release record closed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const releaseController = new ReleaseController();
