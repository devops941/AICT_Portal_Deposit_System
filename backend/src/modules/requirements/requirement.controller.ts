import { Request, Response } from 'express';
import { requirementService } from './requirement.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/appError';

export class RequirementController {
  /**
   * GET /api/v1/requirements
   */
  getRequirements = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const { requirements, total } = await requirementService.getRequirements(
      req.query as any,
      institutionScope
    );

    return ApiResponse.paginated(
      res,
      requirements,
      { page, limit, total },
      'Requirements retrieved successfully'
    );
  });

  /**
   * POST /api/v1/requirements
   */
  createRequirement = asyncHandler(async (req: Request, res: Response) => {
    const user = {
      id: req.user?.id || '',
      email: req.user?.email || '',
      fullName: req.user?.fullName || req.user?.email || 'Authorized Official',
    };

    const requirement = await requirementService.createRequirement(req.body, user);
    return ApiResponse.success(res, requirement, 'Security Deposit requirement created successfully', 201);
  });

  /**
   * GET /api/v1/requirements/metrics
   */
  getDashboardMetrics = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const metrics = await requirementService.getDashboardMetrics(institutionScope);
    return ApiResponse.success(res, metrics, 'Compliance dashboard metrics retrieved');
  });

  /**
   * GET /api/v1/requirements/institution/:institutionId/compliance
   */
  getInstitutionCompliance = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const targetInstitutionId = req.params.institutionId;

    if (institutionScope && institutionScope !== targetInstitutionId) {
      throw AppError.forbidden('Access denied to other institution data');
    }

    const summary = await requirementService.getInstitutionComplianceSummary(targetInstitutionId);
    return ApiResponse.success(res, summary, 'Institution compliance summary retrieved');
  });

  /**
   * GET /api/v1/requirements/:id
   */
  getRequirementById = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const data = await requirementService.getRequirementById(req.params.id, institutionScope);
    return ApiResponse.success(res, data, 'Requirement details retrieved successfully');
  });

  /**
   * PATCH /api/v1/requirements/:id
   */
  updateRequirement = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const user = {
      id: req.user?.id || '',
      email: req.user?.email || '',
      fullName: req.user?.fullName || req.user?.email || 'Authorized Official',
    };

    const data = await requirementService.updateRequirement(
      req.params.id,
      req.body,
      user,
      institutionScope
    );
    return ApiResponse.success(res, data, 'Requirement updated successfully');
  });

  /**
   * GET /api/v1/requirements/:id/compliance
   */
  getCompliance = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const { compliance } = await requirementService.getRequirementById(req.params.id, institutionScope);
    return ApiResponse.success(res, compliance, 'Compliance status retrieved successfully');
  });

  /**
   * POST /api/v1/requirements/:id/pledge
   */
  pledgeInstrument = asyncHandler(async (req: Request, res: Response) => {
    const institutionScope = req.user?.institutionId;
    const user = {
      id: req.user?.id || '',
      email: req.user?.email || '',
      fullName: req.user?.fullName || req.user?.email || 'Institution User',
    };

    const data = await requirementService.pledgeInstrument(
      req.params.id,
      req.body,
      user,
      institutionScope
    );
    return ApiResponse.success(res, data, 'Instrument pledged successfully', 201);
  });

  /**
   * PATCH /api/v1/requirements/:id/instruments/:instrumentId/verify
   */
  verifyInstrument = asyncHandler(async (req: Request, res: Response) => {
    const user = {
      id: req.user?.id || '',
      email: req.user?.email || '',
      fullName: req.user?.fullName || req.user?.email || 'Verifying Officer',
    };

    const data = await requirementService.verifyInstrument(
      req.params.id,
      req.params.instrumentId,
      req.body,
      user
    );
    return ApiResponse.success(res, data, 'Instrument verification updated successfully');
  });
}

export const requirementController = new RequirementController();
