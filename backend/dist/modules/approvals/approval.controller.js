"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvalController = exports.ApprovalController = void 0;
const approval_service_1 = require("./approval.service");
const apiResponse_1 = require("../../utils/apiResponse");
const appError_1 = require("../../utils/appError");
class ApprovalController {
    async list(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const result = await approval_service_1.approvalService.getApprovals(req.query, req.user);
            apiResponse_1.ApiResponse.paginated(res, result.data, { page: result.page, limit: result.limit, total: result.total }, 'Approval requests retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const data = await approval_service_1.approvalService.getById(req.params.id);
            apiResponse_1.ApiResponse.success(res, data, 'Approval details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const approval = await approval_service_1.approvalService.createApprovalRequest(req.body, req.user);
            apiResponse_1.ApiResponse.success(res, approval, 'Approval request initiated', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async approve(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const approval = await approval_service_1.approvalService.approveStep(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, approval, 'Approval step processed successfully', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async reject(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const approval = await approval_service_1.approvalService.rejectStep(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, approval, 'Approval step rejected', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async returnStep(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const approval = await approval_service_1.approvalService.returnStep(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, approval, 'Approval step returned for clarification', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async escalate(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const approval = await approval_service_1.approvalService.escalateStep(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, approval, 'Approval step escalated', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ApprovalController = ApprovalController;
exports.approvalController = new ApprovalController();
