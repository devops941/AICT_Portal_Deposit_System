import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { userService, UserService } from './user.service';

export class UserController {
  constructor(private readonly service: UserService = userService) {}

  getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.getUsers(req.query as any, req.user!);
    ApiResponse.paginated(
      res,
      result.items,
      { page: result.page, limit: result.limit, total: result.total },
      'Users retrieved successfully'
    );
  });

  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await this.service.getUserById(req.params.id, req.user!);
    ApiResponse.success(res, user, 'User retrieved successfully', 200);
  });

  createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const created = await this.service.createUser(req.body, req.user!);
    ApiResponse.created(res, created, 'User created successfully');
  });

  updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const updated = await this.service.updateUser(req.params.id, req.body, req.user!);
    ApiResponse.success(res, updated, 'User updated successfully', 200);
  });

  updateUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const updated = await this.service.updateUserStatus(req.params.id, req.body.status, req.user!);
    ApiResponse.success(res, updated, `User account status updated to ${req.body.status}`, 200);
  });
}

export const userController = new UserController();
