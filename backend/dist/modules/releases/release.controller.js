"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseController = exports.ReleaseController = void 0;
const release_service_1 = require("./release.service");
const apiResponse_1 = require("../../utils/apiResponse");
const appError_1 = require("../../utils/appError");
class ReleaseController {
    async assessEligibility(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const { instrumentId } = req.params;
            const result = await release_service_1.releaseService.assessEligibility(instrumentId, req.user);
            apiResponse_1.ApiResponse.success(res, result, 'Eligibility assessment completed');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const release = await release_service_1.releaseService.createRelease(req.body, req.user);
            apiResponse_1.ApiResponse.created(res, release, 'Release request submitted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getMetrics(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const metrics = await release_service_1.releaseService.getDashboardMetrics(req.user);
            apiResponse_1.ApiResponse.success(res, metrics, 'Release metrics retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const result = await release_service_1.releaseService.listReleases(req.query, req.user);
            apiResponse_1.ApiResponse.paginated(res, result.data, { page: result.page, limit: result.limit, total: result.total }, 'Release requests retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const { id } = req.params;
            const result = await release_service_1.releaseService.getReleaseById(id, req.user);
            apiResponse_1.ApiResponse.success(res, result, 'Release request details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async review(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const { id } = req.params;
            const release = await release_service_1.releaseService.reviewRelease(id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, release, 'Release review updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async respondClarification(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const { id } = req.params;
            const release = await release_service_1.releaseService.respondClarification(id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, release, 'Clarification response submitted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async approve(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const { id } = req.params;
            const release = await release_service_1.releaseService.approveRelease(id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, release, 'Release request approved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async reject(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const { id } = req.params;
            const release = await release_service_1.releaseService.rejectRelease(id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, release, 'Release request rejected');
        }
        catch (error) {
            next(error);
        }
    }
    async authorizeRelease(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const { id } = req.params;
            const release = await release_service_1.releaseService.authorizeRelease(id, req.user);
            apiResponse_1.ApiResponse.success(res, release, 'Release officially authorized and deposit discharged');
        }
        catch (error) {
            next(error);
        }
    }
    async close(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const { id } = req.params;
            const release = await release_service_1.releaseService.closeRelease(id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, release, 'Release record closed successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReleaseController = ReleaseController;
exports.releaseController = new ReleaseController();
