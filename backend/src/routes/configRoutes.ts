/**
 * Configuration Routes
 * Defines all routes for user configuration and AI personality management
 */

import express from 'express';
import { protect } from '../middleware/auth';
import {
  getUserConfig,
  setupConfiguration,
  updateConfiguration,
  getAIPersonalities,
  getAIPersonalityDetails
} from '../controllers/configController';
import { validateConfiguration, handleValidationErrors } from '../middleware/validation';

const router = express.Router();

/**
 * @route   GET /api/config/user
 * @desc    Get user configuration
 * @access  Private
 */
router.get('/user', protect, getUserConfig);

/**
 * @route   POST /api/config/setup
 * @desc    Setup initial user configuration
 * @access  Private
 */
router.post('/setup', protect, validateConfiguration, handleValidationErrors, setupConfiguration);

/**
 * @route   PUT /api/config/update
 * @desc    Update user configuration
 * @access  Private
 */
router.put('/update', protect, validateConfiguration, handleValidationErrors, updateConfiguration);

/**
 * @route   GET /api/config/ai-personalities
 * @desc    Get all available AI personalities
 * @access  Public (but shows current if authenticated)
 */
router.get('/ai-personalities', getAIPersonalities);

/**
 * @route   GET /api/config/ai-personalities/:id
 * @desc    Get specific AI personality details
 * @access  Public
 */
router.get('/ai-personalities/:id', getAIPersonalityDetails);

export default router;
