#!/bin/bash

# Simple test script to debug the authentication issue
# This will show exactly what's being sent and received

echo "🔍 Testing Authentication Flow"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8004"

# Step 1: Login
echo -e "${YELLOW}Step 1: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token using grep and cut
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to extract token${NC}"
  echo "Please register a user first:"
  echo ""
  echo "curl -X POST ${BASE_URL}/api/auth/register \\"
  echo "  -H \"Content-Type: application/json\" \\"
  echo "  -d '{\"email\":\"student@example.com\",\"password\":\"password123\",\"name\":\"Test Student\",\"role\":\"student\"}'"
  exit 1
fi

echo -e "${GREEN}✅ Token extracted:${NC}"
echo "Token: ${TOKEN:0:30}..."
echo "Token length: ${#TOKEN}"
echo ""

# Step 2: Test WITHOUT token
echo -e "${YELLOW}Step 2: Testing WITHOUT token (should fail)...${NC}"
NO_TOKEN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/config/setup" \
  -H "Content-Type: application/json" \
  -d '{
    "class": 2,
    "subjects": ["science"],
    "aiPersonality": "professional",
    "learningPace": "moderate",
    "difficultyLevel": "intermediate",
    "dailyGoal": 30
  }')

echo "Response:"
echo "$NO_TOKEN_RESPONSE" | jq '.' 2>/dev/null || echo "$NO_TOKEN_RESPONSE"
echo ""

# Step 3: Test WITH token
echo -e "${YELLOW}Step 3: Testing WITH token (should succeed)...${NC}"
echo "Authorization header: Bearer ${TOKEN:0:30}..."
echo ""

WITH_TOKEN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/config/setup" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "class": 2,
    "subjects": ["science"],
    "aiPersonality": "professional",
    "learningPace": "moderate",
    "difficultyLevel": "intermediate",
    "dailyGoal": 30
  }')

echo "Response:"
echo "$WITH_TOKEN_RESPONSE" | jq '.' 2>/dev/null || echo "$WITH_TOKEN_RESPONSE"
echo ""

# Check if successful
if echo "$WITH_TOKEN_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Configuration setup successful!${NC}"
else
  echo -e "${RED}❌ Configuration setup failed${NC}"
  echo ""
  echo "Debug info:"
  echo "- Token is being sent: Bearer ${TOKEN:0:30}..."
  echo "- Check server logs for more details"
fi

echo ""
echo "================================"
echo "Test complete"
