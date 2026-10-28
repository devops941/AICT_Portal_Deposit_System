import { Request, Response, NextFunction } from 'express';
import { approvalService } from './approval.service';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

export class ApprovalController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await approvalService.getApprovals(req.query, req.user);
      ApiResponse.paginated(
        res,
        result.data,
        { page: result.page, limit: result.limit, total: result.total },
        'Approval requests retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await approvalService.getById(req.params.id);
      ApiResponse.success(res, data, 'Approval details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const approval = await approvalService.createApprovalRequest(req.body, req.user);
      ApiResponse.success(res, approval, 'Approval request initiated', 201);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const approval = await approvalService.approveStep(req.params.id, req.body, req.user);
      ApiResponse.success(res, approval, 'Approval step processed successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const approval = await approvalService.rejectStep(req.params.id, req.body, req.user);
      ApiResponse.success(res, approval, 'Approval step rejected', 200);
    } catch (error) {
      next(error);
    }
  }

  async returnStep(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const approval = await approvalService.returnStep(req.params.id, req.body, req.user);
      ApiResponse.success(res, approval, 'Approval step returned for clarification', 200);
    } catch (error) {
      next(error);
    }
  }

  async escalate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const approval = await approvalService.escalateStep(req.params.id, req.body, req.user);
      ApiResponse.success(res, approval, 'Approval step escalated', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const approvalController = new ApprovalController();
