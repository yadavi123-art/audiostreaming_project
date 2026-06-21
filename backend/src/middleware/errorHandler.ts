/**
 * Global Error Handler Middleware
 * Centralized error handling for the application
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import logger, { logError } from '../config/logger';
import mongoose from 'mongoose';

/**
 * Development error response - includes stack trace
 */
const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack,
      ...(err instanceof ValidationError && { errors: err.errors }),
    },
  });
};

/**
 * Production error response - sanitized for security
 */
const sendErrorProd = (err: AppError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        ...(err instanceof ValidationError && { errors: err.errors }),
      },
    });
  } else {
    // Programming or unknown error: don't leak error details
    logger.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      error: {
        message: 'Something went wrong',
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
};

/**
 * Handle Mongoose Cast Error (invalid ObjectId)
 */
const handleCastErrorDB = (err: mongoose.Error.CastError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, true, 'INVALID_ID');
};

/**
 * Handle Mongoose Duplicate Key Error
 */
const handleDuplicateFieldsDB = (err: any): AppError => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} = '${value}'. Please use another value.`;
  return new AppError(message, 409, true, 'DUPLICATE_FIELD');
};

/**
 * Handle Mongoose Validation Error
 */
const handleValidationErrorDB = (err: mongoose.Error.ValidationError): ValidationError => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message,
  }));
  return new ValidationError('Invalid input data', errors);
};

/**
 * Handle JWT Invalid Token Error
 */
const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again.', 401, true, 'INVALID_TOKEN');
};

/**
 * Handle JWT Expired Token Error
 */
const handleJWTExpiredError = (): AppError => {
  return new AppError('Your token has expired. Please log in again.', 401, true, 'TOKEN_EXPIRED');
};

/**
 * Handle Express Rate Limit Error
 */
const handleRateLimitError = (): AppError => {
  return new AppError(
    'Too many requests from this IP, please try again later.',
    429,
    true,
    'RATE_LIMIT_EXCEEDED'
  );
};

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  logError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).userId,
  });

  // Convert error to AppError if it isn't already
  let error = err instanceof AppError ? err : new AppError(err.message, 500, false);

  // Handle specific error types
  if (err.name === 'CastError' && err instanceof mongoose.Error.CastError) {
    error = handleCastErrorDB(err);
  }
  
  if ((err as any).code === 11000) {
    error = handleDuplicateFieldsDB(err);
  }
  
  if (err.name === 'ValidationError' && err instanceof mongoose.Error.ValidationError) {
    error = handleValidationErrorDB(err);
  }
  
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  if (err.message && err.message.includes('Too many requests')) {
    error = handleRateLimitError();
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * Async error wrapper - catches async errors and passes to error handler
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `Cannot find ${req.originalUrl} on this server`,
    404,
    true,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Unhandled Rejection Handler
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason: Error) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
      reason: reason.message,
      stack: reason.stack,
    });
    process.exit(1);
  });
};

/**
 * Uncaught Exception Handler
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
};
