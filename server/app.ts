/// <reference path="./types/express.d.ts" />
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

// Trust proxy (required for Vercel/reverse proxy - fixes X-Forwarded-For and rate limiting)
app.set('trust proxy', 1);

// CORS must come before helmet to handle preflight OPTIONS
app.use(cors(corsOptions));
app.use(helmet());

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use('/api', generalLimiter);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

export default app;
