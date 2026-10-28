import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { authService, AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.service.login(email, password, ip, userAgent);
    ApiResponse.success(res, result, 'Authentication successful', 200);
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
    await this.service.logout(refreshToken as string);
    ApiResponse.success(res, null, 'Logged out successfully', 200);
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.service.refreshAccessToken(refreshToken, ip, userAgent);
    ApiResponse.success(res, result, 'Token refreshed successfully', 200);
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    const result = await this.service.forgotPassword(email);
    ApiResponse.success(res, result, result.message, 200);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;
    await this.service.resetPassword(token, newPassword);
    ApiResponse.success(res, null, 'Password reset successful. Please log in with your new password.', 200);
  });

  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    await this.service.changePassword(req.user!, currentPassword, newPassword);
    ApiResponse.success(res, null, 'Password changed successfully. Please re-authenticate.', 200);
  });

  getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.getCurrentUser(req.user!);
    ApiResponse.success(res, result, 'Current user profile retrieved', 200);
  });
}

export const authController = new AuthController();
