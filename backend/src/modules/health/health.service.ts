import { env } from '../../config/env';
import { healthRepository, HealthRepository } from './health.repository';
import { QuickHealthResponse, SystemHealthResponse } from './health.types';

export class HealthService {
  constructor(private readonly repository: HealthRepository = healthRepository) {}

  getQuickHealth(): QuickHealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }

  async getDetailedSystemHealth(): Promise<SystemHealthResponse> {
    const dbHealth = await this.repository.checkDatabaseHealth();
    const memory = process.memoryUsage();

    const isDbHealthy = dbHealth.status === 'UP';

    return {
      status: isDbHealthy ? 'healthy' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: '1.0.0',
      database: dbHealth,
      memory: {
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      },
    };
  }
}

export const healthService = new HealthService();
