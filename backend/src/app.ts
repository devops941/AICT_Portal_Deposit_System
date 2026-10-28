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

// Enable CORS
app.use(
  cors({
    origin: env.CLIENT_URL,
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

// API Routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
