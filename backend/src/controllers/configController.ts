/**
 * Configuration Controller
 * Handles user configuration management and AI personality settings
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import UserConfiguration, { IUserConfiguration } from '../models/UserConfiguration';
import { 
  getAllPersonalities, 
  getPersonalityById, 
  isValidPersonalityId,
  getDefaultPersonality 
} from '../utils/aiPersonality';

/**
 * Get user configuration
 * GET /api/config/user
 */
export const getUserConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Find user configuration
    const config = await UserConfiguration.findOne({ userId });

    if (!config) {
      res.status(404).json({
        success: false,
        message: 'User configuration not found. Please complete setup first.'
      });
      return;
    }

    // Get user details
    const user = await User.findById(userId).select('name email');

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user?._id,
          name: user?.name,
          email: user?.email
        },
        configuration: {
          aiPersonality: config.aiPersonality,
          learningPreferences: config.learningPreferences,
          accessibilitySettings: config.accessibilitySettings,
          theme: config.theme,
          language: config.language,
          timezone: config.timezone,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Setup initial user configuration
 * POST /api/config/setup
 */
export const setupConfiguration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Check if configuration already exists
    const existingConfig = await UserConfiguration.findOne({ userId });
    if (existingConfig) {
      res.status(400).json({
        success: false,
        message: 'User configuration already exists. Use update endpoint instead.'
      });
      return;
    }

    // Extract configuration from request body
    const {
      aiPersonality,
      learningPreferences,
      accessibilitySettings,
      theme,
      language,
      timezone
    } = req.body;

    // Create new configuration with defaults
    const config = new UserConfiguration({
      userId,
      aiPersonality: aiPersonality || {},
      learningPreferences: learningPreferences || {},
      accessibilitySettings: accessibilitySettings || {},
      theme: theme || 'auto',
      language: language || 'en',
      timezone: timezone || 'UTC'
    });

    await config.save();

    res.status(201).json({
      success: true,
      message: 'Configuration setup completed successfully',
      data: {
        configuration: {
          aiPersonality: config.aiPersonality,
          learningPreferences: config.learningPreferences,
          accessibilitySettings: config.accessibilitySettings,
          theme: config.theme,
          language: config.language,
          timezone: config.timezone
        }
      }
    });
  } catch (error) {
    console.error('Error setting up configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update user configuration
 * PUT /api/config/update
 */
export const updateConfiguration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Find existing configuration
    const config = await UserConfiguration.findOne({ userId });

    if (!config) {
      res.status(404).json({
        success: false,
        message: 'User configuration not found. Please complete setup first.'
      });
      return;
    }

    // Update allowed fields
    const {
      aiPersonality,
      learningPreferences,
      accessibilitySettings,
      theme,
      language,
      timezone
    } = req.body;

    let updateCount = 0;

    if (aiPersonality !== undefined) {
      config.aiPersonality = { ...config.aiPersonality, ...aiPersonality };
      updateCount++;
    }

    if (learningPreferences !== undefined) {
      config.learningPreferences = { ...config.learningPreferences, ...learningPreferences };
      updateCount++;
    }

    if (accessibilitySettings !== undefined) {
      config.accessibilitySettings = { ...config.accessibilitySettings, ...accessibilitySettings };
      updateCount++;
    }

    if (theme !== undefined) {
      config.theme = theme;
      updateCount++;
    }

    if (language !== undefined) {
      config.language = language;
      updateCount++;
    }

    if (timezone !== undefined) {
      config.timezone = timezone;
      updateCount++;
    }

    if (updateCount === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
      return;
    }

    await config.save();

    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: {
        configuration: {
          aiPersonality: config.aiPersonality,
          learningPreferences: config.learningPreferences,
          accessibilitySettings: config.accessibilitySettings,
          theme: config.theme,
          language: config.language,
          timezone: config.timezone,
          updatedAt: config.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all available AI personalities
 * GET /api/config/ai-personalities
 */
export const getAIPersonalities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const personalities = getAllPersonalities();

    // Get user's current personality settings if authenticated
    let currentPersonalitySettings = null;
    if (req.user?._id) {
      const config = await UserConfiguration.findOne({ userId: req.user._id });
      if (config) {
        currentPersonalitySettings = config.aiPersonality;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        personalities: personalities.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          icon: p.icon,
          characteristics: p.characteristics
        })),
        currentPersonalitySettings
      }
    });
  } catch (error) {
    console.error('Error fetching AI personalities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI personalities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a specific AI personality details
 * GET /api/config/ai-personalities/:id
 */
export const getAIPersonalityDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const personality = getPersonalityById(id);

    if (!personality) {
      res.status(404).json({
        success: false,
        message: 'AI personality not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        personality: {
          id: personality.id,
          name: personality.name,
          description: personality.description,
          icon: personality.icon,
          characteristics: personality.characteristics,
          greetingMessage: personality.greetingMessage
        }
      }
    });
  } catch (error) {
    console.error('Error fetching AI personality details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI personality details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
