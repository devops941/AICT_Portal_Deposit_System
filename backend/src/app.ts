import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { httpLogger } from './middleware/logging.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { errorHandler } from './middleware/error.middleware';
import routes from './routes';

const app: Application = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS for all allowed web clients (including localhost and Vercel domains)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request logging
app.use(httpLogger);

// Root ping and health check
app.get(['/', '/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'AICTE Security Deposit & FDR Lifecycle Backend API is running live',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', routes);
app.use('/', routes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
