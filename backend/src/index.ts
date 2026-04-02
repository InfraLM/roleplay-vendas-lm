import './types/express.d';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { corsOptions } from './config/cors';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

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

// Start server
const PORT = parseInt(env.PORT);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

export default app;
