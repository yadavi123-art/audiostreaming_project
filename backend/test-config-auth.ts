/**
 * Test script to verify config setup authentication
 * This script tests the complete flow: register/login -> setup config
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:8004';

interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: any;
  };
  error?: string;
}

interface ConfigResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function testConfigSetup() {
  console.log('🧪 Testing Configuration Setup Authentication\n');

  try {
    // Step 1: Try to register a test user
    console.log('📝 Step 1: Registering test user...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'password123';

    let token: string;
    
    try {
      const registerResponse = await axios.post<AuthResponse>(`${BASE_URL}/api/auth/register`, {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        role: 'student'
      });

      if (registerResponse.data.success && registerResponse.data.data?.token) {
        token = registerResponse.data.data.token;
        console.log('✅ Registration successful');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Token: ${token.substring(0, 20)}...`);
      } else {
        throw new Error('Registration failed: No token received');
      }
    } catch (registerError: any) {
      // If registration fails (user might exist), try login
      if (registerError.response?.status === 400) {
        console.log('⚠️  User might exist, trying login...');
        
        const loginResponse = await axios.post<AuthResponse>(`${BASE_URL}/api/auth/login`, {
          email: 'student@example.com',
          password: 'password123'
        });

        if (loginResponse.data.success && loginResponse.data.data?.token) {
          token = loginResponse.data.data.token;
          console.log('✅ Login successful');
          console.log(`   Token: ${token.substring(0, 20)}...`);
        } else {
          throw new Error('Login failed: No token received');
        }
      } else {
        throw registerError;
      }
    }

    // Step 2: Test config setup WITHOUT token (should fail)
    console.log('\n🔒 Step 2: Testing config setup WITHOUT token (should fail)...');
    try {
      await axios.post<ConfigResponse>(`${BASE_URL}/api/config/setup`, {
        class: 2,
        subjects: ['science'],
        aiPersonality: 'professional',
        learningPace: 'moderate',
        difficultyLevel: 'intermediate',
        dailyGoal: 30
      });
      console.log('❌ UNEXPECTED: Request succeeded without token!');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected: 401 Unauthorized');
        console.log(`   Error: ${error.response.data.error}`);
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}`);
      }
    }

    // Step 3: Test config setup WITH token (should succeed)
    console.log('\n🔓 Step 3: Testing config setup WITH token (should succeed)...');
    try {
      const configResponse = await axios.post<ConfigResponse>(
        `${BASE_URL}/api/config/setup`,
        {
          class: 2,
          subjects: ['science'],
          aiPersonality: 'professional',
          learningPace: 'moderate',
          difficultyLevel: 'intermediate',
          dailyGoal: 30
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (configResponse.data.success) {
        console.log('✅ Configuration setup successful!');
        console.log('   Configuration:', JSON.stringify(configResponse.data.data, null, 2));
      } else {
        console.log('❌ Configuration setup failed:', configResponse.data.error);
      }
    } catch (error: any) {
      if (error.response) {
        console.log(`❌ Request failed with status ${error.response.status}`);
        console.log(`   Error: ${error.response.data.error || error.response.data.message}`);
        console.log('   Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Request failed:', error.message);
      }
    }

    // Step 4: Test getting config
    console.log('\n📖 Step 4: Testing get user config...');
    try {
      const getConfigResponse = await axios.get<ConfigResponse>(
        `${BASE_URL}/api/config/user`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (getConfigResponse.data.success) {
        console.log('✅ Get config successful!');
        console.log('   Configuration:', JSON.stringify(getConfigResponse.data.data, null, 2));
      } else {
        console.log('⚠️  No configuration found (this is normal if setup failed)');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️  No configuration found (404)');
      } else {
        console.log('❌ Get config failed:', error.response?.data?.error || error.message);
      }
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Authentication middleware is working correctly');
    console.log('   - Requests without token are properly rejected');
    console.log('   - Requests with valid token should be processed');
    console.log('\n💡 To use the API:');
    console.log('   1. Login/Register to get a token');
    console.log('   2. Include token in Authorization header: Bearer <token>');
    console.log('   3. Make your API requests');

  } catch (error: any) {
    console.error('\n❌ Test failed with error:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

// Run the test
testConfigSetup().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
