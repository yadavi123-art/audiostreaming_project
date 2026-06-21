import axios from 'axios';

/**
 * Simple test script to verify authentication endpoints
 * Run with: ts-node src/test-auth.ts
 */

const BASE_URL = 'http://localhost:8004/api/auth';

interface AuthResponse {
  success: boolean;
  data?: {
    user: any;
    token: string;
  };
  error?: string;
}

let authToken = '';

async function testRegister() {
  console.log('\n🧪 Testing User Registration...');
  try {
    const response = await axios.post<AuthResponse>(`${BASE_URL}/register`, {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
      role: 'student'
    });

    if (response.data.success && response.data.data?.token) {
      authToken = response.data.data.token;
      console.log('✅ Registration successful');
      console.log('   User:', response.data.data.user.email);
      console.log('   Token:', authToken.substring(0, 20) + '...');
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('❌ Registration failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🧪 Testing User Login...');
  try {
    const response = await axios.post<AuthResponse>(`${BASE_URL}/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    if (response.data.success && response.data.data?.token) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      console.log('   User:', response.data.data.user.email);
      console.log('   Token:', authToken.substring(0, 20) + '...');
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testGetMe() {
  console.log('\n🧪 Testing Get Current User...');
  try {
    const response = await axios.get(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log('✅ Get current user successful');
      console.log('   User:', response.data.data.email);
      console.log('   Role:', response.data.data.role);
      console.log('   Configuration:', response.data.data.configuration ? 'Loaded' : 'Not loaded');
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('❌ Get current user failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testUpdateProfile() {
  console.log('\n🧪 Testing Update Profile...');
  try {
    const response = await axios.put(
      `${BASE_URL}/profile`,
      {
        name: 'Updated Test User',
        avatar: 'https://example.com/avatar.jpg'
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Profile update successful');
      console.log('   New name:', response.data.data.name);
      console.log('   Avatar:', response.data.data.avatar);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('❌ Profile update failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testChangePassword() {
  console.log('\n🧪 Testing Change Password...');
  try {
    const response = await axios.put(
      `${BASE_URL}/password`,
      {
        currentPassword: 'password123',
        newPassword: 'newpassword456'
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Password change successful');
      console.log('   New token:', response.data.data.token.substring(0, 20) + '...');
      authToken = response.data.data.token;
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('❌ Password change failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🧪 Testing Unauthorized Access...');
  try {
    await axios.get(`${BASE_URL}/me`);
    console.error('❌ Should have failed without token');
    return false;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected unauthorized access');
      return true;
    }
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Authentication Tests...');
  console.log('📍 Base URL:', BASE_URL);
  console.log('⚠️  Make sure the server is running on port 8004');

  const results = {
    register: false,
    login: false,
    getMe: false,
    updateProfile: false,
    changePassword: false,
    unauthorized: false
  };

  // Test registration
  results.register = await testRegister();

  // Test login (if registration failed, try with existing user)
  if (!results.register) {
    results.login = await testLogin();
  }

  // Only continue if we have a token
  if (authToken) {
    results.getMe = await testGetMe();
    results.updateProfile = await testUpdateProfile();
    results.changePassword = await testChangePassword();
  }

  // Test unauthorized access
  results.unauthorized = await testUnauthorizedAccess();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log('='.repeat(50));
  console.log(`Registration:        ${results.register ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Login:               ${results.login ? '✅ PASS' : '⏭️  SKIP'}`);
  console.log(`Get Current User:    ${results.getMe ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Update Profile:      ${results.updateProfile ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Change Password:     ${results.changePassword ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Unauthorized Access: ${results.unauthorized ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(50));

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  console.log(`\n🎯 Result: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.');
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});
