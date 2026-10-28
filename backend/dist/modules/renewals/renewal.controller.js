"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renewalController = exports.RenewalController = void 0;
const renewal_service_1 = require("./renewal.service");
const apiResponse_1 = require("../../utils/apiResponse");
const appError_1 = require("../../utils/appError");
class RenewalController {
    async create(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const renewal = await renewal_service_1.renewalService.createRenewal(req.body, req.user);
            apiResponse_1.ApiResponse.created(res, renewal, 'Renewal request created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async submit(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const { id } = req.params;
            const renewal = await renewal_service_1.renewalService.submitRenewal(id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, renewal, 'Replacement instrument details submitted successfully');
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
            const renewal = await renewal_service_1.renewalService.approveRenewal(id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, renewal, 'Renewal approved and replacement instrument activated successfully');
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
            const result = await renewal_service_1.renewalService.getRenewalById(id, req.user);
            apiResponse_1.ApiResponse.success(res, result, 'Renewal details retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const listResult = await renewal_service_1.renewalService.listRenewals(req.query, req.user);
            apiResponse_1.ApiResponse.paginated(res, listResult.data, { page: listResult.page, limit: listResult.limit, total: listResult.total }, 'Renewal requests retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getLineage(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const { instrumentId } = req.params;
            const lineage = await renewal_service_1.renewalService.getReplacementHistory(instrumentId, req.user);
            apiResponse_1.ApiResponse.success(res, lineage, 'Instrument replacement lineage retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RenewalController = RenewalController;
exports.renewalController = new RenewalController();
