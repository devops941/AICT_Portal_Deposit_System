"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fdrController = exports.FdrController = void 0;
const fdr_service_1 = require("./fdr.service");
const apiResponse_1 = require("../../utils/apiResponse");
const asyncHandler_1 = require("../../utils/asyncHandler");
class FdrController {
    getFdrs = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const { fdrs, total } = await fdr_service_1.fdrService.getFdrs(req.query, institutionScope);
        return apiResponse_1.ApiResponse.paginated(res, fdrs, { page, limit, total }, 'FDRs retrieved successfully');
    });
    createFdr = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const fdr = await fdr_service_1.fdrService.createFdr(req.body, req.user);
        return apiResponse_1.ApiResponse.success(res, fdr, 'FDR registered successfully', 201);
    });
    getDashboardMetrics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const metrics = await fdr_service_1.fdrService.getDashboardMetrics(institutionScope);
        return apiResponse_1.ApiResponse.success(res, metrics, 'FDR metrics retrieved');
    });
    getFdrById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const fdr = await fdr_service_1.fdrService.getFdrById(req.params.id, institutionScope);
        return apiResponse_1.ApiResponse.success(res, fdr, 'FDR details retrieved successfully');
    });
    updateFdr = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const fdr = await fdr_service_1.fdrService.updateFdr(req.params.id, req.body, req.user);
        return apiResponse_1.ApiResponse.success(res, fdr, 'FDR updated successfully');
    });
    submitFdr = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const fdr = await fdr_service_1.fdrService.submitFdr(req.params.id, req.user);
        return apiResponse_1.ApiResponse.success(res, fdr, 'FDR submitted for official scrutiny successfully');
    });
    getFdrHistory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const history = await fdr_service_1.fdrService.getFdrHistory(req.params.id, institutionScope);
        return apiResponse_1.ApiResponse.success(res, history, 'FDR activity history retrieved');
    });
}
exports.FdrController = FdrController;
exports.fdrController = new FdrController();
