/**
 * Security Testing Script
 * Tests various security features of the AudioStreaming API
 */

import axios, { AxiosError } from 'axios';

const BASE_URL = 'http://localhost:8004';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testRateLimiting() {
  log('\n📊 Test 1: Rate Limiting', colors.blue);
  log('Attempting 6 login requests (limit is 5)...');
  
  let rateLimitHit = false;
  
  try {
    for (let i = 1; i <= 6; i++) {
      try {
        await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'test@example.com',
          password: 'wrongpassword'
        });
        log(`  Request ${i}: Sent`);
      } catch (error: any) {
        if (error.response?.status === 429) {
          log(`  Request ${i}: Rate limited ✓`, colors.green);
          rateLimitHit = true;
          break;
        }
        log(`  Request ${i}: ${error.response?.status || 'Error'}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (rateLimitHit) {
      log('✅ Rate limiting is working correctly', colors.green);
    } else {
      log('❌ Rate limiting did not trigger', colors.red);
    }
  } catch (error) {
    log('❌ Rate limiting test failed', colors.red);
  }
}

async function testInputValidation() {
  log('\n🔍 Test 2: Input Validation', colors.blue);
  
  // Test invalid email
  log('Testing invalid email format...');
  try {
    await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test User',
      email: 'invalid-email',
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#'
    });
    log('❌ Invalid email was accepted', colors.red);
  } catch (error: any) {
    if (error.response?.status === 400) {
      log('✅ Invalid email rejected correctly', colors.green);
    } else {
      log(`❌ Unexpected status: ${error.response?.status}`, colors.red);
    }
  }
  
  // Test weak password
  log('Testing weak password...');
  try {
    await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'weak',
      confirmPassword: 'weak'
    });
    log('❌ Weak password was accepted', colors.red);
  } catch (error: any) {
    if (error.response?.status === 400) {
      log('✅ Weak password rejected correctly', colors.green);
    } else {
      log(`❌ Unexpected status: ${error.response?.status}`, colors.red);
    }
  }
  
  // Test password mismatch
  log('Testing password mismatch...');
  try {
    await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test123!@#',
      confirmPassword: 'Different123!@#'
    });
    log('❌ Password mismatch was accepted', colors.red);
  } catch (error: any) {
    if (error.response?.status === 400) {
      log('✅ Password mismatch rejected correctly', colors.green);
    } else {
      log(`❌ Unexpected status: ${error.response?.status}`, colors.red);
    }
  }
}

async function testXSSProtection() {
  log('\n🛡️  Test 3: XSS Protection', colors.blue);
  log('Testing XSS in name field...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: '<script>alert("XSS")</script>',
      email: `test${Date.now()}@example.com`,
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#'
    });
    
    const userName = response.data.data.user.name;
    if (userName.includes('<script>')) {
      log('❌ XSS script was not sanitized', colors.red);
    } else {
      log('✅ XSS script was sanitized', colors.green);
      log(`  Sanitized name: ${userName}`);
    }
  } catch (error: any) {
    if (error.response?.status === 400) {
      log('✅ XSS attempt rejected by validation', colors.green);
    } else {
      log(`❌ Unexpected error: ${error.message}`, colors.red);
    }
  }
}

async function testSecurityHeaders() {
  log('\n🔒 Test 4: Security Headers', colors.blue);
  log('Checking security headers...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'referrer-policy'
    ];
    
    let allPresent = true;
    for (const header of requiredHeaders) {
      if (headers[header]) {
        log(`  ✓ ${header}: ${headers[header]}`, colors.green);
      } else {
        log(`  ✗ ${header}: Missing`, colors.red);
        allPresent = false;
      }
    }
    
    if (allPresent) {
      log('✅ All security headers present', colors.green);
    } else {
      log('❌ Some security headers missing', colors.red);
    }
  } catch (error) {
    log('❌ Failed to check security headers', colors.red);
  }
}

async function testErrorHandling() {
  log('\n⚠️  Test 5: Error Handling', colors.blue);
  
  // Test 404 error
  log('Testing 404 error...');
  try {
    await axios.get(`${BASE_URL}/api/nonexistent`);
    log('❌ 404 error not thrown', colors.red);
  } catch (error: any) {
    if (error.response?.status === 404 && error.response?.data?.success === false) {
      log('✅ 404 error handled correctly', colors.green);
    } else {
      log(`❌ Unexpected status: ${error.response?.status}`, colors.red);
    }
  }
  
  // Test invalid token
  log('Testing invalid token...');
  try {
    await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid_token' }
    });
    log('❌ Invalid token was accepted', colors.red);
  } catch (error: any) {
    if (error.response?.status === 401) {
      log('✅ Invalid token rejected correctly', colors.green);
    } else {
      log(`❌ Unexpected status: ${error.response?.status}`, colors.red);
    }
  }
  
  // Test missing token
  log('Testing missing token...');
  try {
    await axios.get(`${BASE_URL}/api/auth/me`);
    log('❌ Missing token was accepted', colors.red);
  } catch (error: any) {
    if (error.response?.status === 401) {
      log('✅ Missing token rejected correctly', colors.green);
    } else {
      log(`❌ Unexpected status: ${error.response?.status}`, colors.red);
    }
  }
}

async function testSQLInjection() {
  log('\n💉 Test 6: SQL Injection Prevention', colors.blue);
  log('Testing SQL injection in login...');
  
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com" OR "1"="1',
      password: 'anything'
    });
    log('❌ SQL injection was not prevented', colors.red);
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 400) {
      log('✅ SQL injection prevented (Mongoose protection)', colors.green);
    } else {
      log(`❌ Unexpected status: ${error.response?.status}`, colors.red);
    }
  }
}

async function testCORS() {
  log('\n🌐 Test 7: CORS Configuration', colors.blue);
  log('Checking CORS headers...');
  
  try {
    const response = await axios.options(`${BASE_URL}/api/health`);
    const headers = response.headers;
    
    if (headers['access-control-allow-origin']) {
      log(`✅ CORS configured: ${headers['access-control-allow-origin']}`, colors.green);
    } else {
      log('❌ CORS headers missing', colors.red);
    }
    
    if (headers['access-control-allow-methods']) {
      log(`  Allowed methods: ${headers['access-control-allow-methods']}`);
    }
  } catch (error) {
    log('⚠️  Could not check CORS (this is normal for some configurations)', colors.yellow);
  }
}

async function testRequestSizeLimit() {
  log('\n📦 Test 8: Request Size Limit', colors.blue);
  log('Testing large request body...');
  
  try {
    // Create a large payload (>10MB)
    const largeData = 'x'.repeat(11 * 1024 * 1024); // 11MB
    
    await axios.post(`${BASE_URL}/api/auth/register`, {
      name: largeData,
      email: 'test@example.com',
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#'
    });
    log('❌ Large request was accepted', colors.red);
  } catch (error: any) {
    if (error.response?.status === 413 || error.code === 'ERR_BAD_REQUEST') {
      log('✅ Large request rejected correctly', colors.green);
    } else {
      log(`⚠️  Request failed with: ${error.message}`, colors.yellow);
    }
  }
}

async function runAllTests() {
  log('\n🚀 Starting Security Tests for AudioStreaming API', colors.blue);
  log('='.repeat(60));
  
  try {
    // Check if server is running
    await axios.get(`${BASE_URL}/api/health`);
    log('✅ Server is running\n', colors.green);
  } catch (error) {
    log('❌ Server is not running. Please start the server first.', colors.red);
    log('   Run: npm run dev', colors.yellow);
    process.exit(1);
  }
  
  await testRateLimiting();
  await testInputValidation();
  await testXSSProtection();
  await testSecurityHeaders();
  await testErrorHandling();
  await testSQLInjection();
  await testCORS();
  await testRequestSizeLimit();
  
  log('\n' + '='.repeat(60));
  log('🎉 Security tests completed!', colors.blue);
  log('\nNote: Some tests may show warnings or expected failures.');
  log('Review the results above to ensure all security measures are working.\n');
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, colors.red);
  process.exit(1);
});
