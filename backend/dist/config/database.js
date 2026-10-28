"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbState = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("./logger");
exports.dbState = {
    isConnected: false,
    isReplicaSet: false,
    host: '',
    name: '',
};
async function connectDatabase() {
    if (mongoose_1.default.connection.readyState >= 1) {
        exports.dbState.isConnected = true;
        return;
    }
    const mongooseOptions = {
        autoIndex: env_1.env.NODE_ENV !== 'production',
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };
    try {
        logger_1.logger.info(`Connecting to MongoDB at: ${env_1.env.MONGODB_URI.replace(/:\/\/[^@]*@/, '://***:***@')}`);
        const conn = await mongoose_1.default.connect(env_1.env.MONGODB_URI, mongooseOptions);
        exports.dbState.isConnected = true;
        exports.dbState.host = conn.connection.host;
        exports.dbState.name = conn.connection.name;
        try {
            if (env_1.env.MONGODB_URI.includes('+srv') || env_1.env.MONGODB_URI.includes('replicaSet')) {
                exports.dbState.isReplicaSet = true;
            }
            else {
                const adminDb = conn.connection.db?.admin();
                if (adminDb) {
                    const status = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);
                    exports.dbState.isReplicaSet = Boolean(status && status.ok === 1);
                }
            }
        }
        catch {
            exports.dbState.isReplicaSet = false;
        }
        logger_1.logger.info(`MongoDB connected successfully: [Host: ${exports.dbState.host}] [Database: ${exports.dbState.name}] [ReplicaSet: ${exports.dbState.isReplicaSet}]`);
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.logger.error('MongoDB runtime connection error:', err);
            exports.dbState.isConnected = false;
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB connection lost. Reconnecting...');
            exports.dbState.isConnected = false;
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.logger.info('MongoDB successfully reconnected.');
            exports.dbState.isConnected = true;
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to establish initial MongoDB connection:', error);
        exports.dbState.isConnected = false;
        if (env_1.env.NODE_ENV === 'production') {
            throw error;
        }
    }
}
async function disconnectDatabase() {
    if (mongoose_1.default.connection.readyState !== 0) {
        logger_1.logger.info('Closing MongoDB connection...');
        await mongoose_1.default.connection.close(false);
        exports.dbState.isConnected = false;
        logger_1.logger.info('MongoDB connection closed gracefully.');
    }
}
