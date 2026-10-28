import { Request, Response } from 'express';
import { institutionService, InstitutionService } from './institution.service';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class InstitutionController {
  constructor(private readonly service: InstitutionService = institutionService) {}

  getInstitutions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.getInstitutions(req.query as any, req.user!);
    ApiResponse.paginated(
      res,
      result.data,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      },
      'Institutions retrieved successfully'
    );
  });

  getInstitutionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.getInstitutionById(req.params.id, req.user!);
    ApiResponse.success(res, result, 'Institution details retrieved', 200);
  });

  createInstitution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.createInstitution(req.body, req.user!);
    ApiResponse.success(res, result, 'Institution created successfully', 201);
  });

  updateInstitution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.updateInstitution(req.params.id, req.body, req.user!);
    ApiResponse.success(res, result, 'Institution updated successfully', 200);
  });

  updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.updateStatus(req.params.id, req.body, req.user!);
    ApiResponse.success(res, result, 'Institution status updated', 200);
  });

  verifyInstitution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.verifyInstitution(req.params.id, req.body, req.user!);
    ApiResponse.success(res, result, 'Institution verification status updated', 200);
  });

  addDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.addDocument(req.params.id, req.body, req.user!);
    ApiResponse.success(res, result, 'Institution document registered successfully', 201);
  });

  getInstitutionUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.getInstitutionUsers(req.params.id, req.user!);
    ApiResponse.success(res, result, 'Institution users retrieved successfully', 200);
  });
}

export const institutionController = new InstitutionController();
