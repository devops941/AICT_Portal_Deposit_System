import mongoose from 'mongoose';
import { dbState } from '../../config/database';
import { DatabaseHealth } from './health.types';

export class HealthRepository {
  async checkDatabaseHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now();
    let status: 'UP' | 'DOWN' = 'DOWN';

    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.command({ ping: 1 });
        status = 'UP';
      }
    } catch {
      status = 'DOWN';
    }

    const responseTimeMs = Date.now() - startTime;

    return {
      status,
      host: dbState.host || 'unknown',
      database: dbState.name || 'aicte_security_deposit',
      isReplicaSet: dbState.isReplicaSet,
      responseTimeMs,
    };
  }
}

export const healthRepository = new HealthRepository();
