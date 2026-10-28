"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthService = exports.HealthService = void 0;
const env_1 = require("../../config/env");
const health_repository_1 = require("./health.repository");
class HealthService {
    repository;
    constructor(repository = health_repository_1.healthRepository) {
        this.repository = repository;
    }
    getQuickHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
        };
    }
    async getDetailedSystemHealth() {
        const dbHealth = await this.repository.checkDatabaseHealth();
        const memory = process.memoryUsage();
        const isDbHealthy = dbHealth.status === 'UP';
        return {
            status: isDbHealthy ? 'healthy' : 'degraded',
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            environment: env_1.env.NODE_ENV,
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
exports.HealthService = HealthService;
exports.healthService = new HealthService();
