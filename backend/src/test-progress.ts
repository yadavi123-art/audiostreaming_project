import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:8004/api';

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'Test@1234',
  name: 'Test User'
};

let authToken = '';

/**
 * Helper function to log test results
 */
function logTest(testName: string, success: boolean, data?: any) {
  console.log('\n' + '='.repeat(60));
  console.log(`TEST: ${testName}`);
  console.log('='.repeat(60));
  console.log(`Status: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  if (data) {
    console.log('Response:', JSON.stringify(data, null, 2));
  }
  console.log('='.repeat(60));
}

/**
 * Test 1: Register and Login
 */
async function testAuthSetup() {
  try {
    // Try to register
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      logTest('User Registration', true, registerResponse.data);
    } catch (error) {
      // User might already exist
      console.log('User already exists, proceeding to login...');
    }

    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    authToken = loginResponse.data.token;
    logTest('User Login', true, { token: authToken.substring(0, 20) + '...' });
    return true;
  } catch (error) {
    const err = error as AxiosError;
    logTest('Auth Setup', false, err.response?.data);
    return false;
  }
}

/**
 * Test 2: Get User Progress (Initial)
 */
async function testGetUserProgress() {
  try {
    const response = await axios.get(`${BASE_URL}/progress/user`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Get User Progress', response.data.success, response.data);
    return response.data.success;
  } catch (error) {
    const err = error as AxiosError;
    logTest('Get User Progress', false, err.response?.data);
    return false;
  }
}

/**
 * Test 3: Update Chapter Progress
 */
async function testUpdateChapterProgress() {
  try {
    const chapterData = {
      topic: 'Mathematics',
      totalLessons: 10,
      timeSpent: 1800 // 30 minutes in seconds
    };

    const response = await axios.post(`${BASE_URL}/progress/chapter`, chapterData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Update Chapter Progress', response.data.success, response.data);
    return response.data.success;
  } catch (error) {
    const err = error as AxiosError;
    logTest('Update Chapter Progress', false, err.response?.data);
    return false;
  }
}

/**
 * Test 4: Record Quiz Score
 */
async function testRecordQuizScore() {
  try {
    const quizData = {
      quizId: 'quiz-math-001',
      quizTitle: 'Mathematics Chapter 1 Quiz',
      topic: 'Mathematics',
      score: 8,
      totalQuestions: 10,
      timeSpent: 600, // 10 minutes
      answers: [
        {
          questionId: 'q1',
          question: 'What is 2 + 2?',
          userAnswer: '4',
          correctAnswer: '4',
          isCorrect: true
        },
        {
          questionId: 'q2',
          question: 'What is 5 x 3?',
          userAnswer: '15',
          correctAnswer: '15',
          isCorrect: true
        }
      ]
    };

    const response = await axios.post(`${BASE_URL}/progress/quiz`, quizData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Record Quiz Score', response.data.success, response.data);
    return response.data.success;
  } catch (error) {
    const err = error as AxiosError;
    logTest('Record Quiz Score', false, err.response?.data);
    return false;
  }
}

/**
 * Test 5: Update Streak
 */
async function testUpdateStreak() {
  try {
    const response = await axios.post(`${BASE_URL}/progress/streak`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Update Streak', response.data.success, response.data);
    return response.data.success;
  } catch (error) {
    const err = error as AxiosError;
    logTest('Update Streak', false, err.response?.data);
    return false;
  }
}

/**
 * Test 6: Get Leaderboard
 */
async function testGetLeaderboard() {
  try {
    const response = await axios.get(`${BASE_URL}/progress/leaderboard?limit=10&sortBy=level`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Get Leaderboard', response.data.success, response.data);
    return response.data.success;
  } catch (error) {
    const err = error as AxiosError;
    logTest('Get Leaderboard', false, err.response?.data);
    return false;
  }
}

/**
 * Test 7: Get Dashboard Stats
 */
async function testGetDashboardStats() {
  try {
    const response = await axios.get(`${BASE_URL}/progress/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Get Dashboard Stats', response.data.success, response.data);
    return response.data.success;
  } catch (error) {
    const err = error as AxiosError;
    logTest('Get Dashboard Stats', false, err.response?.data);
    return false;
  }
}

/**
 * Test 8: Get Subject-Wise Progress
 */
async function testGetSubjectWiseProgress() {
  try {
    const response = await axios.get(`${BASE_URL}/progress/analytics/subject-progress`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Get Subject-Wise Progress', response.data.success, response.data);
    return response.data.success;
  } catch (error) {
    const err = error as AxiosError;
    logTest('Get Subject-Wise Progress', false, err.response?.data);
    return false;
  }
}

/**
 * Test 9: Get Weekly Activity
 */
async function testGetWeeklyActivity() {
  try {
    const response = await axios.get(`${BASE_URL}/progress/analytics/weekly-activity`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Get Weekly Activity', response.data.success, response.data);
    return response.data.success;
  } catch (error) {
    const err = error as AxiosError;
    logTest('Get Weekly Activity', false, err.response?.data);
    return false;
  }
}

/**
 * Test 10: Add Multiple Topics and Quizzes
 */
async function testMultipleTopics() {
  try {
    // Add Science topic
    await axios.post(`${BASE_URL}/progress/chapter`, {
      topic: 'Science',
      totalLessons: 12,
      timeSpent: 2400
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // Add English topic
    await axios.post(`${BASE_URL}/progress/chapter`, {
      topic: 'English',
      totalLessons: 8,
      timeSpent: 1500
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // Add Science quiz
    await axios.post(`${BASE_URL}/progress/quiz`, {
      quizId: 'quiz-science-001',
      quizTitle: 'Science Chapter 1 Quiz',
      topic: 'Science',
      score: 9,
      totalQuestions: 10,
      timeSpent: 720,
      answers: []
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Add Multiple Topics', true, { message: 'Multiple topics and quizzes added successfully' });
    return true;
  } catch (error) {
    const err = error as AxiosError;
    logTest('Add Multiple Topics', false, err.response?.data);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n🚀 Starting Progress & Analytics API Tests...\n');
  console.log('Make sure the server is running on http://localhost:8004\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Run tests sequentially
  const tests = [
    { name: 'Auth Setup', fn: testAuthSetup },
    { name: 'Get User Progress', fn: testGetUserProgress },
    { name: 'Update Chapter Progress', fn: testUpdateChapterProgress },
    { name: 'Record Quiz Score', fn: testRecordQuizScore },
    { name: 'Update Streak', fn: testUpdateStreak },
    { name: 'Get Leaderboard', fn: testGetLeaderboard },
    { name: 'Get Dashboard Stats', fn: testGetDashboardStats },
    { name: 'Get Subject-Wise Progress', fn: testGetSubjectWiseProgress },
    { name: 'Get Weekly Activity', fn: testGetWeeklyActivity },
    { name: 'Add Multiple Topics', fn: testMultipleTopics }
  ];

  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));
}

// Run tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
