/**
 * Configuration Endpoints Test Script
 * 
 * This script tests all configuration-related endpoints including:
 * - AI Personalities listing
 * - User configuration setup
 * - User configuration retrieval
 * - User configuration updates
 * 
 * Prerequisites:
 * 1. Server must be running (npm run dev)
 * 2. Database must be connected
 * 3. You need a valid JWT token from authentication
 * 
 * Usage:
 * 1. First, run the auth test to get a token or login manually
 * 2. Replace YOUR_JWT_TOKEN with your actual token
 * 3. Run: npx ts-node src/test-config.ts
 */

import axios, { AxiosError } from 'axios';

const BASE_URL = 'http://localhost:8004/api';
const CONFIG_URL = `${BASE_URL}/config`;

// Replace this with your actual JWT token from authentication
const JWT_TOKEN = 'YOUR_JWT_TOKEN';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

/**
 * Helper function to log test results
 */
function logResult(result: TestResult) {
  results.push(result);
  const icon = result.success ? '✅' : '❌';
  console.log(`\n${icon} ${result.name}`);
  console.log(`   ${result.message}`);
  if (result.data) {
    console.log('   Data:', JSON.stringify(result.data, null, 2));
  }
}

/**
 * Test 1: Get all AI personalities (Public endpoint)
 */
async function testGetAIPersonalities() {
  console.log('\n📋 Test 1: Get All AI Personalities');
  console.log('=' .repeat(60));
  
  try {
    const response = await axios.get(`${CONFIG_URL}/ai-personalities`);
    
    if (response.status === 200 && response.data.success) {
      logResult({
        name: 'Get AI Personalities',
        success: true,
        message: `Successfully retrieved ${response.data.data.personalities.length} personalities`,
        data: {
          count: response.data.data.personalities.length,
          personalities: response.data.data.personalities.map((p: any) => ({
            id: p.id,
            name: p.name,
            icon: p.icon
          }))
        }
      });
    } else {
      logResult({
        name: 'Get AI Personalities',
        success: false,
        message: 'Unexpected response format'
      });
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    logResult({
      name: 'Get AI Personalities',
      success: false,
      message: `Error: ${axiosError.message}`
    });
  }
}

/**
 * Test 2: Get specific AI personality details
 */
async function testGetAIPersonalityDetails() {
  console.log('\n📋 Test 2: Get Specific AI Personality Details');
  console.log('=' .repeat(60));
  
  const personalityId = 'friendly_teacher';
  
  try {
    const response = await axios.get(`${CONFIG_URL}/ai-personalities/${personalityId}`);
    
    if (response.status === 200 && response.data.success) {
      logResult({
        name: 'Get AI Personality Details',
        success: true,
        message: `Successfully retrieved details for ${response.data.data.personality.name}`,
        data: {
          id: response.data.data.personality.id,
          name: response.data.data.personality.name,
          description: response.data.data.personality.description,
          characteristics: response.data.data.personality.characteristics
        }
      });
    } else {
      logResult({
        name: 'Get AI Personality Details',
        success: false,
        message: 'Unexpected response format'
      });
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    logResult({
      name: 'Get AI Personality Details',
      success: false,
      message: `Error: ${axiosError.message}`
    });
  }
}

/**
 * Test 3: Setup user configuration (requires authentication)
 */
async function testSetupConfiguration() {
  console.log('\n📋 Test 3: Setup User Configuration');
  console.log('=' .repeat(60));
  
  if (JWT_TOKEN === 'YOUR_JWT_TOKEN') {
    logResult({
      name: 'Setup Configuration',
      success: false,
      message: 'Please provide a valid JWT token in the script'
    });
    return;
  }
  
  const configData = {
    aiPersonality: {
      tone: 'friendly',
      verbosity: 'moderate',
      teachingStyle: 'mixed',
      encouragementLevel: 'high',
      humorLevel: 'light'
    },
    learningPreferences: {
      preferredLanguages: ['JavaScript', 'TypeScript'],
      difficultyLevel: 'intermediate',
      learningPace: 'moderate',
      focusAreas: ['Web Development', 'Backend'],
      notificationPreferences: {
        email: true,
        push: true,
        dailyReminders: true,
        weeklyProgress: true
      },
      studySchedule: {
        preferredDays: ['monday', 'wednesday', 'friday'],
        preferredTimeSlots: ['evening']
      }
    },
    accessibilitySettings: {
      fontSize: 'medium',
      highContrast: false,
      screenReader: false,
      keyboardNavigation: true,
      reducedMotion: false
    },
    theme: 'dark',
    language: 'en',
    timezone: 'Asia/Kolkata'
  };
  
  try {
    const response = await axios.post(
      `${CONFIG_URL}/setup`,
      configData,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 201 && response.data.success) {
      logResult({
        name: 'Setup Configuration',
        success: true,
        message: 'Configuration setup completed successfully',
        data: {
          theme: response.data.data.configuration.theme,
          language: response.data.data.configuration.language,
          aiPersonality: response.data.data.configuration.aiPersonality
        }
      });
    } else {
      logResult({
        name: 'Setup Configuration',
        success: false,
        message: 'Unexpected response format'
      });
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    const errorData = axiosError.response?.data as any;
    logResult({
      name: 'Setup Configuration',
      success: false,
      message: errorData?.message || axiosError.message
    });
  }
}

/**
 * Test 4: Get user configuration (requires authentication)
 */
async function testGetUserConfig() {
  console.log('\n📋 Test 4: Get User Configuration');
  console.log('=' .repeat(60));
  
  if (JWT_TOKEN === 'YOUR_JWT_TOKEN') {
    logResult({
      name: 'Get User Configuration',
      success: false,
      message: 'Please provide a valid JWT token in the script'
    });
    return;
  }
  
  try {
    const response = await axios.get(
      `${CONFIG_URL}/user`,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      }
    );
    
    if (response.status === 200 && response.data.success) {
      logResult({
        name: 'Get User Configuration',
        success: true,
        message: 'Successfully retrieved user configuration',
        data: {
          user: response.data.data.user,
          theme: response.data.data.configuration.theme,
          language: response.data.data.configuration.language
        }
      });
    } else {
      logResult({
        name: 'Get User Configuration',
        success: false,
        message: 'Unexpected response format'
      });
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    const errorData = axiosError.response?.data as any;
    logResult({
      name: 'Get User Configuration',
      success: false,
      message: errorData?.message || axiosError.message
    });
  }
}

/**
 * Test 5: Update user configuration (requires authentication)
 */
async function testUpdateConfiguration() {
  console.log('\n📋 Test 5: Update User Configuration');
  console.log('=' .repeat(60));
  
  if (JWT_TOKEN === 'YOUR_JWT_TOKEN') {
    logResult({
      name: 'Update Configuration',
      success: false,
      message: 'Please provide a valid JWT token in the script'
    });
    return;
  }
  
  const updateData = {
    theme: 'light',
    aiPersonality: {
      tone: 'professional',
      encouragementLevel: 'moderate'
    },
    learningPreferences: {
      learningPace: 'fast',
      focusAreas: ['Advanced JavaScript', 'System Design']
    }
  };
  
  try {
    const response = await axios.put(
      `${CONFIG_URL}/update`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 200 && response.data.success) {
      logResult({
        name: 'Update Configuration',
        success: true,
        message: 'Configuration updated successfully',
        data: {
          theme: response.data.data.configuration.theme,
          aiPersonality: response.data.data.configuration.aiPersonality
        }
      });
    } else {
      logResult({
        name: 'Update Configuration',
        success: false,
        message: 'Unexpected response format'
      });
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    const errorData = axiosError.response?.data as any;
    logResult({
      name: 'Update Configuration',
      success: false,
      message: errorData?.message || axiosError.message
    });
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n🚀 Starting Configuration Endpoints Tests');
  console.log('=' .repeat(60));
  console.log(`Base URL: ${CONFIG_URL}`);
  console.log(`Token provided: ${JWT_TOKEN !== 'YOUR_JWT_TOKEN' ? 'Yes' : 'No'}`);
  
  // Run all tests
  await testGetAIPersonalities();
  await testGetAIPersonalityDetails();
  await testSetupConfiguration();
  await testGetUserConfig();
  await testUpdateConfiguration();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Summary');
  console.log('=' .repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (JWT_TOKEN === 'YOUR_JWT_TOKEN') {
    console.log('\n⚠️  Note: Some tests were skipped because no JWT token was provided.');
    console.log('   To test authenticated endpoints:');
    console.log('   1. Run the auth test script to get a token');
    console.log('   2. Replace YOUR_JWT_TOKEN in this file with your actual token');
    console.log('   3. Run this script again');
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Run tests
runAllTests().catch(console.error);
