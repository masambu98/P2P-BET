import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  statusCode?: number;
  userAgent?: string;
  ipAddress?: string;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private slowQueryThreshold = 1000; // ms
  private memoryThreshold = 100 * 1024 * 1024; // 100MB

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const requestId = this.generateRequestId();
      const startTime = Date.now();

      // Store initial metrics
      const metrics: PerformanceMetrics = {
        requestId,
        method: req.method,
        url: req.url,
        startTime,
        memoryUsage: process.memoryUsage(),
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      };

      this.metrics.set(requestId, metrics);

      // Add request ID to response headers
      res.setHeader('X-Request-ID', requestId);

      // Override res.end to capture completion
      const originalEnd = res.end;
      res.end = function(this: Response, ...args: any[]) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Update metrics
        metrics.endTime = endTime;
        metrics.duration = duration;
        metrics.statusCode = res.statusCode;

        // Log performance data
        performanceMonitor.logMetrics(metrics);

        // Call original end
        originalEnd.apply(this, args);
      };

      next();
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logMetrics(metrics: PerformanceMetrics) {
    const { duration, memoryUsage, method, url, statusCode } = metrics;

    // Log slow requests
    if (duration && duration > this.slowQueryThreshold) {
      logger.warn(`Slow request detected:`, {
        method,
        url,
        duration: `${duration}ms`,
        statusCode,
        requestId: metrics.requestId
      });
    }

    // Log memory usage
    if (memoryUsage && memoryUsage.heapUsed > this.memoryThreshold) {
      logger.warn(`High memory usage detected:`, {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        requestId: metrics.requestId
      });
    }

    // Performance metrics for monitoring
    logger.info('Request completed:', {
      requestId: metrics.requestId,
      method,
      url,
      duration: duration ? `${duration}ms` : 'unknown',
      statusCode,
      memoryUsage: memoryUsage ? `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB` : 'unknown'
    });
  }

  getMetrics(): {
    totalRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  } {
    const allMetrics = Array.from(this.metrics.values());
    const completedMetrics = allMetrics.filter(m => m.duration !== undefined);

    const totalRequests = completedMetrics.length;
    const averageResponseTime = totalRequests > 0 
      ? completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / totalRequests 
      : 0;
    const slowRequests = completedMetrics.filter(m => (m.duration || 0) > this.slowQueryThreshold).length;

    return {
      totalRequests,
      averageResponseTime,
      slowRequests,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  cleanup(): void {
    // Remove metrics older than 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [requestId, metrics] of this.metrics.entries()) {
      if (metrics.startTime < oneHourAgo) {
        this.metrics.delete(requestId);
      }
    }
  }
}

// Database query performance monitoring
export function queryPerformanceMonitor(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(...args: any[]) {
    const startTime = Date.now();
    
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - startTime;

      if (duration > 500) { // Log slow queries
        logger.warn(`Slow database query:`, {
          method: propertyName,
          duration: `${duration}ms`,
          args: args.length
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Database query failed:`, {
        method: propertyName,
        duration: `${duration}ms`,
        error: error.message
      });
      throw error;
    }
  };

  return descriptor;
}

// Cache middleware
export function cacheMiddleware(ttl: number = 300) { // 5 minutes default
  const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method}:${req.url}`;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data: any) {
      cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
      res.setHeader('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
}

// Rate limiting with performance tracking
export function performanceRateLimit(options: {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean up old entries
    for (const [ip, data] of requests.entries()) {
      if (data.resetTime < now) {
        requests.delete(ip);
      }
    }

    const requestData = requests.get(key);

    if (!requestData || requestData.resetTime < now) {
      requests.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return next();
    }

    if (requestData.count >= options.maxRequests) {
      logger.warn('Rate limit exceeded:', {
        ip: key,
        count: requestData.count,
        limit: options.maxRequests,
        url: req.url
      });

      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }

    requestData.count++;
    next();
  };
}

// Memory usage monitoring
export function memoryMonitor() {
  return (req: Request, res: Response, next: NextFunction) => {
    const memoryBefore = process.memoryUsage();

    res.on('finish', () => {
      const memoryAfter = process.memoryUsage();
      const memoryDiff = memoryAfter.heapUsed - memoryBefore.heapUsed;

      if (Math.abs(memoryDiff) > 10 * 1024 * 1024) { // 10MB threshold
        logger.info('Memory usage change:', {
          url: req.url,
          method: req.method,
          before: `${Math.round(memoryBefore.heapUsed / 1024 / 1024)}MB`,
          after: `${Math.round(memoryAfter.heapUsed / 1024 / 1024)}MB`,
          diff: `${Math.round(memoryDiff / 1024 / 1024)}MB`
        });
      }
    });

    next();
  };
}

// Compression middleware for large responses
export function compressionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      const dataSize = JSON.stringify(data).length;
      
      // Add compression info for large responses
      if (dataSize > 1024 * 1024) { // 1MB
        res.setHeader('X-Content-Size', `${dataSize}`);
        res.setHeader('X-Compression-Recommended', 'true');
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

export const performanceMonitor = new PerformanceMonitor();

// Cleanup old metrics every 5 minutes
setInterval(() => {
  performanceMonitor.cleanup();
}, 5 * 60 * 1000);
