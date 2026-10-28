import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { AuthUserContext } from '../../middleware/auth.middleware';

export class ReportsController {
  private sendReportResponse(res: Response, result: any): void {
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

  /**
   * GET /api/v1/reports/fdrs
   */
  async getFdrsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const result = await reportsService.getFdrsReport(user, req.query);
      this.sendReportResponse(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/reports/maturity
   */
  async getMaturityReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const result = await reportsService.getMaturityReport(user, req.query);
      this.sendReportResponse(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/reports/renewals
   */
  async getRenewalsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const result = await reportsService.getRenewalsReport(user, req.query);
      this.sendReportResponse(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/reports/releases
   */
  async getReleasesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const result = await reportsService.getReleasesReport(user, req.query);
      this.sendReportResponse(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/reports/compliance
   */
  async getComplianceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const result = await reportsService.getComplianceReport(user, req.query);
      this.sendReportResponse(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/reports/discrepancies
   */
  async getDiscrepanciesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const result = await reportsService.getDiscrepanciesReport(user, req.query);
      this.sendReportResponse(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/reports/audit
   */
  async getAuditActivityReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as AuthUserContext;
      const result = await reportsService.getAuditActivityReport(user, req.query);
      this.sendReportResponse(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
