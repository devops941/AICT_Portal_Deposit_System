"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirementController = exports.RequirementController = void 0;
const requirement_service_1 = require("./requirement.service");
const apiResponse_1 = require("../../utils/apiResponse");
const asyncHandler_1 = require("../../utils/asyncHandler");
const appError_1 = require("../../utils/appError");
class RequirementController {
    getRequirements = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const { requirements, total } = await requirement_service_1.requirementService.getRequirements(req.query, institutionScope);
        return apiResponse_1.ApiResponse.paginated(res, requirements, { page, limit, total }, 'Requirements retrieved successfully');
    });
    createRequirement = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const user = {
            id: req.user?.id || '',
            email: req.user?.email || '',
            fullName: req.user?.fullName || req.user?.email || 'Authorized Official',
        };
        const requirement = await requirement_service_1.requirementService.createRequirement(req.body, user);
        return apiResponse_1.ApiResponse.success(res, requirement, 'Security Deposit requirement created successfully', 201);
    });
    getDashboardMetrics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const metrics = await requirement_service_1.requirementService.getDashboardMetrics(institutionScope);
        return apiResponse_1.ApiResponse.success(res, metrics, 'Compliance dashboard metrics retrieved');
    });
    getInstitutionCompliance = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const targetInstitutionId = req.params.institutionId;
        if (institutionScope && institutionScope !== targetInstitutionId) {
            throw appError_1.AppError.forbidden('Access denied to other institution data');
        }
        const summary = await requirement_service_1.requirementService.getInstitutionComplianceSummary(targetInstitutionId);
        return apiResponse_1.ApiResponse.success(res, summary, 'Institution compliance summary retrieved');
    });
    getRequirementById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const data = await requirement_service_1.requirementService.getRequirementById(req.params.id, institutionScope);
        return apiResponse_1.ApiResponse.success(res, data, 'Requirement details retrieved successfully');
    });
    updateRequirement = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const user = {
            id: req.user?.id || '',
            email: req.user?.email || '',
            fullName: req.user?.fullName || req.user?.email || 'Authorized Official',
        };
        const data = await requirement_service_1.requirementService.updateRequirement(req.params.id, req.body, user, institutionScope);
        return apiResponse_1.ApiResponse.success(res, data, 'Requirement updated successfully');
    });
    getCompliance = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const { compliance } = await requirement_service_1.requirementService.getRequirementById(req.params.id, institutionScope);
        return apiResponse_1.ApiResponse.success(res, compliance, 'Compliance status retrieved successfully');
    });
    pledgeInstrument = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const institutionScope = req.user?.institutionId;
        const user = {
            id: req.user?.id || '',
            email: req.user?.email || '',
            fullName: req.user?.fullName || req.user?.email || 'Institution User',
        };
        const data = await requirement_service_1.requirementService.pledgeInstrument(req.params.id, req.body, user, institutionScope);
        return apiResponse_1.ApiResponse.success(res, data, 'Instrument pledged successfully', 201);
    });
    verifyInstrument = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const user = {
            id: req.user?.id || '',
            email: req.user?.email || '',
            fullName: req.user?.fullName || req.user?.email || 'Verifying Officer',
        };
        const data = await requirement_service_1.requirementService.verifyInstrument(req.params.id, req.params.instrumentId, req.body, user);
        return apiResponse_1.ApiResponse.success(res, data, 'Instrument verification updated successfully');
    });
}
exports.RequirementController = RequirementController;
exports.requirementController = new RequirementController();
