"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = exports.HealthController = void 0;
const apiResponse_1 = require("../../utils/apiResponse");
const asyncHandler_1 = require("../../utils/asyncHandler");
const health_service_1 = require("./health.service");
class HealthController {
    service;
    constructor(service = health_service_1.healthService) {
        this.service = service;
    }
    checkQuick = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = this.service.getQuickHealth();
        apiResponse_1.ApiResponse.success(res, data, 'API service is operational', 200);
    });
    checkSystem = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const data = await this.service.getDetailedSystemHealth();
        const statusCode = data.status === 'healthy' ? 200 : 207;
        apiResponse_1.ApiResponse.success(res, data, `System is ${data.status}`, statusCode);
    });
}
exports.HealthController = HealthController;
exports.healthController = new HealthController();
