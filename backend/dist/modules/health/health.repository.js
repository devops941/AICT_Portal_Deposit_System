"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRepository = exports.HealthRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("../../config/database");
class HealthRepository {
    async checkDatabaseHealth() {
        const startTime = Date.now();
        let status = 'DOWN';
        try {
            if (mongoose_1.default.connection.readyState === 1 && mongoose_1.default.connection.db) {
                await mongoose_1.default.connection.db.command({ ping: 1 });
                status = 'UP';
            }
        }
        catch {
            status = 'DOWN';
        }
        const responseTimeMs = Date.now() - startTime;
        return {
            status,
            host: database_1.dbState.host || 'unknown',
            database: database_1.dbState.name || 'aicte_security_deposit',
            isReplicaSet: database_1.dbState.isReplicaSet,
            responseTimeMs,
        };
    }
}
exports.HealthRepository = HealthRepository;
exports.healthRepository = new HealthRepository();
