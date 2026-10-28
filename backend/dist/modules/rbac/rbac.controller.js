"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacController = exports.RbacController = void 0;
const apiResponse_1 = require("../../utils/apiResponse");
const asyncHandler_1 = require("../../utils/asyncHandler");
const rbac_service_1 = require("./rbac.service");
class RbacController {
    service;
    constructor(service = rbac_service_1.rbacService) {
        this.service = service;
    }
    getRoles = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const roles = await this.service.getRoles();
        apiResponse_1.ApiResponse.success(res, roles, 'Roles retrieved successfully', 200);
    });
    createRole = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const role = await this.service.createRole(req.body);
        apiResponse_1.ApiResponse.created(res, role, 'Role created successfully');
    });
    updateRole = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const updated = await this.service.updateRole(req.params.id, req.body);
        apiResponse_1.ApiResponse.success(res, updated, 'Role updated successfully', 200);
    });
    getPermissions = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const permissions = await this.service.getPermissions();
        apiResponse_1.ApiResponse.success(res, permissions, 'Permissions retrieved successfully', 200);
    });
}
exports.RbacController = RbacController;
exports.rbacController = new RbacController();
