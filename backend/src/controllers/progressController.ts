import { Response } from 'express';
import Progress, { IProgress, IQuizScore, ITopicProgress } from '../models/Progress';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Get user progress
 * GET /api/progress/user
 */
export const getUserProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Find or create progress document
    let progress = await Progress.findOne({ userId });

    if (!progress) {
      progress = new Progress({
        userId,
        totalLessonsCompleted: 0,
        totalQuizzesTaken: 0,
        totalTimeSpent: 0,
        overallAverageScore: 0,
        level: 1,
        experiencePoints: 0,
        quizScores: [],
        achievements: [],
        achievementCount: 0,
        learningStreak: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          streakStartDate: new Date()
        },
        topicProgress: [],
        lastActivityAt: new Date()
      });
      await progress.save();
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update chapter progress (lesson completion)
 * POST /api/progress/chapter
 * Body: { topic, totalLessons, timeSpent }
 */
export const updateChapterProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { topic, totalLessons, timeSpent } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate required fields
    if (!topic) {
      res.status(400).json({
        success: false,
        message: 'topic is required'
      });
      return;
    }

    // Find or create progress document
    let progress = await Progress.findOne({ userId });

    if (!progress) {
      progress = new Progress({
        userId,
        totalLessonsCompleted: 0,
        totalQuizzesTaken: 0,
        totalTimeSpent: 0,
        overallAverageScore: 0,
        level: 1,
        experiencePoints: 0,
        quizScores: [],
        achievements: [],
        achievementCount: 0,
        learningStreak: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          streakStartDate: new Date()
        },
        topicProgress: [],
        lastActivityAt: new Date()
      });
    }

    // Check if topic exists in progress
    const topicIndex = progress.topicProgress.findIndex((t: ITopicProgress) => t.topic === topic);

    if (topicIndex > -1) {
      // Update existing topic - complete a lesson
      await progress.completeLesson(topic, timeSpent || 0);
    } else {
      // Add new topic
      const newTopic: Partial<ITopicProgress> = {
        topic,
        totalLessons: totalLessons || 10,
        lessonsCompleted: 1,
        quizzesTaken: 0,
        averageScore: 0,
        timeSpent: timeSpent || 0,
        lastAccessedAt: new Date(),
        status: 'in-progress'
      };
      
      progress.topicProgress.push(newTopic as ITopicProgress);
      progress.totalLessonsCompleted += 1;
      progress.totalTimeSpent += timeSpent || 0;
      progress.experiencePoints += 25;
      progress.lastActivityAt = new Date();
      await progress.save();
    }

    res.status(200).json({
      success: true,
      message: 'Chapter progress updated successfully',
      data: progress
    });
  } catch (error) {
    console.error('Error updating chapter progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chapter progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Record quiz score
 * POST /api/progress/quiz
 * Body: { quizId, quizTitle, topic, score, totalQuestions, timeSpent, answers }
 */
export const recordQuizScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { quizId, quizTitle, topic, score, totalQuestions, timeSpent, answers } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate required fields
    if (!quizId || !quizTitle || !topic || score === undefined || !totalQuestions) {
      res.status(400).json({
        success: false,
        message: 'quizId, quizTitle, topic, score, and totalQuestions are required'
      });
      return;
    }

    // Validate score
    if (typeof score !== 'number' || score < 0 || score > totalQuestions) {
      res.status(400).json({
        success: false,
        message: 'Invalid score value'
      });
      return;
    }

    // Find or create progress document
    let progress = await Progress.findOne({ userId });

    if (!progress) {
      progress = new Progress({
        userId,
        totalLessonsCompleted: 0,
        totalQuizzesTaken: 0,
        totalTimeSpent: 0,
        overallAverageScore: 0,
        level: 1,
        experiencePoints: 0,
        quizScores: [],
        achievements: [],
        achievementCount: 0,
        learningStreak: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          streakStartDate: new Date()
        },
        topicProgress: [],
        lastActivityAt: new Date()
      });
    }

    // Calculate percentage
    const percentage = (score / totalQuestions) * 100;

    // Add quiz score using the model method
    const quizScore: Partial<IQuizScore> = {
      quizId,
      quizTitle,
      topic,
      score,
      totalQuestions,
      percentage,
      timeSpent: timeSpent || 0,
      completedAt: new Date(),
      answers: answers || []
    };

    await progress.addQuizScore(quizScore);

    res.status(200).json({
      success: true,
      message: 'Quiz score recorded successfully',
      data: {
        quizScore,
        progress
      }
    });
  } catch (error) {
    console.error('Error recording quiz score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record quiz score',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update user streak
 * POST /api/progress/streak
 */
export const updateStreak = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Find or create progress document
    let progress = await Progress.findOne({ userId });

    if (!progress) {
      progress = new Progress({
        userId,
        totalLessonsCompleted: 0,
        totalQuizzesTaken: 0,
        totalTimeSpent: 0,
        overallAverageScore: 0,
        level: 1,
        experiencePoints: 0,
        quizScores: [],
        achievements: [],
        achievementCount: 0,
        learningStreak: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          streakStartDate: new Date()
        },
        topicProgress: [],
        lastActivityAt: new Date()
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = new Date(progress.learningStreak.lastActivityDate);
    lastActive.setHours(0, 0, 0, 0);

    const daysDifference = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDifference === 0) {
      // Same day, no change to streak
      res.status(200).json({
        success: true,
        message: 'Streak already updated today',
        data: {
          currentStreak: progress.learningStreak.currentStreak,
          longestStreak: progress.learningStreak.longestStreak
        }
      });
      return;
    } else if (daysDifference === 1) {
      // Consecutive day, increment streak
      progress.learningStreak.currentStreak += 1;
      
      if (progress.learningStreak.currentStreak > progress.learningStreak.longestStreak) {
        progress.learningStreak.longestStreak = progress.learningStreak.currentStreak;
      }
    } else {
      // Streak broken, reset to 1
      progress.learningStreak.currentStreak = 1;
      progress.learningStreak.streakStartDate = new Date();
    }

    progress.learningStreak.lastActivityDate = new Date();
    progress.lastActivityAt = new Date();
    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Streak updated successfully',
      data: {
        currentStreak: progress.learningStreak.currentStreak,
        longestStreak: progress.learningStreak.longestStreak,
        streakBroken: daysDifference > 1
      }
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update streak',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get leaderboard
 * GET /api/progress/leaderboard
 * Query params: ?limit=10&sortBy=streak|lessons|quizAverage|level
 */
export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'level';

    // Validate limit
    if (limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100'
      });
      return;
    }

    // Determine sort criteria
    let sortCriteria: any = {};
    
    switch (sortBy) {
      case 'lessons':
        sortCriteria = { totalLessonsCompleted: -1 };
        break;
      case 'quizAverage':
        sortCriteria = { overallAverageScore: -1 };
        break;
      case 'streak':
        sortCriteria = { 'learningStreak.currentStreak': -1, 'learningStreak.longestStreak': -1 };
        break;
      case 'level':
      default:
        sortCriteria = { level: -1, experiencePoints: -1 };
        break;
    }

    // Fetch leaderboard data
    const leaderboardData = await Progress.find()
      .sort(sortCriteria)
      .limit(limit)
      .select('userId level experiencePoints totalLessonsCompleted totalQuizzesTaken overallAverageScore learningStreak totalTimeSpent');

    // Populate user information
    const leaderboard = await Promise.all(
      leaderboardData.map(async (progress: IProgress, index: number) => {
        const user = await User.findById(progress.userId).select('name email avatar');
        
        return {
          rank: index + 1,
          userId: progress.userId,
          userName: user?.name || 'Unknown User',
          userAvatar: user?.avatar || null,
          level: progress.level,
          experiencePoints: progress.experiencePoints,
          currentStreak: progress.learningStreak.currentStreak,
          longestStreak: progress.learningStreak.longestStreak,
          lessonsCompleted: progress.totalLessonsCompleted,
          quizzesTaken: progress.totalQuizzesTaken,
          averageQuizScore: Math.round(progress.overallAverageScore * 100) / 100,
          totalTimeSpent: progress.totalTimeSpent
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        sortBy,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
