#!/bin/bash

# TBAT Docker Security Testing Script
# Tests AC7 and AC8 requirements for Story 0.3

set -e

echo "====================================="
echo "TBAT Docker Security Testing"
echo "====================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
PASSED=0
FAILED=0

# Function to test a requirement
test_requirement() {
    local test_name=$1
    local test_cmd=$2
    
    echo -n "Testing: $test_name... "
    if eval $test_cmd > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

# Function to test Docker service
test_docker_service() {
    local service=$1
    local check_cmd=$2
    
    echo -n "Testing Docker service: $service... "
    if docker-compose -f docker-compose.secure.yml exec -T $service sh -c "$check_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ RUNNING${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ NOT RUNNING${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "====================================="
echo "AC7: Docker Environment Security"
echo "====================================="
echo ""

# Test 1: Environment variables properly managed
test_requirement "Environment variables file exists" "test -f .env.docker || test -f .env.docker.example"

# Test 2: Secrets not exposed in Docker images
test_requirement "No hardcoded secrets in docker-compose.secure.yml" "! grep -E '(password|secret|key).*=.*[a-zA-Z0-9]{8,}' docker-compose.secure.yml"

# Test 3: Security configurations in place
test_requirement "Security opts configured" "grep -q 'no-new-privileges:true' docker-compose.secure.yml"
test_requirement "Read-only volumes configured" "grep -q ':ro' docker-compose.secure.yml"
test_requirement "Health checks configured" "grep -q 'healthcheck:' docker-compose.secure.yml"
test_requirement "Resource limits configured" "grep -q 'limits:' docker-compose.secure.yml"

# Test 4: Network isolation
test_requirement "Custom network configured" "grep -q 'tbat-network' docker-compose.secure.yml"
test_requirement "Localhost binding for databases" "grep -q '127.0.0.1:' docker-compose.secure.yml"

echo ""
echo "====================================="
echo "AC8: Utility Services in Docker"
echo "====================================="
echo ""

# Start Docker services if not running
echo "Starting Docker services..."
docker-compose -f docker-compose.secure.yml up -d --build > /dev/null 2>&1 || true
sleep 10  # Wait for services to start

# Test 5: Exam code generation service
test_docker_service "web" "node -e \"require('./lib/exam-code').generateExamCode('FREE', 'BIOLOGY').then(console.log)\""

# Test 6: Password hashing service
test_docker_service "web" "node -e \"require('./lib/auth').hashPassword('Test123456').then(console.log)\""

# Test 7: PDPA utilities
test_docker_service "web" "node -e \"console.log(require('./lib/pdpa').ConsentType)\""

# Test 8: Rate limiting middleware
test_docker_service "web" "node -e \"console.log(require('./lib/rate-limit').rateLimitConfig)\""

# Test 9: Input validation
test_docker_service "web" "node -e \"console.log(require('./lib/api-validation').userSchema)\""

# Test 10: Sentry monitoring (check configuration)
test_docker_service "web" "node -e \"console.log(process.env.SENTRY_ENABLED)\""

# Test 11: Database connectivity
test_docker_service "postgres" "pg_isready -U tbat_user"

# Test 12: Redis connectivity
test_docker_service "redis" "redis-cli ping"

echo ""
echo "====================================="
echo "Docker API Endpoint Tests"
echo "====================================="
echo ""

# Test 13: Health check endpoint
test_requirement "Health check endpoint responds" "curl -f http://localhost:3000/api/health"

# Test 14: Rate limiting active
test_requirement "Rate limiting headers present" "curl -I http://localhost:3000/api/pdpa/consent 2>/dev/null | grep -i 'x-ratelimit'"

echo ""
echo "====================================="
echo "Test Summary"
echo "====================================="
echo ""
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All Docker security tests passed!${NC}"
    echo "AC7 and AC8 requirements validated successfully."
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review and fix.${NC}"
    exit 1
fi