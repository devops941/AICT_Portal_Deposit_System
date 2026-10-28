"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationController = exports.VerificationController = void 0;
const verification_service_1 = require("./verification.service");
const apiResponse_1 = require("../../utils/apiResponse");
const appError_1 = require("../../utils/appError");
class VerificationController {
    async pending(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const result = await verification_service_1.verificationService.getPendingVerifications(req.query, req.user);
            apiResponse_1.ApiResponse.paginated(res, result.data, { page: result.page, limit: result.limit, total: result.total }, 'Pending verifications retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getPacket(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const packet = await verification_service_1.verificationService.getVerificationPacket(req.params.id, req.user);
            apiResponse_1.ApiResponse.success(res, packet, 'Verification packet retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    async verify(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const result = await verification_service_1.verificationService.verifyFdr(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, result, 'FDR verified successfully and submitted to workflow', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async reject(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const result = await verification_service_1.verificationService.rejectVerification(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, result, 'FDR verification rejected', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async requestClarification(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const result = await verification_service_1.verificationService.requestClarification(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, result, 'Clarification request issued to institution', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async history(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const history = await verification_service_1.verificationService.getVerificationHistory(req.params.id, req.user);
            apiResponse_1.ApiResponse.success(res, history, 'Verification history retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.VerificationController = VerificationController;
exports.verificationController = new VerificationController();
