import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { rbacService, RbacService } from './rbac.service';

export class RbacController {
  constructor(private readonly service: RbacService = rbacService) {}

  getRoles = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const roles = await this.service.getRoles();
    ApiResponse.success(res, roles, 'Roles retrieved successfully', 200);
  });

  createRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const role = await this.service.createRole(req.body);
    ApiResponse.created(res, role, 'Role created successfully');
  });

  updateRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const updated = await this.service.updateRole(req.params.id, req.body);
    ApiResponse.success(res, updated, 'Role updated successfully', 200);
  });

  getPermissions = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const permissions = await this.service.getPermissions();
    ApiResponse.success(res, permissions, 'Permissions retrieved successfully', 200);
  });
}

export const rbacController = new RbacController();
