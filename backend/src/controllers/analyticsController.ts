import { Response } from 'express';
import Progress, { IProgress, IQuizScore, ITopicProgress } from '../models/Progress';
import { AuthRequest } from '../middleware/auth';

/**
 * Get dashboard statistics
 * GET /api/analytics/dashboard
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Find user progress
    const progress = await Progress.findOne({ userId });

    if (!progress) {
      res.status(200).json({
        success: true,
        data: {
          totalTimeSpent: 0,
          lessonsCompleted: 0,
          quizzesTaken: 0,
          averageQuizScore: 0,
          currentStreak: 0,
          longestStreak: 0,
          level: 1,
          experiencePoints: 0,
          achievementCount: 0,
          topicsInProgress: 0,
          topicsCompleted: 0
        }
      });
      return;
    }

    // Calculate topics statistics
    const topicsInProgress = progress.topicProgress.filter(
      (t: ITopicProgress) => t.status === 'in-progress'
    ).length;

    const topicsCompleted = progress.topicProgress.filter(
      (t: ITopicProgress) => t.status === 'completed'
    ).length;

    // Format time spent (convert seconds to hours and minutes)
    const hours = Math.floor(progress.totalTimeSpent / 3600);
    const minutes = Math.floor((progress.totalTimeSpent % 3600) / 60);

    const dashboardStats = {
      totalTimeSpent: progress.totalTimeSpent,
      totalTimeSpentFormatted: `${hours}h ${minutes}m`,
      lessonsCompleted: progress.totalLessonsCompleted,
      quizzesTaken: progress.totalQuizzesTaken,
      averageQuizScore: Math.round(progress.overallAverageScore * 100) / 100,
      currentStreak: progress.learningStreak.currentStreak,
      longestStreak: progress.learningStreak.longestStreak,
      level: progress.level,
      experiencePoints: progress.experiencePoints,
      achievementCount: progress.achievementCount,
      topicsInProgress,
      topicsCompleted,
      totalTopics: progress.topicProgress.length,
      lastActivityAt: progress.lastActivityAt
    };

    res.status(200).json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get subject-wise (topic-wise) progress
 * GET /api/analytics/subject-progress
 */
export const getSubjectWiseProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Find user progress
    const progress = await Progress.findOne({ userId });

    if (!progress || progress.topicProgress.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          subjects: []
        }
      });
      return;
    }

    // Format topic progress data
    const subjects = progress.topicProgress.map((topic: ITopicProgress) => {
      const completionPercentage = Math.round(
        (topic.lessonsCompleted / topic.totalLessons) * 100
      );

      // Format time spent
      const hours = Math.floor(topic.timeSpent / 3600);
      const minutes = Math.floor((topic.timeSpent % 3600) / 60);

      return {
        topic: topic.topic,
        lessonsCompleted: topic.lessonsCompleted,
        totalLessons: topic.totalLessons,
        completionPercentage,
        quizzesTaken: topic.quizzesTaken,
        averageScore: Math.round(topic.averageScore * 100) / 100,
        timeSpent: topic.timeSpent,
        timeSpentFormatted: `${hours}h ${minutes}m`,
        status: topic.status,
        lastAccessedAt: topic.lastAccessedAt
      };
    });

    // Sort by last accessed (most recent first)
    subjects.sort((a, b) => 
      new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );

    res.status(200).json({
      success: true,
      data: {
        subjects,
        totalSubjects: subjects.length
      }
    });
  } catch (error) {
    console.error('Error fetching subject-wise progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subject-wise progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get weekly activity
 * GET /api/analytics/weekly-activity
 */
export const getWeeklyActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Find user progress
    const progress = await Progress.findOne({ userId });

    if (!progress) {
      res.status(200).json({
        success: true,
        data: {
          weeklyActivity: [],
          totalLessonsThisWeek: 0,
          totalQuizzesThisWeek: 0,
          totalTimeThisWeek: 0
        }
      });
      return;
    }

    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Initialize weekly activity array (last 7 days)
    const weeklyActivity: any[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      weeklyActivity.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        lessonsCompleted: 0,
        quizzesTaken: 0,
        timeSpent: 0,
        active: false
      });
    }

    // Filter quizzes from last 7 days
    const recentQuizzes = progress.quizScores.filter((quiz: IQuizScore) => {
      const quizDate = new Date(quiz.completedAt);
      return quizDate >= sevenDaysAgo;
    });

    // Count quizzes per day
    recentQuizzes.forEach((quiz: IQuizScore) => {
      const quizDate = new Date(quiz.completedAt);
      quizDate.setHours(0, 0, 0, 0);
      const dateStr = quizDate.toISOString().split('T')[0];
      
      const dayIndex = weeklyActivity.findIndex(day => day.date === dateStr);
      if (dayIndex !== -1) {
        weeklyActivity[dayIndex].quizzesTaken += 1;
        weeklyActivity[dayIndex].timeSpent += quiz.timeSpent || 0;
        weeklyActivity[dayIndex].active = true;
      }
    });

    // Estimate lessons completed per day based on topic progress
    // This is an approximation since we don't track exact lesson completion dates
    progress.topicProgress.forEach((topic: ITopicProgress) => {
      const topicDate = new Date(topic.lastAccessedAt);
      if (topicDate >= sevenDaysAgo) {
        topicDate.setHours(0, 0, 0, 0);
        const dateStr = topicDate.toISOString().split('T')[0];
        
        const dayIndex = weeklyActivity.findIndex(day => day.date === dateStr);
        if (dayIndex !== -1) {
          // Estimate lessons for this day (rough approximation)
          weeklyActivity[dayIndex].lessonsCompleted += Math.min(topic.lessonsCompleted, 3);
          weeklyActivity[dayIndex].active = true;
        }
      }
    });

    // Calculate totals for the week
    const totalLessonsThisWeek = weeklyActivity.reduce((sum, day) => sum + day.lessonsCompleted, 0);
    const totalQuizzesThisWeek = weeklyActivity.reduce((sum, day) => sum + day.quizzesTaken, 0);
    const totalTimeThisWeek = weeklyActivity.reduce((sum, day) => sum + day.timeSpent, 0);

    // Format time for each day
    weeklyActivity.forEach(day => {
      const hours = Math.floor(day.timeSpent / 3600);
      const minutes = Math.floor((day.timeSpent % 3600) / 60);
      day.timeSpentFormatted = `${hours}h ${minutes}m`;
    });

    res.status(200).json({
      success: true,
      data: {
        weeklyActivity,
        totalLessonsThisWeek,
        totalQuizzesThisWeek,
        totalTimeThisWeek,
        totalTimeThisWeekFormatted: `${Math.floor(totalTimeThisWeek / 3600)}h ${Math.floor((totalTimeThisWeek % 3600) / 60)}m`,
        activeDays: weeklyActivity.filter(day => day.active).length
      }
    });
  } catch (error) {
    console.error('Error fetching weekly activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly activity',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
