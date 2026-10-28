"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
class DashboardController {
    async getSummary(req, res, next) {
        try {
            const user = req.user;
            const data = await dashboard_service_1.dashboardService.getSummary(user);
            res.status(200).json({
                success: true,
                data,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getMaturity(req, res, next) {
        try {
            const user = req.user;
            const data = await dashboard_service_1.dashboardService.getMaturityMetrics(user);
            res.status(200).json({
                success: true,
                data,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getCompliance(req, res, next) {
        try {
            const user = req.user;
            const data = await dashboard_service_1.dashboardService.getComplianceMetrics(user);
            res.status(200).json({
                success: true,
                data,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getVerification(req, res, next) {
        try {
            const user = req.user;
            const data = await dashboard_service_1.dashboardService.getVerificationMetrics(user);
            res.status(200).json({
                success: true,
                data,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();
