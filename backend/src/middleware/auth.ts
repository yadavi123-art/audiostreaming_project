import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

/**
 * Extended Express Request interface with authenticated user
 */
export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 * Extracts token from Authorization header (Bearer token format)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise<void>
 * @throws Returns 401 if no token provided or invalid token
 * @throws Returns 404 if user not found
 * @example
 * router.get('/protected', protect, controller.handler);
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Debug logging (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Auth Debug:', {
        hasAuthHeader: !!req.headers.authorization,
        authHeader: req.headers.authorization,
        extractedToken: token ? `${token.substring(0, 20)}...` : 'undefined',
        path: req.path,
        method: req.method
      });
    }

    // Check if token exists
    if (!token || token === 'undefined') {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
        details: process.env.NODE_ENV !== 'production' ? {
          message: 'No valid token provided',
          authHeader: req.headers.authorization
        } : undefined
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
        id: string;
      };

      // Get user from database (password is excluded by default in schema)
      const user = await User.findById(decoded.id);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found',
          details: process.env.NODE_ENV !== 'production' ? {
            message: 'Token is valid but user does not exist in database',
            userId: decoded.id
          } : undefined
        });
        return;
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
        details: process.env.NODE_ENV !== 'production' ? {
          message: 'Token verification failed',
          error: errorMessage
        } : undefined
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error in authentication'
    });
    return;
  }
};

/**
 * Authorization middleware factory - checks if user has required role(s)
 * Must be used after the protect middleware
 * @param roles - Variable number of allowed role strings
 * @returns Express middleware function
 * @throws Returns 401 if user not authenticated
 * @throws Returns 403 if user role not authorized
 * @example
 * router.delete('/admin', protect, authorize('admin'), controller.handler);
 * router.post('/content', protect, authorize('admin', 'moderator'), controller.handler);
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`
      });
      return;
    }

    next();
  };
};
