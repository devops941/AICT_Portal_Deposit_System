"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.institutionController = exports.InstitutionController = void 0;
const institution_service_1 = require("./institution.service");
const apiResponse_1 = require("../../utils/apiResponse");
const asyncHandler_1 = require("../../utils/asyncHandler");
class InstitutionController {
    service;
    constructor(service = institution_service_1.institutionService) {
        this.service = service;
    }
    getInstitutions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await this.service.getInstitutions(req.query, req.user);
        apiResponse_1.ApiResponse.paginated(res, result.data, {
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
        }, 'Institutions retrieved successfully');
    });
    getInstitutionById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await this.service.getInstitutionById(req.params.id, req.user);
        apiResponse_1.ApiResponse.success(res, result, 'Institution details retrieved', 200);
    });
    createInstitution = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await this.service.createInstitution(req.body, req.user);
        apiResponse_1.ApiResponse.success(res, result, 'Institution created successfully', 201);
    });
    updateInstitution = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await this.service.updateInstitution(req.params.id, req.body, req.user);
        apiResponse_1.ApiResponse.success(res, result, 'Institution updated successfully', 200);
    });
    updateStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await this.service.updateStatus(req.params.id, req.body, req.user);
        apiResponse_1.ApiResponse.success(res, result, 'Institution status updated', 200);
    });
    verifyInstitution = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await this.service.verifyInstitution(req.params.id, req.body, req.user);
        apiResponse_1.ApiResponse.success(res, result, 'Institution verification status updated', 200);
    });
    addDocument = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await this.service.addDocument(req.params.id, req.body, req.user);
        apiResponse_1.ApiResponse.success(res, result, 'Institution document registered successfully', 201);
    });
    getInstitutionUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await this.service.getInstitutionUsers(req.params.id, req.user);
        apiResponse_1.ApiResponse.success(res, result, 'Institution users retrieved successfully', 200);
    });
}
exports.InstitutionController = InstitutionController;
exports.institutionController = new InstitutionController();
