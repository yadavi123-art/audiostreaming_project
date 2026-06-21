/**
 * Security Middleware
 * Additional security measures including rate limiting, CSRF protection, etc.
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/errors';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many requests from this IP, please try again later.');
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many authentication attempts, please try again later.');
  },
});

/**
 * Rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many password reset attempts, please try again later.');
  },
});

/**
 * Rate limiter for AI interactions
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 AI requests per minute
  message: 'Too many AI requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many AI requests, please slow down.');
  },
});

/**
 * Rate limiter for discussion creation
 */
export const discussionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 discussion creations per hour
  message: 'Too many discussions created, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many discussions created, please try again later.');
  },
});

/**
 * Middleware to sanitize request body
 * Removes potentially dangerous properties
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    // Remove __proto__, constructor, and prototype properties
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    
    const sanitize = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      
      const sanitized: any = {};
      for (const key in obj) {
        if (dangerousKeys.includes(key)) continue;
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    };
    
    req.body = sanitize(req.body);
  }
  next();
};

/**
 * Middleware to prevent parameter pollution
 */
export const preventParameterPollution = (req: Request, res: Response, next: NextFunction) => {
  // Convert array parameters to single values (use last value)
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = (req.query[key] as string[])[req.query[key].length - 1];
      }
    }
  }
  next();
};

/**
 * Middleware to add security headers
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Middleware to validate content type for POST/PUT/PATCH requests
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return res.status(415).json({
        success: false,
        error: {
          message: 'Unsupported Media Type. Please use application/json',
          code: 'UNSUPPORTED_MEDIA_TYPE',
        },
      });
    }
  }
  next();
};

/**
 * Middleware to log suspicious activity
 */
export const logSuspiciousActivity = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i, // Path traversal
    /(union.*select|insert.*into|drop.*table)/i, // SQL injection
    /(<script|javascript:|onerror=|onload=)/i, // XSS
    /(eval\(|exec\(|system\()/i, // Code injection
  ];
  
  const checkString = (str: string): boolean => {
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };
  
  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') return checkString(obj);
    if (typeof obj !== 'object' || obj === null) return false;
    
    return Object.values(obj).some(value => checkObject(value));
  };
  
  // Check URL, query params, and body
  const isSuspicious = 
    checkString(req.url) ||
    checkObject(req.query) ||
    checkObject(req.body);
  
  if (isSuspicious) {
    console.warn('⚠️  Suspicious activity detected:', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('user-agent'),
    });
  }
  
  next();
};

/**
 * CSRF Token validation middleware (for form submissions)
 */
export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF validation for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip for API endpoints with JWT authentication
  if (req.headers.authorization) {
    return next();
  }
  
  const token = req.body._csrf || req.headers['x-csrf-token'];
  const sessionToken = (req as any).session?.csrfToken;
  
  if (!token || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Invalid CSRF token',
        code: 'INVALID_CSRF_TOKEN',
      },
    });
  }
  
  next();
};

/**
 * Middleware to enforce HTTPS in production
 */
export const enforceHTTPS = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

/**
 * Middleware to limit request body size
 */
export const limitRequestSize = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          success: false,
          error: {
            message: 'Request entity too large',
            code: 'PAYLOAD_TOO_LARGE',
          },
        });
      }
    }
    
    next();
  };
};

/**
 * Helper function to parse size string to bytes
 */
const parseSize = (size: string): number => {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  return value * (units[unit] || 1);
};
