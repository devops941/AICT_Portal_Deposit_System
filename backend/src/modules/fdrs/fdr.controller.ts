import { Request, Response } from 'express';
import { fdrService } from './fdr.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class FdrController {
  /**
   * GET /api/v1/fdrs
   */
  getFdrs = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const { fdrs, total } = await fdrService.getFdrs(req.query as any, institutionScope);

    return ApiResponse.paginated(
      res,
      fdrs,
      { page, limit, total },
      'FDRs retrieved successfully'
    );
  });

  /**
   * POST /api/v1/fdrs
   */
  createFdr = asyncHandler(async (req: Request, res: Response) => {
    const fdr = await fdrService.createFdr(req.body, req.user!);
    return ApiResponse.success(res, fdr, 'FDR registered successfully', 201);
  });

  /**
   * GET /api/v1/fdrs/metrics
   */
  getDashboardMetrics = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const metrics = await fdrService.getDashboardMetrics(institutionScope);
    return ApiResponse.success(res, metrics, 'FDR metrics retrieved');
  });

  /**
   * GET /api/v1/fdrs/:id
   */
  getFdrById = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const fdr = await fdrService.getFdrById(req.params.id, institutionScope);
    return ApiResponse.success(res, fdr, 'FDR details retrieved successfully');
  });

  /**
   * PATCH /api/v1/fdrs/:id
   */
  updateFdr = asyncHandler(async (req: Request, res: Response) => {
    const fdr = await fdrService.updateFdr(req.params.id, req.body, req.user!);
    return ApiResponse.success(res, fdr, 'FDR updated successfully');
  });

  /**
   * POST /api/v1/fdrs/:id/submit
   */
  submitFdr = asyncHandler(async (req: Request, res: Response) => {
    const fdr = await fdrService.submitFdr(req.params.id, req.user!);
    return ApiResponse.success(res, fdr, 'FDR submitted for official scrutiny successfully');
  });

  /**
   * GET /api/v1/fdrs/:id/history
   */
  getFdrHistory = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const history = await fdrService.getFdrHistory(req.params.id, institutionScope);
    return ApiResponse.success(res, history, 'FDR activity history retrieved');
  });
}

export const fdrController = new FdrController();
