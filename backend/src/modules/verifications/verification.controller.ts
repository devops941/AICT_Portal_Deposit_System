import { Request, Response, NextFunction } from 'express';
import { verificationService } from './verification.service';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

export class VerificationController {
  async pending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await verificationService.getPendingVerifications(req.query, req.user);
      ApiResponse.paginated(
        res,
        result.data,
        { page: result.page, limit: result.limit, total: result.total },
        'Pending verifications retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async getPacket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const packet = await verificationService.getVerificationPacket(req.params.id, req.user);
      ApiResponse.success(res, packet, 'Verification packet retrieved');
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await verificationService.verifyFdr(req.params.id, req.body, req.user);
      ApiResponse.success(res, result, 'FDR verified successfully and submitted to workflow', 200);
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await verificationService.rejectVerification(req.params.id, req.body, req.user);
      ApiResponse.success(res, result, 'FDR verification rejected', 200);
    } catch (error) {
      next(error);
    }
  }

  async requestClarification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await verificationService.requestClarification(req.params.id, req.body, req.user);
      ApiResponse.success(res, result, 'Clarification request issued to institution', 200);
    } catch (error) {
      next(error);
    }
  }

  async history(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const history = await verificationService.getVerificationHistory(req.params.id, req.user);
      ApiResponse.success(res, history, 'Verification history retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const verificationController = new VerificationController();
