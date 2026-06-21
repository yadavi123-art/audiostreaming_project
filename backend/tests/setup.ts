import mongoose from 'mongoose';
import { dbConnection } from '../src/config/database';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/audiostreaming_test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Setup before all tests
beforeAll(async () => {
  try {
    // Connect to test database
    await dbConnection.connect();
    console.log('Test database connection established');
  } catch (error) {
    console.error('Unable to connect to test database:', error);
    throw error;
  }
});

// Cleanup after each test
afterEach(async () => {
  try {
    // Clear all collections but keep structure
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing test data:', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await dbConnection.disconnect();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Error closing test database:', error);
  }
});

// Global test utilities
global.testUtils = {
  createTestUser: async (overrides = {}) => {
    const { User } = require('../src/models');
    return await User.create({
      email: 'test@example.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
      role: 'student',
      ...overrides,
    });
  },
  
  generateAuthToken: (userId: string) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  },
  
  clearDatabase: async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  },
};

// Declare global types
declare global {
  var testUtils: {
    createTestUser: (overrides?: any) => Promise<any>;
    generateAuthToken: (userId: string) => string;
    clearDatabase: () => Promise<void>;
  };
}
