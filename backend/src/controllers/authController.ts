import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import UserConfiguration from '../models/UserConfiguration';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../middleware/errorHandler';
import { ConflictError, AuthenticationError, NotFoundError, BadRequestError } from '../utils/errors';
import logger from '../config/logger';

/**
 * Generate JWT token
 */
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const expiresIn: string = process.env.JWT_EXPIRE || '7d';
  
  return jwt.sign({ id: userId }, secret, { expiresIn } as SignOptions);
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role } = req.body;

  // Check for existing user
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Create user (password will be hashed by pre-save middleware)
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    name,
    role: role || 'student'
  });

  // Create default user configuration
  await UserConfiguration.create({
    userId: user._id,
    language: 'en',
    theme: 'light',
    timezone: 'UTC',
    aiPersonality: {
      tone: 'friendly',
      verbosity: 'moderate',
      teachingStyle: 'mixed',
      encouragementLevel: 'moderate',
      humorLevel: 'light'
    },
    learningPreferences: {
      preferredLanguages: ['JavaScript'],
      difficultyLevel: 'beginner',
      learningPace: 'moderate',
      focusAreas: [],
      notificationPreferences: {
        email: true,
        push: false,
        dailyReminders: false,
        weeklyProgress: true
      },
      studySchedule: {
        preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        preferredTimeSlots: ['evening']
      }
    },
    accessibilitySettings: {
      fontSize: 'medium',
      highContrast: false,
      screenReader: false,
      keyboardNavigation: false,
      reducedMotion: false
    }
  });

  // Generate JWT token
  const token = generateToken(user._id.toString());

  logger.info('User registered successfully', { userId: user._id, email: user.email });

  // Send response (password excluded by toJSON transform)
  res.status(201).json({
    success: true,
    data: {
      user,
      token
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Find user by email and include password field
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated. Please contact support.');
  }

  // Compare passwords
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken(user._id.toString());

  logger.info('User logged in successfully', { userId: user._id, email: user.email });

  // Remove password from response
  const userObject = user.toJSON();

  res.status(200).json({
    success: true,
    data: {
      user: userObject,
      token
    }
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  // User is already attached to request by protect middleware
  const user = await User.findById(req.user?._id)
    .populate('configuration')
    .populate('progress');

  if (!user) {
    throw new NotFoundError('User');
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, avatar } = req.body;

  // Find user
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new NotFoundError('User');
  }

  // Update fields
  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  logger.info('User profile updated', { userId: user._id });

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const changePassword = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Please provide current password and new password');
  }

  // Validate new password length
  if (newPassword.length < 8) {
    throw new BadRequestError('New password must be at least 8 characters long');
  }

  // Find user with password
  const user = await User.findById(req.user?._id).select('+password');

  if (!user) {
    throw new NotFoundError('User');
  }

  // Verify current password
  const isPasswordMatch = await user.comparePassword(currentPassword);

  if (!isPasswordMatch) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Update password (will be hashed by pre-save middleware)
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = generateToken(user._id.toString());

  logger.info('User password changed', { userId: user._id });

  res.status(200).json({
    success: true,
    data: {
      message: 'Password updated successfully',
      token
    }
  });
});
