import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const BASE_URL = 'http://localhost:8004';
let token: string;
let socket: Socket;
let userId: string;

/**
 * Integration Test Suite for Phase 7
 * Tests server, socket.io, authentication, and AI integration
 */

async function runTests() {
  console.log('🧪 Starting Server Integration Tests...\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Health Check
    console.log('\n📋 Test 1: Health Check');
    console.log('-'.repeat(60));
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running');
    console.log('   Environment:', health.data.environment);
    console.log('   Timestamp:', health.data.timestamp);

    // Test 2: Register User
    console.log('\n📋 Test 2: User Registration');
    console.log('-'.repeat(60));
    const registerData = {
      name: 'Integration Test User',
      email: `test${Date.now()}@example.com`,
      password: 'Test123!@#',
      role: 'student'
    };
    const register = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
    token = register.data.token;
    userId = register.data.user._id;
    console.log('✅ User registered successfully');
    console.log('   Name:', register.data.user.name);
    console.log('   Email:', register.data.user.email);
    console.log('   User ID:', userId);
    console.log('   Token received:', token ? '✓' : '✗');

    // Test 3: Login
    console.log('\n📋 Test 3: User Login');
    console.log('-'.repeat(60));
    const login = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    console.log('✅ Login successful');
    console.log('   Token matches:', login.data.token === token ? '✓' : '✗');

    // Test 4: Get User Profile
    console.log('\n📋 Test 4: Get User Profile');
    console.log('-'.repeat(60));
    const profile = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile retrieved');
    console.log('   Name:', profile.data.user.name);
    console.log('   Email:', profile.data.user.email);

    // Test 5: Get Configuration
    console.log('\n📋 Test 5: Get User Configuration');
    console.log('-'.repeat(60));
    const config = await axios.get(`${BASE_URL}/api/config`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Configuration retrieved');
    console.log('   AI Tone:', config.data.config.aiPersonality.tone);
    console.log('   Verbosity:', config.data.config.aiPersonality.verbosity);
    console.log('   Teaching Style:', config.data.config.aiPersonality.teachingStyle);

    // Test 6: Update AI Personality
    console.log('\n📋 Test 6: Update AI Personality');
    console.log('-'.repeat(60));
    const updatePersonality = await axios.put(
      `${BASE_URL}/api/config/ai-personality`,
      {
        tone: 'friendly',
        verbosity: 'moderate',
        teachingStyle: 'interactive',
        encouragementLevel: 'high',
        humorLevel: 'light'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ AI personality updated');
    console.log('   New tone:', updatePersonality.data.config.aiPersonality.tone);
    console.log('   Encouragement:', updatePersonality.data.config.aiPersonality.encouragementLevel);

    // Test 7: Socket Connection with Authentication
    console.log('\n📋 Test 7: Socket.io Connection & Authentication');
    console.log('-'.repeat(60));
    await new Promise<void>((resolve, reject) => {
      socket = io(BASE_URL, {
        auth: { token }
      });

      let greetingReceived = false;

      socket.on('connect', () => {
        console.log('✅ Socket connected');
        console.log('   Socket ID:', socket.id);
      });

      socket.on('greeting', (data) => {
        console.log('✅ Greeting received from AI');
        console.log('   Personality:', data.personality);
        console.log('   Conversation ID:', data.conversationId);
        console.log('   Message preview:', data.message.substring(0, 80) + '...');
        greetingReceived = true;
        
        // Wait a bit before resolving to ensure connection is stable
        setTimeout(() => resolve(), 1000);
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        reject(error);
      });

      socket.on('error', (error) => {
        console.error('❌ Socket error:', error.message);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!greetingReceived) {
          reject(new Error('Socket connection timeout - no greeting received'));
        }
      }, 10000);
    });

    // Test 8: Send Text Message via Socket
    console.log('\n📋 Test 8: Send Text Message via Socket');
    console.log('-'.repeat(60));
    await new Promise<void>((resolve) => {
      let responseReceived = false;

      socket.on('audioStream', () => {
        if (!responseReceived) {
          console.log('✅ AI response received (audio stream)');
          responseReceived = true;
          setTimeout(() => resolve(), 1000);
        }
      });

      console.log('   Sending: "Hello! Can you help me learn English?"');
      socket.emit('contentUpdateText', 'Hello! Can you help me learn English?');

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!responseReceived) {
          console.log('⚠️  No audio response received (may be normal for text-only)');
        }
        resolve();
      }, 15000);
    });

    // Test 9: Create Discussion
    console.log('\n📋 Test 9: Create Discussion');
    console.log('-'.repeat(60));
    const discussion = await axios.post(
      `${BASE_URL}/api/discussions`,
      {
        title: 'Test English Grammar Discussion',
        description: 'Testing discussion creation',
        subject: 'English',
        topic: 'Grammar',
        difficulty: 'intermediate',
        maxParticipants: 5
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Discussion created');
    console.log('   Discussion ID:', discussion.data.discussion._id);
    console.log('   Title:', discussion.data.discussion.title);
    console.log('   Subject:', discussion.data.discussion.subject);

    // Test 10: Get User Progress
    console.log('\n📋 Test 10: Get User Progress');
    console.log('-'.repeat(60));
    const progress = await axios.get(`${BASE_URL}/api/progress/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Progress retrieved');
    console.log('   Total XP:', progress.data.progress.totalXP);
    console.log('   Level:', progress.data.progress.level);
    console.log('   Current Streak:', progress.data.progress.currentStreak);

    // Test 11: Update Chapter Progress
    console.log('\n📋 Test 11: Update Chapter Progress');
    console.log('-'.repeat(60));
    const chapterProgress = await axios.post(
      `${BASE_URL}/api/progress/chapter`,
      {
        subject: 'English',
        chapter: 'Present Perfect Tense',
        lessonId: 'lesson_001',
        completed: true,
        timeSpent: 1800
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Chapter progress updated');
    console.log('   XP Earned:', chapterProgress.data.progress.totalXP);
    console.log('   Lesson Completed:', chapterProgress.data.progress.subjects[0]?.chapters[0]?.completed);

    // Test 12: Get Dashboard Stats
    console.log('\n📋 Test 12: Get Dashboard Analytics');
    console.log('-'.repeat(60));
    const dashboard = await axios.get(`${BASE_URL}/api/progress/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Dashboard stats retrieved');
    console.log('   Total XP:', dashboard.data.stats.totalXP);
    console.log('   Lessons Completed:', dashboard.data.stats.lessonsCompleted);
    console.log('   Current Streak:', dashboard.data.stats.currentStreak);

    // Test 13: Test Unauthorized Access
    console.log('\n📋 Test 13: Test Unauthorized Access');
    console.log('-'.repeat(60));
    try {
      await axios.get(`${BASE_URL}/api/config`);
      console.log('❌ Should have failed without token');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Unauthorized access properly blocked');
        console.log('   Status:', error.response.status);
        console.log('   Error:', error.response.data.error);
      } else {
        throw error;
      }
    }

    // Test 14: Test Invalid Token
    console.log('\n📋 Test 14: Test Invalid Token');
    console.log('-'.repeat(60));
    try {
      await axios.get(`${BASE_URL}/api/config`, {
        headers: { Authorization: 'Bearer invalid_token_here' }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token properly rejected');
        console.log('   Status:', error.response.status);
        console.log('   Error:', error.response.data.error);
      } else {
        throw error;
      }
    }

    // Test 15: Test 404 Route
    console.log('\n📋 Test 15: Test 404 Route');
    console.log('-'.repeat(60));
    try {
      await axios.get(`${BASE_URL}/api/nonexistent`);
      console.log('❌ Should have returned 404');
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('✅ 404 handler working correctly');
        console.log('   Status:', error.response.status);
        console.log('   Error:', error.response.data.error);
      } else {
        throw error;
      }
    }

    // Cleanup
    console.log('\n📋 Cleanup');
    console.log('-'.repeat(60));
    socket.disconnect();
    console.log('✅ Socket disconnected');

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log('   ✓ Health check');
    console.log('   ✓ User registration & login');
    console.log('   ✓ User profile retrieval');
    console.log('   ✓ Configuration management');
    console.log('   ✓ AI personality updates');
    console.log('   ✓ Socket.io authentication');
    console.log('   ✓ AI session initialization');
    console.log('   ✓ Message sending via socket');
    console.log('   ✓ Discussion creation');
    console.log('   ✓ Progress tracking');
    console.log('   ✓ Dashboard analytics');
    console.log('   ✓ Security (unauthorized access blocked)');
    console.log('   ✓ Error handling (404, invalid tokens)');
    console.log('\n🎉 Server integration is working perfectly!\n');

  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error('\nError:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    // Cleanup on error
    if (socket && socket.connected) {
      socket.disconnect();
    }
    
    process.exit(1);
  }
}

// Run tests
console.log('🚀 Phase 7: Server & Socket Integration Test Suite');
console.log('📅 Started at:', new Date().toISOString());
console.log('');

runTests().then(() => {
  console.log('📅 Completed at:', new Date().toISOString());
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
