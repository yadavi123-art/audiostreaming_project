import express from 'express';
import { protect } from '../middleware/auth';
import {
  getUserProgress,
  updateChapterProgress,
  recordQuizScore,
  updateStreak,
  getLeaderboard
} from '../controllers/progressController';
import {
  getDashboardStats,
  getSubjectWiseProgress,
  getWeeklyActivity
} from '../controllers/analyticsController';
import { validateLogProgress, validateSetGoal, handleValidationErrors } from '../middleware/validation';

const router = express.Router();

/**
 * Progress Routes
 */

// GET /api/progress/user - Get user's progress
router.get('/user', protect, getUserProgress);

// POST /api/progress/chapter - Update chapter/lesson progress
router.post('/chapter', protect, validateLogProgress, handleValidationErrors, updateChapterProgress);

// POST /api/progress/quiz - Record quiz score
router.post('/quiz', protect, validateLogProgress, handleValidationErrors, recordQuizScore);

// POST /api/progress/streak - Update learning streak
router.post('/streak', protect, updateStreak);

// GET /api/progress/leaderboard - Get leaderboard
router.get('/leaderboard', protect, getLeaderboard);

/**
 * Analytics Routes
 */

// GET /api/analytics/dashboard - Get dashboard statistics
router.get('/analytics/dashboard', protect, getDashboardStats);

// GET /api/analytics/subject-progress - Get subject-wise progress
router.get('/analytics/subject-progress', protect, getSubjectWiseProgress);

// GET /api/analytics/weekly-activity - Get weekly activity
router.get('/analytics/weekly-activity', protect, getWeeklyActivity);

export default router;
