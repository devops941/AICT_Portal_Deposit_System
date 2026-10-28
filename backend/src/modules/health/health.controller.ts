import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { healthService, HealthService } from './health.service';

export class HealthController {
  constructor(private readonly service: HealthService = healthService) {}

  checkQuick = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const data = this.service.getQuickHealth();
    ApiResponse.success(res, data, 'API service is operational', 200);
  });

  checkSystem = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const data = await this.service.getDetailedSystemHealth();
    const statusCode = data.status === 'healthy' ? 200 : 207;
    ApiResponse.success(res, data, `System is ${data.status}`, statusCode);
  });
}

export const healthController = new HealthController();
