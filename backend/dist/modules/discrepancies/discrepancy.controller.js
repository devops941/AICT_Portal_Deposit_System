"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discrepancyController = exports.DiscrepancyController = void 0;
const discrepancy_service_1 = require("./discrepancy.service");
const apiResponse_1 = require("../../utils/apiResponse");
const appError_1 = require("../../utils/appError");
class DiscrepancyController {
    async list(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const result = await discrepancy_service_1.discrepancyService.getDiscrepancies(req.query, req.user);
            apiResponse_1.ApiResponse.paginated(res, result.data, { page: result.page, limit: result.limit, total: result.total }, 'Discrepancies retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const discrepancy = await discrepancy_service_1.discrepancyService.createDiscrepancy(req.body, req.user);
            apiResponse_1.ApiResponse.success(res, discrepancy, 'Discrepancy created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async resolve(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const discrepancy = await discrepancy_service_1.discrepancyService.resolveDiscrepancy(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.success(res, discrepancy, 'Discrepancy resolved successfully', 200);
        }
        catch (error) {
            next(error);
        }
    }
    async getByInstrument(req, res, next) {
        try {
            const items = await discrepancy_service_1.discrepancyService.getByInstrument(req.params.instrumentId);
            apiResponse_1.ApiResponse.success(res, items, 'Instrument discrepancies retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DiscrepancyController = DiscrepancyController;
exports.discrepancyController = new DiscrepancyController();
