import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { seedInitialData } from './config/seed';
import { logger } from './config/logger';
import { jobScheduler } from './jobs';
import { Server } from 'http';

let server: Server;

async function bootstrap(): Promise<void> {
  try {
    // 1. Establish Database Connection
    await connectDatabase();

    // 2. Seed Initial RBAC Roles, Permissions, and Super Admin
    await seedInitialData();

    // 2. Start Background Jobs
    jobScheduler.startAll();

    // 3. Start HTTP Server
    server = app.listen(env.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(`🚀 AICTE Security Deposit Portal Backend Initialized!`);
      logger.info(`🌐 Environment : ${env.NODE_ENV}`);
      logger.info(`📡 Port        : ${env.PORT}`);
      logger.info(`🔗 Base URL    : http://localhost:${env.PORT}/api/v1`);
      logger.info(`🩺 Health Check: http://localhost:${env.PORT}/api/health`);
      logger.info(`=======================================================`);
    });
  } catch (error) {
    logger.error('Fatal initialization error during server bootstrap:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function handleShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Stop accepting new HTTP requests
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');

      // Stop background job loops
      jobScheduler.stopAll();

      // Disconnect database
      await disconnectDatabase();

      logger.info('Graceful shutdown completed successfully.');
      process.exit(0);
    });

    // Force close if graceful shutdown takes longer than 10 seconds
    setTimeout(() => {
      logger.error('Graceful shutdown timed out. Forcing process exit.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Process signal listeners
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Process error listeners
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('UNHANDLED REJECTION DETECTED:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION DETECTED! Shutting down immediately:', error);
  process.exit(1);
});

// Launch server
bootstrap();
