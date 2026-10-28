import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export interface DatabaseState {
  isConnected: boolean;
  isReplicaSet: boolean;
  host: string;
  name: string;
}

export const dbState: DatabaseState = {
  isConnected: false,
  isReplicaSet: false,
  host: '',
  name: '',
};

export async function connectDatabase(): Promise<void> {
  const mongooseOptions: mongoose.ConnectOptions = {
    autoIndex: env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    logger.info(`Connecting to MongoDB at: ${env.MONGODB_URI.replace(/:\/\/[^@]*@/, '://***:***@')}`);

    const conn = await mongoose.connect(env.MONGODB_URI, mongooseOptions);

    dbState.isConnected = true;
    dbState.host = conn.connection.host;
    dbState.name = conn.connection.name;

    // Detect if connected to a replica set (required for multi-document ACID transactions)
    try {
      if (env.MONGODB_URI.includes('+srv') || env.MONGODB_URI.includes('replicaSet')) {
        dbState.isReplicaSet = true;
      } else {
        const adminDb = conn.connection.db?.admin();
        if (adminDb) {
          const status = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);
          dbState.isReplicaSet = Boolean(status && status.ok === 1);
        }
      }
    } catch {
      dbState.isReplicaSet = false;
    }

    logger.info(
      `MongoDB connected successfully: [Host: ${dbState.host}] [Database: ${dbState.name}] [ReplicaSet: ${dbState.isReplicaSet}]`
    );

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime connection error:', err);
      dbState.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Reconnecting...');
      dbState.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB successfully reconnected.');
      dbState.isConnected = true;
    });
  } catch (error) {
    logger.error('Failed to establish initial MongoDB connection:', error);
    dbState.isConnected = false;
    // In production we throw to trigger process supervisor retry, in development we log clearly
    if (env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    logger.info('Closing MongoDB connection...');
    await mongoose.connection.close(false);
    dbState.isConnected = false;
    logger.info('MongoDB connection closed gracefully.');
  }
}
