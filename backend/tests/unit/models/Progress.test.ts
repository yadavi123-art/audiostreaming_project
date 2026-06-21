import { User, Progress } from '../../../src/models';
import mongoose from 'mongoose';

describe('Progress Model', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
      role: 'student',
    });
  });

  describe('Progress Creation', () => {
    it('should create progress with valid data', async () => {
      const progressData = {
        userId: testUser._id,
        totalListeningTime: 3600,
        totalSessions: 5,
        averageSessionDuration: 720,
        completedTopics: ['Introduction', 'Basics'],
        currentStreak: 3,
        longestStreak: 5,
      };

      const progress = await Progress.create(progressData);

      expect(progress).toBeDefined();
      expect(progress.userId.toString()).toBe(testUser._id.toString());
      expect(progress.totalListeningTime).toBe(progressData.totalListeningTime);
      expect(progress.totalSessions).toBe(progressData.totalSessions);
      expect(progress.completedTopics).toEqual(progressData.completedTopics);
    });

    it('should create progress with default values', async () => {
      const progress = await Progress.create({
        userId: testUser._id,
      });

      expect(progress.totalListeningTime).toBe(0);
      expect(progress.totalSessions).toBe(0);
      expect(progress.averageSessionDuration).toBe(0);
      expect(progress.completedTopics).toEqual([]);
      expect(progress.currentStreak).toBe(0);
      expect(progress.longestStreak).toBe(0);
    });

    it('should fail to create progress without userId', async () => {
      await expect(
        Progress.create({
          totalListeningTime: 3600,
        })
      ).rejects.toThrow();
    });

    it('should fail to create duplicate progress for same user', async () => {
      await Progress.create({
        userId: testUser._id,
      });

      await expect(
        Progress.create({
          userId: testUser._id,
        })
      ).rejects.toThrow();
    });
  });

  describe('Progress Updates', () => {
    let progress: any;

    beforeEach(async () => {
      progress = await Progress.create({
        userId: testUser._id,
        totalListeningTime: 3600,
        totalSessions: 5,
      });
    });

    it('should update listening time', async () => {
      progress.totalListeningTime += 1800;
      await progress.save();

      const updatedProgress = await Progress.findById(progress._id);
      expect(updatedProgress?.totalListeningTime).toBe(5400);
    });

    it('should update session count', async () => {
      progress.totalSessions += 1;
      await progress.save();

      const updatedProgress = await Progress.findById(progress._id);
      expect(updatedProgress?.totalSessions).toBe(6);
    });

    it('should add completed topics', async () => {
      progress.completedTopics.push('Advanced Topics');
      await progress.save();

      const updatedProgress = await Progress.findById(progress._id);
      expect(updatedProgress?.completedTopics).toContain('Advanced Topics');
    });

    it('should update streak', async () => {
      progress.currentStreak = 7;
      progress.longestStreak = 10;
      await progress.save();

      const updatedProgress = await Progress.findById(progress._id);
      expect(updatedProgress?.currentStreak).toBe(7);
      expect(updatedProgress?.longestStreak).toBe(10);
    });
  });

  describe('Session History', () => {
    let progress: any;

    beforeEach(async () => {
      progress = await Progress.create({
        userId: testUser._id,
      });
    });

    it('should add session to history', async () => {
      const session = {
        date: new Date(),
        duration: 1800,
        topicsCompleted: ['Topic 1'],
        comprehensionScore: 85,
      };

      progress.sessionHistory.push(session);
      await progress.save();

      const updatedProgress = await Progress.findById(progress._id);
      expect(updatedProgress?.sessionHistory).toHaveLength(1);
      expect(updatedProgress?.sessionHistory[0].duration).toBe(1800);
    });

    it('should store multiple sessions', async () => {
      const sessions = [
        {
          date: new Date('2024-01-01'),
          duration: 1800,
          topicsCompleted: ['Topic 1'],
          comprehensionScore: 85,
        },
        {
          date: new Date('2024-01-02'),
          duration: 2400,
          topicsCompleted: ['Topic 2'],
          comprehensionScore: 90,
        },
      ];

      progress.sessionHistory.push(...sessions);
      await progress.save();

      const updatedProgress = await Progress.findById(progress._id);
      expect(updatedProgress?.sessionHistory).toHaveLength(2);
    });
  });

  describe('Topic Progress', () => {
    let progress: any;

    beforeEach(async () => {
      progress = await Progress.create({
        userId: testUser._id,
      });
    });

    it('should add topic progress', async () => {
      const topicProgress = {
        topicName: 'Introduction to AI',
        completionPercentage: 75,
        timeSpent: 3600,
        lastAccessed: new Date(),
        quizScores: [80, 85, 90],
      };

      progress.topicProgress.push(topicProgress);
      await progress.save();

      const updatedProgress = await Progress.findById(progress._id);
      expect(updatedProgress?.topicProgress).toHaveLength(1);
      expect(updatedProgress?.topicProgress[0].topicName).toBe('Introduction to AI');
      expect(updatedProgress?.topicProgress[0].completionPercentage).toBe(75);
    });

    it('should update existing topic progress', async () => {
      const topicProgress = {
        topicName: 'Introduction to AI',
        completionPercentage: 50,
        timeSpent: 1800,
        lastAccessed: new Date(),
        quizScores: [80],
      };

      progress.topicProgress.push(topicProgress);
      await progress.save();

      // Update the topic
      progress.topicProgress[0].completionPercentage = 100;
      progress.topicProgress[0].timeSpent = 3600;
      progress.topicProgress[0].quizScores.push(90);
      await progress.save();

      const updatedProgress = await Progress.findById(progress._id);
      expect(updatedProgress?.topicProgress[0].completionPercentage).toBe(100);
      expect(updatedProgress?.topicProgress[0].quizScores).toHaveLength(2);
    });
  });

  describe('Achievements', () => {
    let progress: any;

    beforeEach(async () => {
      progress = await Progress.create({
        userId: testUser._id,
      });
    });

    it('should add achievement', async () => {
      const achievement = {
        name: 'First Session',
        description: 'Completed your first learning session',
        earnedAt: new Date(),
        icon: '🎉',
      };

      progress.achievements.push(achievement);
      await progress.save();

      const updatedProgress = await Progress.findById(progress._id);
      expect(updatedProgress?.achievements).toHaveLength(1);
      expect(updatedProgress?.achievements[0].name).toBe('First Session');
    });

    it('should store multiple achievements', async () => {
      const achievements = [
        {
          name: 'First Session',
          description: 'Completed your first learning session',
          earnedAt: new Date(),
          icon: '🎉',
        },
        {
          name: '7 Day Streak',
          description: 'Maintained a 7-day learning streak',
          earnedAt: new Date(),
          icon: '🔥',
        },
      ];

      progress.achievements.push(...achievements);
      await progress.save();

      const updatedProgress = await Progress.findById(progress._id);
      expect(updatedProgress?.achievements).toHaveLength(2);
    });
  });

  describe('Progress Queries', () => {
    beforeEach(async () => {
      const users = await User.create([
        {
          email: 'user1@example.com',
          password: 'Pass123!',
          name: 'User One',
          role: 'student',
        },
        {
          email: 'user2@example.com',
          password: 'Pass123!',
          name: 'User Two',
          role: 'student',
        },
      ]);

      await Progress.create([
        {
          userId: users[0]._id,
          totalListeningTime: 7200,
          totalSessions: 10,
        },
        {
          userId: users[1]._id,
          totalListeningTime: 3600,
          totalSessions: 5,
        },
      ]);
    });

    it('should find progress by userId', async () => {
      const user = await User.findOne({ email: 'user1@example.com' });
      const progress = await Progress.findOne({ userId: user?._id });

      expect(progress).toBeDefined();
      expect(progress?.totalListeningTime).toBe(7200);
    });

    it('should find all progress records', async () => {
      const allProgress = await Progress.find();
      expect(allProgress.length).toBeGreaterThanOrEqual(2);
    });

    it('should populate user data', async () => {
      const progress = await Progress.findOne().populate('userId');
      expect(progress).toBeDefined();
      expect((progress?.userId as any).email).toBeDefined();
    });
  });

  describe('Progress Deletion', () => {
    it('should delete progress', async () => {
      const progress = await Progress.create({
        userId: testUser._id,
      });

      await Progress.findByIdAndDelete(progress._id);

      const deletedProgress = await Progress.findById(progress._id);
      expect(deletedProgress).toBeNull();
    });
  });

  describe('Progress Calculations', () => {
    it('should calculate average session duration correctly', async () => {
      const progress = await Progress.create({
        userId: testUser._id,
        totalListeningTime: 7200,
        totalSessions: 4,
      });

      // Average should be 7200 / 4 = 1800 seconds
      const expectedAverage = 1800;
      progress.averageSessionDuration = progress.totalListeningTime / progress.totalSessions;
      await progress.save();

      const updatedProgress = await Progress.findById(progress._id);
      expect(updatedProgress?.averageSessionDuration).toBe(expectedAverage);
    });

    it('should handle zero sessions gracefully', async () => {
      const progress = await Progress.create({
        userId: testUser._id,
        totalListeningTime: 0,
        totalSessions: 0,
      });

      expect(progress.averageSessionDuration).toBe(0);
    });
  });
});
