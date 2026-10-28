"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const seed_1 = require("./config/seed");
const logger_1 = require("./config/logger");
const jobs_1 = require("./jobs");
let server;
async function bootstrap() {
    try {
        await (0, database_1.connectDatabase)();
        await (0, seed_1.seedInitialData)();
        jobs_1.jobScheduler.startAll();
        server = app_1.default.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`=======================================================`);
            logger_1.logger.info(`🚀 AICTE Security Deposit Portal Backend Initialized!`);
            logger_1.logger.info(`🌐 Environment : ${env_1.env.NODE_ENV}`);
            logger_1.logger.info(`📡 Port        : ${env_1.env.PORT}`);
            logger_1.logger.info(`🔗 Base URL    : http://localhost:${env_1.env.PORT}/api/v1`);
            logger_1.logger.info(`🩺 Health Check: http://localhost:${env_1.env.PORT}/api/health`);
            logger_1.logger.info(`=======================================================`);
        });
    }
    catch (error) {
        logger_1.logger.error('Fatal initialization error during server bootstrap:', error);
        process.exit(1);
    }
}
async function handleShutdown(signal) {
    logger_1.logger.info(`Received ${signal}. Initiating graceful shutdown...`);
    if (server) {
        server.close(async () => {
            logger_1.logger.info('HTTP server closed.');
            jobs_1.jobScheduler.stopAll();
            await (0, database_1.disconnectDatabase)();
            logger_1.logger.info('Graceful shutdown completed successfully.');
            process.exit(0);
        });
        setTimeout(() => {
            logger_1.logger.error('Graceful shutdown timed out. Forcing process exit.');
            process.exit(1);
        }, 10000);
    }
    else {
        process.exit(0);
    }
}
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('UNHANDLED REJECTION DETECTED:', reason);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('UNCAUGHT EXCEPTION DETECTED! Shutting down immediately:', error);
    process.exit(1);
});
bootstrap();
