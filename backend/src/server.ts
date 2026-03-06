import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import cluster from 'node:cluster';
import os from 'node:os';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import { authRoutes } from './routes/auth.js';
import { betRoutes } from './routes/bets.js';
import { walletRoutes } from './routes/wallet.js';
import { paymentRoutes } from './routes/payments.js';
import { adminRoutes } from './routes/admin.js';
import { roomRoutes } from './routes/rooms.js';
import { feedRoutes } from './routes/feed.js';
import { leaderboardRoutes } from './routes/leaderboard.js';
import { userRoutes } from './routes/users.js';
import { tipsterRoutes } from './routes/tipsters.js';
import { aiRoutes } from './routes/ai.js';
import bitcoinRoutes from './routes/bitcoin.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setSocketIO } from './controllers/betController.js';
import { setPaymentSocketIO } from './controllers/paymentController.js';
import { setSocketIO as setRoomSocketIO } from './controllers/roomController.js';
import { socketService } from './services/socketService.js';

// Environment configuration with validation
const getEnvVar = (key: string, defaultValue?: string, required = false): string | undefined => {
  const value = process.env[key] || defaultValue;
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is missing`);
  }
  return value;
};

const parsePort = (portStr: string | undefined, fallback: number): number => {
  const port = parseInt(portStr || fallback.toString(), 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${portStr}. Must be between 1 and 65535`);
  }
  return port;
};

// Configuration
const config = {
  port: parsePort(getEnvVar('PORT'), 5000),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),
  isProduction: getEnvVar('NODE_ENV') === 'production',
  isDevelopment: getEnvVar('NODE_ENV') !== 'production',
  rateLimitWindowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  rateLimitMaxRequests: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  enableClustering: getEnvVar('ENABLE_CLUSTERING', 'false') === 'true',
};

// Log configuration on startup
logger.info('='.repeat(80));
logger.info('🚀 P2P Betting Backend Server Starting');
logger.info('='.repeat(80));
logger.info(`Environment: ${config.nodeEnv}`);
logger.info(`Port: ${config.port}`);
logger.info(`Frontend URL: ${config.frontendUrl}`);
logger.info(`Process ID: ${process.pid}`);
logger.info(`Node Version: ${process.version}`);
logger.info(`Platform: ${os.platform()} ${os.arch()}`);
logger.info(`Clustering: ${config.enableClustering ? 'Enabled' : 'Disabled'}`);
logger.info('='.repeat(80));

// Clustering support
if (config.enableClustering && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  logger.info(`Master process ${process.pid} is running`);
  logger.info(`Forking ${numCPUs} workers...`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    logger.info('Starting a new worker...');
    cluster.fork();
  });
  
  process.on('SIGINT', () => {
    logger.info('Master process received SIGINT, shutting down gracefully...');
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill('SIGINT');
    }
    process.exit(0);
  });
  
  // Don't run the server in master process
  process.exit(0);
}

// Express app setup
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Inject Socket.io instance into controllers
setSocketIO(io);
setPaymentSocketIO(io);
setRoomSocketIO(io);

// Initialize enhanced socket service
socketService.initialize(io);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.isDevelopment ? 10000 : 100, // Much higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: config.isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(limiter);
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res: any, buf: Buffer) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    pid: process.pid,
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tipsters', tipsterRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/wallet/btc', bitcoinRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io stats endpoint
app.get('/api/socket/stats', (req, res) => {
  const stats = socketService.getStats();
  res.json({
    ...stats,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    server.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📱 Environment: ${config.nodeEnv}`);
      logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);
      logger.info(`💳 M-Pesa Environment: ${getEnvVar('MPESA_ENV', 'sandbox')}`);
      logger.info(`🔧 Process ID: ${process.pid}`);
      logger.info(`🎯 Ready to accept connections!`);
      logger.info('='.repeat(80));
    });
    
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export { app, io, config };
