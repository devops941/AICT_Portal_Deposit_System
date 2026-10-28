"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maturityController = exports.MaturityController = void 0;
const maturity_service_1 = require("./maturity.service");
const apiResponse_1 = require("../../utils/apiResponse");
const appError_1 = require("../../utils/appError");
class MaturityController {
    async list(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const listResult = await maturity_service_1.maturityService.getMaturityList(req.query, req.user);
            apiResponse_1.ApiResponse.paginated(res, listResult.data, { page: listResult.page, limit: listResult.limit, total: listResult.total }, 'Maturity monitoring data retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getMetrics(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const metrics = await maturity_service_1.maturityService.getOverviewMetrics(req.user);
            apiResponse_1.ApiResponse.success(res, metrics, 'Maturity metrics retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getCalendar(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const calendar = await maturity_service_1.maturityService.getMaturityCalendar(req.user);
            apiResponse_1.ApiResponse.success(res, calendar, 'Maturity calendar retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async getAlerts(req, res, next) {
        try {
            if (!req.user)
                throw appError_1.AppError.unauthorized();
            const alerts = await maturity_service_1.maturityService.getMaturityAlerts(req.user);
            apiResponse_1.ApiResponse.success(res, alerts, 'Maturity alerts retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async runJob(_req, res, next) {
        try {
            const result = await maturity_service_1.maturityService.runJob();
            apiResponse_1.ApiResponse.success(res, result, 'Maturity monitoring job executed successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MaturityController = MaturityController;
exports.maturityController = new MaturityController();
