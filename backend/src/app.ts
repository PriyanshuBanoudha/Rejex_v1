import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import teamRoutes from './routes/teamRoutes';
import projectRoutes from './routes/projectRoutes';
import judgingRoutes from './routes/judgingRoutes';
import galleryRoutes from './routes/galleryRoutes';
import exportRoutes from './routes/exportRoutes';
import certRoutes from './routes/certRoutes';
import pairwiseRoutes from './routes/pairwiseRoutes';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import { apiLimiter } from './middleware/rateLimiterMiddleware';

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check (no rate limit)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/judging', judgingRoutes);
app.use('/api', galleryRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/certs', certRoutes);
app.use('/api/pairwise', pairwiseRoutes);

// OpenAPI spec (minimal)
app.get('/api/openapi.json', (_req, res) => {
  res.json({
    openapi: '3.0.0',
    info: { title: 'Hackathon Raptors API', version: '1.0.0', description: 'Self-hostable hackathon platform API' },
    servers: [{ url: '/api' }],
    paths: {
      '/auth/register': { post: { summary: 'Register a new user', tags: ['Auth'] } },
      '/auth/login': { post: { summary: 'Login', tags: ['Auth'] } },
      '/events': { get: { summary: 'List events', tags: ['Events'] }, post: { summary: 'Create event', tags: ['Events'] } },
      '/teams': { post: { summary: 'Create team', tags: ['Teams'] } },
      '/projects': { post: { summary: 'Create project', tags: ['Projects'] } },
      '/judging/scores': { post: { summary: 'Submit score', tags: ['Judging'] } },
      '/gallery/{eventId}': { get: { summary: 'Get public gallery', tags: ['Gallery'] } },
      '/votes': { post: { summary: 'Cast vote', tags: ['Voting'] } },
    },
  });
});

// 404
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;
