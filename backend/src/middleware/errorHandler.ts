import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
    return;
  }

  if (error.name === 'UnauthorizedError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
    return;
  }

  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: 'Invalid Token',
      message: 'Authentication token is invalid'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Token Expired',
      message: 'Authentication token has expired'
    });
    return;
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json({
          error: 'Duplicate Entry',
          message: 'A record with this value already exists'
        });
        return;
      case 'P2025':
        res.status(404).json({
          error: 'Not Found',
          message: 'Record not found'
        });
        return;
      default:
        res.status(500).json({
          error: 'Database Error',
          message: 'An error occurred while processing your request'
        });
        return;
    }
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
};
