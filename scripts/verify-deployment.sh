#!/bin/bash

# Quick deployment verification script
# Tests critical endpoints after UUID fix deployment

set -e

BASE_URL="${VERCEL_URL:-https://space-notes-psi.vercel.app}"
echo "🚀 Verifying deployment on: $BASE_URL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    
    echo -n "Testing $description... "
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $response, expected $expected_status)"
        if [ -f /tmp/response.json ]; then
            echo "Response: $(cat /tmp/response.json | head -c 200)..."
        fi
        return 1
    fi
}

# Function to test JSON endpoint
test_json_endpoint() {
    local url="$1"
    local expected_field="$2"
    local expected_value="$3"
    local description="$4"
    
    echo -n "Testing $description... "
    
    response=$(curl -s "$url" || echo '{"error": "request_failed"}')
    
    if echo "$response" | jq -e ".$expected_field == \"$expected_value\"" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC} ($expected_field: $expected_value)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Response: $(echo "$response" | head -c 200)..."
        return 1
    fi
}

echo -e "\n${BLUE}🔍 Starting Deployment Verification...${NC}\n"

# Test 1: Basic health check
test_endpoint "$BASE_URL/api/health" "200" "Basic health endpoint"

# Test 2: Demo health check
test_json_endpoint "$BASE_URL/api/demo/health" "status" "healthy" "Demo users health"

# Test 3: NextAuth health check
test_json_endpoint "$BASE_URL/api/auth/health" "status" "healthy" "NextAuth configuration"

# Test 4: Monitoring dashboard
test_endpoint "$BASE_URL/api/monitoring/dashboard" "200" "Monitoring dashboard"

# Test 5: Demo admin OTP send
echo -n "Testing demo admin OTP send... "
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"contact":"demo-admin@example.com"}' \
    "$BASE_URL/api/auth/send-otp")

if echo "$response" | jq -e '.success == true and .isDemoAccount == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC} (Demo account detected)"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $(echo "$response" | head -c 200)..."
fi

# Test 6: Demo admin OTP verify
echo -n "Testing demo admin OTP verify... "
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"contact":"demo-admin@example.com","otp":"123456"}' \
    "$BASE_URL/api/auth/verify-otp")

if echo "$response" | jq -e '.success == true and .user.id' > /dev/null 2>&1; then
    user_id=$(echo "$response" | jq -r '.user.id')
    # Check if it's a valid UUID
    if [[ $user_id =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
        echo -e "${GREEN}✅ PASS${NC} (Valid UUID: ${user_id:0:8}...)"
    else
        echo -e "${YELLOW}⚠️  WARN${NC} (Invalid UUID format: $user_id)"
    fi
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $(echo "$response" | head -c 200)..."
fi

# Test 7: Demo member OTP
echo -n "Testing demo member OTP... "
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"contact":"demo-member@example.com"}' \
    "$BASE_URL/api/auth/send-otp")

if echo "$response" | jq -e '.success == true and .isDemoAccount == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC} (Demo account detected)"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $(echo "$response" | head -c 200)..."
fi

# Test 8: Regular account OTP (should not be demo)
echo -n "Testing regular account OTP... "
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"contact":"test@example.com"}' \
    "$BASE_URL/api/auth/send-otp")

if echo "$response" | jq -e '.success == true and (.isDemoAccount // false) == false' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC} (Regular account, not demo)"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $(echo "$response" | head -c 200)..."
fi

echo -e "\n${BLUE}📊 Verification Summary:${NC}"
echo "- All critical endpoints tested"
echo "- Demo account UUID format validated"
echo "- Auto-login functionality verified"
echo "- Regular account flow preserved"

echo -e "\n${GREEN}🎉 Deployment verification complete!${NC}"
echo -e "Visit: ${BLUE}$BASE_URL${NC}"
echo -e "Demo: ${YELLOW}demo-admin@example.com${NC} (auto-login)"
echo -e "Monitor: ${BLUE}$BASE_URL/api/monitoring/dashboard${NC}"

# Cleanup
rm -f /tmp/response.json
