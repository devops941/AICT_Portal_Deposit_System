"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const apiResponse_1 = require("../../utils/apiResponse");
const asyncHandler_1 = require("../../utils/asyncHandler");
const user_service_1 = require("./user.service");
class UserController {
    service;
    constructor(service = user_service_1.userService) {
        this.service = service;
    }
    getUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await this.service.getUsers(req.query, req.user);
        apiResponse_1.ApiResponse.paginated(res, result.items, { page: result.page, limit: result.limit, total: result.total }, 'Users retrieved successfully');
    });
    getUserById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const user = await this.service.getUserById(req.params.id, req.user);
        apiResponse_1.ApiResponse.success(res, user, 'User retrieved successfully', 200);
    });
    createUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const created = await this.service.createUser(req.body, req.user);
        apiResponse_1.ApiResponse.created(res, created, 'User created successfully');
    });
    updateUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const updated = await this.service.updateUser(req.params.id, req.body, req.user);
        apiResponse_1.ApiResponse.success(res, updated, 'User updated successfully', 200);
    });
    updateUserStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const updated = await this.service.updateUserStatus(req.params.id, req.body.status, req.user);
        apiResponse_1.ApiResponse.success(res, updated, `User account status updated to ${req.body.status}`, 200);
    });
}
exports.UserController = UserController;
exports.userController = new UserController();
