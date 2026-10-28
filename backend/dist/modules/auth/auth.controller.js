"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const apiResponse_1 = require("../../utils/apiResponse");
const asyncHandler_1 = require("../../utils/asyncHandler");
const auth_service_1 = require("./auth.service");
class AuthController {
    service;
    constructor(service = auth_service_1.authService) {
        this.service = service;
    }
    login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email, password } = req.body;
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const result = await this.service.login(email, password, ip, userAgent);
        apiResponse_1.ApiResponse.success(res, result, 'Authentication successful', 200);
    });
    logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
        await this.service.logout(refreshToken);
        apiResponse_1.ApiResponse.success(res, null, 'Logged out successfully', 200);
    });
    refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const result = await this.service.refreshAccessToken(refreshToken, ip, userAgent);
        apiResponse_1.ApiResponse.success(res, result, 'Token refreshed successfully', 200);
    });
    forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { email } = req.body;
        const result = await this.service.forgotPassword(email);
        apiResponse_1.ApiResponse.success(res, result, result.message, 200);
    });
    resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { token, newPassword } = req.body;
        await this.service.resetPassword(token, newPassword);
        apiResponse_1.ApiResponse.success(res, null, 'Password reset successful. Please log in with your new password.', 200);
    });
    changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        await this.service.changePassword(req.user, currentPassword, newPassword);
        apiResponse_1.ApiResponse.success(res, null, 'Password changed successfully. Please re-authenticate.', 200);
    });
    getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await this.service.getCurrentUser(req.user);
        apiResponse_1.ApiResponse.success(res, result, 'Current user profile retrieved', 200);
    });
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
