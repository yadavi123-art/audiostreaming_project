/**
 * Validation Middleware using express-validator
 * Provides reusable validation rules for all endpoints
 */

import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

/**
 * Middleware to handle validation results
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : 'unknown',
      message: err.msg,
      value: err.type === 'field' ? err.value : undefined,
    }));

    throw new ValidationError('Validation failed', formattedErrors);
  }
  
  next();
};

/**
 * Sanitize HTML content to prevent XSS
 * Simple implementation that removes HTML tags and dangerous characters
 */
export const sanitizeInput = (value: string): string => {
  if (typeof value !== 'string') return value;
  
  // Remove HTML tags
  let sanitized = value.replace(/<[^>]*>/g, '');
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>\"']/g, '');
  
  return sanitized;
};

/**
 * Custom sanitizer for text fields
 */
const sanitizeTextField = (value: string): string => {
  if (typeof value !== 'string') return value;
  return sanitizeInput(value.trim());
};

// ============================================
// Authentication Validation Rules
// ============================================

export const validateRegister: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .customSanitizer(sanitizeTextField),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email is too long'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      // Only validate if confirmPassword is provided
      if (value && value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const validateLogin: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ============================================
// Configuration Validation Rules
// ============================================

export const validateConfiguration: ValidationChain[] = [
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'zh', 'ja', 'hi']).withMessage('Invalid language code'),
  
  body('learningPreferences.difficultyLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  
  body('learningPreferences.sessionDuration')
    .optional()
    .isInt({ min: 5, max: 120 }).withMessage('Session duration must be between 5 and 120 minutes'),
  
  body('learningPreferences.focusAreas')
    .optional()
    .isArray().withMessage('Focus areas must be an array')
    .custom((value) => value.every((item: any) => typeof item === 'string'))
    .withMessage('Focus areas must be an array of strings'),
  
  body('aiPersonality.tone')
    .optional()
    .isIn(['friendly', 'professional', 'casual', 'formal']).withMessage('Invalid tone'),
  
  body('aiPersonality.verbosity')
    .optional()
    .isIn(['concise', 'moderate', 'detailed']).withMessage('Invalid verbosity level'),
  
  body('aiPersonality.teachingStyle')
    .optional()
    .isIn(['socratic', 'direct', 'storytelling', 'example-based']).withMessage('Invalid teaching style'),
  
  body('accessibility.textSize')
    .optional()
    .isIn(['small', 'medium', 'large', 'extra-large']).withMessage('Invalid text size'),
  
  body('accessibility.highContrast')
    .optional()
    .isBoolean().withMessage('High contrast must be a boolean'),
  
  body('accessibility.screenReader')
    .optional()
    .isBoolean().withMessage('Screen reader must be a boolean'),
  
  body('notifications.email')
    .optional()
    .isBoolean().withMessage('Email notification must be a boolean'),
  
  body('notifications.push')
    .optional()
    .isBoolean().withMessage('Push notification must be a boolean'),
  
  body('notifications.progressUpdates')
    .optional()
    .isBoolean().withMessage('Progress updates must be a boolean'),
];

// ============================================
// Discussion Validation Rules
// ============================================

export const validateCreateDiscussion: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters')
    .customSanitizer(sanitizeTextField),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters')
    .customSanitizer(sanitizeTextField),
  
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(['general', 'technical', 'language', 'culture', 'other']).withMessage('Invalid category'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((value) => value.every((tag: any) => typeof tag === 'string' && tag.length <= 50))
    .withMessage('Each tag must be a string with max 50 characters'),
];

export const validateAddComment: ValidationChain[] = [
  param('discussionId')
    .isMongoId().withMessage('Invalid discussion ID'),
  
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters')
    .customSanitizer(sanitizeTextField),
];

export const validateDiscussionId: ValidationChain[] = [
  param('discussionId')
    .isMongoId().withMessage('Invalid discussion ID'),
];

// ============================================
// Progress Validation Rules
// ============================================

export const validateLogProgress: ValidationChain[] = [
  body('activityType')
    .trim()
    .notEmpty().withMessage('Activity type is required')
    .isIn(['conversation', 'discussion', 'quiz', 'reading', 'listening', 'speaking', 'writing'])
    .withMessage('Invalid activity type'),
  
  body('duration')
    .isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  
  body('metadata.topic')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Topic is too long')
    .customSanitizer(sanitizeTextField),
  
  body('metadata.difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  
  body('metadata.score')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
];

export const validateSetGoal: ValidationChain[] = [
  body('type')
    .trim()
    .notEmpty().withMessage('Goal type is required')
    .isIn(['daily_minutes', 'weekly_sessions', 'skill_mastery', 'streak', 'custom'])
    .withMessage('Invalid goal type'),
  
  body('target')
    .isInt({ min: 1 }).withMessage('Target must be a positive integer'),
  
  body('deadline')
    .optional()
    .isISO8601().withMessage('Invalid deadline format')
    .toDate(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description is too long')
    .customSanitizer(sanitizeTextField),
];

export const validateAchievementId: ValidationChain[] = [
  param('achievementId')
    .isMongoId().withMessage('Invalid achievement ID'),
];

// ============================================
// Query Parameter Validation
// ============================================

export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
];

export const validateDateRange: ValidationChain[] = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format')
    .toDate(),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
    .toDate()
    .custom((value, { req }) => {
      if (req.query && req.query.startDate && value < new Date(req.query.startDate as string)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
];

// ============================================
// Conversation Validation Rules
// ============================================

export const validateConversationId: ValidationChain[] = [
  param('conversationId')
    .isMongoId().withMessage('Invalid conversation ID'),
];

export const validateMessageContent: ValidationChain[] = [
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ min: 1, max: 5000 }).withMessage('Message must be between 1 and 5000 characters')
    .customSanitizer(sanitizeTextField),
];
