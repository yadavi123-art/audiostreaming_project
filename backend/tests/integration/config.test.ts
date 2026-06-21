import request from 'supertest';
import express from 'express';
import { User, UserConfiguration } from '../../src/models';
import configRoutes from '../../src/routes/configRoutes';
import { errorHandler } from '../../src/middleware/errorHandler';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/config', configRoutes);
app.use(errorHandler);

describe('Configuration API Integration Tests', () => {
  let authToken: string;
  let testUser: any;

  beforeEach(async () => {
    // Create and authenticate a test user
    testUser = await User.create({
      email: 'testuser@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
      role: 'student',
    });

    // Generate auth token
    authToken = global.testUtils.generateAuthToken(testUser._id.toString());
  });

  describe('POST /api/config', () => {
    it('should create user configuration successfully', async () => {
      const configData = {
        learningStyle: 'visual',
        difficultyLevel: 'intermediate',
        preferredTopics: ['JavaScript', 'React', 'Node.js'],
        learningGoals: 'Become a full-stack developer',
        dailyLearningTime: 60,
        preferredVoice: 'female',
        speechRate: 1.0,
      };

      const response = await request(app)
        .post('/api/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(configData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.learningStyle).toBe(configData.learningStyle);
      expect(response.body.data.difficultyLevel).toBe(configData.difficultyLevel);
      expect(response.body.data.preferredTopics).toEqual(configData.preferredTopics);
    });

    it('should fail to create configuration without authentication', async () => {
      const response = await request(app)
        .post('/api/config')
        .send({
          learningStyle: 'visual',
          difficultyLevel: 'intermediate',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create duplicate configuration', async () => {
      const configData = {
        learningStyle: 'visual',
        difficultyLevel: 'intermediate',
      };

      // Create first configuration
      await request(app)
        .post('/api/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(configData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(configData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate learning style enum', async () => {
      const response = await request(app)
        .post('/api/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          learningStyle: 'invalid-style',
          difficultyLevel: 'intermediate',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate difficulty level enum', async () => {
      const response = await request(app)
        .post('/api/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          learningStyle: 'visual',
          difficultyLevel: 'invalid-level',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/config', () => {
    beforeEach(async () => {
      // Create a configuration for the test user
      await UserConfiguration.create({
        userId: testUser._id,
        learningStyle: 'visual',
        difficultyLevel: 'intermediate',
        preferredTopics: ['JavaScript'],
        learningGoals: 'Learn web development',
        dailyLearningTime: 60,
      });
    });

    it('should get user configuration successfully', async () => {
      const response = await request(app)
        .get('/api/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.learningStyle).toBe('visual');
      expect(response.body.data.difficultyLevel).toBe('intermediate');
    });

    it('should fail to get configuration without authentication', async () => {
      const response = await request(app)
        .get('/api/config')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if configuration does not exist', async () => {
      // Create a new user without configuration
      const newUser = await User.create({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
        role: 'student',
      });

      const newUserToken = global.testUtils.generateAuthToken(newUser._id.toString());

      const response = await request(app)
        .get('/api/config')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/config', () => {
    beforeEach(async () => {
      // Create initial configuration
      await UserConfiguration.create({
        userId: testUser._id,
        learningStyle: 'visual',
        difficultyLevel: 'beginner',
        preferredTopics: ['JavaScript'],
        learningGoals: 'Learn basics',
        dailyLearningTime: 30,
      });
    });

    it('should update user configuration successfully', async () => {
      const updates = {
        difficultyLevel: 'advanced',
        preferredTopics: ['JavaScript', 'TypeScript', 'React'],
        dailyLearningTime: 90,
      };

      const response = await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.difficultyLevel).toBe('advanced');
      expect(response.body.data.preferredTopics).toEqual(updates.preferredTopics);
      expect(response.body.data.dailyLearningTime).toBe(90);
    });

    it('should fail to update without authentication', async () => {
      const response = await request(app)
        .put('/api/config')
        .send({
          difficultyLevel: 'advanced',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to update with invalid data', async () => {
      const response = await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          learningStyle: 'invalid-style',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if configuration does not exist', async () => {
      // Create a new user without configuration
      const newUser = await User.create({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
        role: 'student',
      });

      const newUserToken = global.testUtils.generateAuthToken(newUser._id.toString());

      const response = await request(app)
        .put('/api/config')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          difficultyLevel: 'advanced',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/config', () => {
    beforeEach(async () => {
      // Create a configuration for the test user
      await UserConfiguration.create({
        userId: testUser._id,
        learningStyle: 'visual',
        difficultyLevel: 'intermediate',
        preferredTopics: ['JavaScript'],
        learningGoals: 'Learn web development',
        dailyLearningTime: 60,
      });
    });

    it('should delete user configuration successfully', async () => {
      const response = await request(app)
        .delete('/api/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify configuration is deleted
      const config = await UserConfiguration.findOne({ userId: testUser._id });
      expect(config).toBeNull();
    });

    it('should fail to delete without authentication', async () => {
      const response = await request(app)
        .delete('/api/config')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if configuration does not exist', async () => {
      // Create a new user without configuration
      const newUser = await User.create({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
        role: 'student',
      });

      const newUserToken = global.testUtils.generateAuthToken(newUser._id.toString());

      const response = await request(app)
        .delete('/api/config')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('AI Personality Generation', () => {
    it('should generate AI personality based on configuration', async () => {
      const configData = {
        learningStyle: 'visual',
        difficultyLevel: 'intermediate',
        preferredTopics: ['JavaScript', 'React'],
        learningGoals: 'Become a full-stack developer',
        dailyLearningTime: 60,
      };

      const response = await request(app)
        .post('/api/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(configData)
        .expect(201);

      expect(response.body.data.aiPersonality).toBeDefined();
      expect(response.body.data.aiPersonality.teachingStyle).toBeDefined();
      expect(response.body.data.aiPersonality.communicationTone).toBeDefined();
    });
  });
});
