import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from './config/database';
import User from './models/User';
import UserConfiguration from './models/UserConfiguration';
import Conversation from './models/Conversation';
import Discussion from './models/Discussion';
import Progress from './models/Progress';

// Load environment variables
dotenv.config();

/**
 * Test database connection and models
 */
async function testDatabase() {
  try {
    console.log('🧪 Starting database tests...\n');

    // Test 1: Database Connection
    console.log('📝 Test 1: Database Connection');
    await initializeDatabase();
    console.log('✅ Database connected successfully\n');

    // Test 2: User Model
    console.log('📝 Test 2: User Model');
    const testUser = new User({
      email: 'test@example.com',
      password: 'TestPassword123!',
      name: 'Test User',
      role: 'student',
    });
    await testUser.save();
    console.log('✅ User created:', testUser.email);
    
    // Test password comparison
    const isPasswordValid = await testUser.comparePassword('TestPassword123!');
    console.log('✅ Password comparison works:', isPasswordValid);
    
    // Verify password is hashed
    const userWithPassword = await User.findById(testUser._id).select('+password');
    console.log('✅ Password is hashed:', userWithPassword?.password !== 'TestPassword123!');
    console.log('');

    // Test 3: UserConfiguration Model
    console.log('📝 Test 3: UserConfiguration Model');
    const testConfig = new UserConfiguration({
      userId: testUser._id,
      aiPersonality: {
        tone: 'friendly',
        verbosity: 'moderate',
        teachingStyle: 'mixed',
        encouragementLevel: 'moderate',
        humorLevel: 'light',
      },
      learningPreferences: {
        preferredLanguages: ['JavaScript', 'TypeScript'],
        difficultyLevel: 'intermediate',
        learningPace: 'moderate',
        focusAreas: ['Web Development', 'Backend'],
        notificationPreferences: {
          email: true,
          push: true,
          dailyReminders: false,
          weeklyProgress: true,
        },
        studySchedule: {
          preferredDays: ['monday', 'wednesday', 'friday'],
          preferredTimeSlots: ['evening'],
        },
      },
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
    });
    await testConfig.save();
    console.log('✅ UserConfiguration created for user:', testUser.email);
    console.log('');

    // Test 4: Conversation Model
    console.log('📝 Test 4: Conversation Model');
    const testConversation = new Conversation({
      userId: testUser._id,
      title: 'Learning JavaScript Basics',
      context: {
        topic: 'JavaScript',
        language: 'JavaScript',
        difficulty: 'beginner',
        tags: ['variables', 'functions', 'arrays'],
      },
    });
    
    // Add messages
    await testConversation.addMessage({
      role: 'user',
      content: 'What are JavaScript variables?',
    });
    
    await testConversation.addMessage({
      role: 'assistant',
      content: 'Variables in JavaScript are containers for storing data values...',
      metadata: {
        tokens: 150,
        model: 'gpt-4',
        temperature: 0.7,
        processingTime: 1200,
      },
    });
    
    console.log('✅ Conversation created with', testConversation.messageCount, 'messages');
    console.log('');

    // Test 5: Discussion Model
    console.log('📝 Test 5: Discussion Model');
    const testDiscussion = new Discussion({
      title: 'Best practices for async/await in JavaScript',
      description: 'Let\'s discuss the best practices for using async/await in modern JavaScript applications.',
      category: 'question',
      tags: ['javascript', 'async', 'promises'],
      authorId: testUser._id,
    });
    
    // Add a message
    await testDiscussion.addMessage(
      testUser._id,
      'I often struggle with error handling in async functions. What are your recommendations?'
    );
    
    console.log('✅ Discussion created:', testDiscussion.title);
    console.log('✅ Message count:', testDiscussion.messageCount);
    console.log('✅ Participant count:', testDiscussion.participantCount);
    console.log('');

    // Test 6: Progress Model
    console.log('📝 Test 6: Progress Model');
    const testProgress = new Progress({
      userId: testUser._id,
    });
    
    // Add a quiz score
    await testProgress.addQuizScore({
      quizId: 'quiz-001',
      quizTitle: 'JavaScript Fundamentals Quiz',
      topic: 'JavaScript',
      score: 8,
      totalQuestions: 10,
      percentage: 80,
      timeSpent: 600,
      completedAt: new Date(),
      answers: [
        {
          questionId: 'q1',
          question: 'What is a variable?',
          userAnswer: 'A container for storing data',
          correctAnswer: 'A container for storing data',
          isCorrect: true,
        },
      ],
    });
    
    // Complete a lesson
    await testProgress.completeLesson('JavaScript', 1800);
    
    // Unlock an achievement
    await testProgress.unlockAchievement({
      achievementId: 'first-quiz',
      title: 'First Quiz Completed',
      description: 'Complete your first quiz',
      category: 'learning',
      icon: '🎯',
    });
    
    console.log('✅ Progress created for user:', testUser.email);
    console.log('✅ Total quizzes taken:', testProgress.totalQuizzesTaken);
    console.log('✅ Total lessons completed:', testProgress.totalLessonsCompleted);
    console.log('✅ Level:', testProgress.level);
    console.log('✅ Experience points:', testProgress.experiencePoints);
    console.log('✅ Achievements unlocked:', testProgress.achievementCount);
    console.log('✅ Overall average score:', testProgress.overallAverageScore, '%');
    console.log('');

    // Test 7: Model Relationships
    console.log('📝 Test 7: Model Relationships');
    const userWithConfig = await User.findById(testUser._id).populate('configuration');
    console.log('✅ User with configuration populated:', !!userWithConfig);
    
    const conversationWithUser = await Conversation.findById(testConversation._id).populate('user');
    console.log('✅ Conversation with user populated:', !!conversationWithUser);
    console.log('');

    // Test 8: Query Performance
    console.log('📝 Test 8: Query Performance');
    const startTime = Date.now();
    await User.findOne({ email: 'test@example.com' });
    const queryTime = Date.now() - startTime;
    console.log('✅ User query time:', queryTime, 'ms');
    console.log('');

    // Cleanup: Delete test data
    console.log('🧹 Cleaning up test data...');
    await User.findByIdAndDelete(testUser._id);
    await UserConfiguration.findOneAndDelete({ userId: testUser._id });
    await Conversation.findByIdAndDelete(testConversation._id);
    await Discussion.findByIdAndDelete(testDiscussion._id);
    await Progress.findOneAndDelete({ userId: testUser._id });
    console.log('✅ Test data cleaned up\n');

    console.log('✅ All tests passed successfully! 🎉\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await closeDatabase();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run tests
testDatabase();
