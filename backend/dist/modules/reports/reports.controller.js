"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsController = exports.ReportsController = void 0;
const reports_service_1 = require("./reports.service");
class ReportsController {
    sendReportResponse(res, result) {
        if (result.isExport && result.csv) {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
            res.status(200).send(result.csv);
            return;
        }
        res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination,
            summary: result.summary,
        });
    }
    async getFdrsReport(req, res, next) {
        try {
            const user = req.user;
            const result = await reports_service_1.reportsService.getFdrsReport(user, req.query);
            this.sendReportResponse(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getMaturityReport(req, res, next) {
        try {
            const user = req.user;
            const result = await reports_service_1.reportsService.getMaturityReport(user, req.query);
            this.sendReportResponse(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getRenewalsReport(req, res, next) {
        try {
            const user = req.user;
            const result = await reports_service_1.reportsService.getRenewalsReport(user, req.query);
            this.sendReportResponse(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getReleasesReport(req, res, next) {
        try {
            const user = req.user;
            const result = await reports_service_1.reportsService.getReleasesReport(user, req.query);
            this.sendReportResponse(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getComplianceReport(req, res, next) {
        try {
            const user = req.user;
            const result = await reports_service_1.reportsService.getComplianceReport(user, req.query);
            this.sendReportResponse(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getDiscrepanciesReport(req, res, next) {
        try {
            const user = req.user;
            const result = await reports_service_1.reportsService.getDiscrepanciesReport(user, req.query);
            this.sendReportResponse(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getAuditActivityReport(req, res, next) {
        try {
            const user = req.user;
            const result = await reports_service_1.reportsService.getAuditActivityReport(user, req.query);
            this.sendReportResponse(res, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ReportsController = ReportsController;
exports.reportsController = new ReportsController();
