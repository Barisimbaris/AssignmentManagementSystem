#!/bin/bash
# ============================================================================
# AMS API - COMPREHENSIVE ENDPOINT TEST SUITE (Bash Version)
# ============================================================================

BASE_URL="${BASE_URL:-http://localhost:5281}"
VERBOSE="${VERBOSE:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Test counters
TOTAL=0
PASSED=0
FAILED=0
SKIPPED=0

# Global variables
ADMIN_TOKEN=""
INSTRUCTOR_TOKEN=""
STUDENT_TOKEN=""
COURSE_ID=0
CLASS_ID=0
ASSIGNMENT_ID=0

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

print_header() {
    echo ""
    echo "=================================================================================="
    echo "  $1"
    echo "=================================================================================="
}

print_step() {
    echo -e "  ${YELLOW}→${NC} $1"
}

print_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASSED++))
    ((TOTAL++))
}

print_fail() {
    echo -e "  ${RED}✗${NC} $1"
    if [ -n "$2" ]; then
        echo -e "    ${RED}Error: $2${NC}"
    fi
    ((FAILED++))
    ((TOTAL++))
}

print_skip() {
    echo -e "  ${GRAY}⊘${NC} $1 (Optional)"
    ((SKIPPED++))
    ((TOTAL++))
}

api_test() {
    local name=$1
    local method=$2
    local endpoint=$3
    local body=$4
    local token=$5
    local expected_status=${6:-200}
    local required=${7:-true}
    
    local headers=(-H "Content-Type: application/json")
    if [ -n "$token" ]; then
        headers+=(-H "Authorization: Bearer $token")
    fi
    
    if [ "$VERBOSE" = "true" ]; then
        echo "    [DEBUG] $method $BASE_URL$endpoint" >&2
    fi
    
    local response
    local status_code
    
    if [ -n "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            "${headers[@]}" \
            -d "$body" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            "${headers[@]}" 2>&1)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" -eq "$expected_status" ]; then
        print_pass "$name"
        echo "$response_body"
        return 0
    else
        if [ "$required" = "true" ]; then
            print_fail "$name" "Expected status $expected_status, got $status_code"
            echo "$response_body" >&2
            return 1
        else
            print_skip "$name"
            return 1
        fi
    fi
}

# ============================================================================
# TEST EXECUTION
# ============================================================================

print_header "AMS API - Comprehensive Endpoint Test Suite"
echo "Base URL: $BASE_URL"
echo "Start Time: $(date '+%Y-%m-%d %H:%M:%S')"

# 1. AUTHENTICATION
print_header "1. AUTHENTICATION ENDPOINTS"

print_step "Admin Login"
admin_response=$(api_test "Admin Login" "POST" "/api/Auth/login" \
    '{"email":"admin@ams.com","password":"Admin123!"}' "" 200)
if echo "$admin_response" | grep -q '"token"'; then
    ADMIN_TOKEN=$(echo "$admin_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

print_step "Instructor Login"
instructor_response=$(api_test "Instructor Login" "POST" "/api/Auth/login" \
    '{"email":"yakup.kalay@test.com","password":"Test123!"}' "" 200 false)
if echo "$instructor_response" | grep -q '"token"'; then
    INSTRUCTOR_TOKEN=$(echo "$instructor_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

# 2. USER MANAGEMENT
print_header "2. USER MANAGEMENT ENDPOINTS"

if [ -n "$ADMIN_TOKEN" ]; then
    print_step "Get All Users"
    api_test "Get All Users" "GET" "/api/User" "" "$ADMIN_TOKEN"
    
    print_step "Get Students"
    api_test "Get Students" "GET" "/api/User/students" "" "$ADMIN_TOKEN"
    
    print_step "Get Instructors"
    api_test "Get Instructors" "GET" "/api/User/instructors" "" "$ADMIN_TOKEN"
fi

# 3. DASHBOARD
print_header "6. DASHBOARD & STATISTICS ENDPOINTS"

if [ -n "$ADMIN_TOKEN" ]; then
    print_step "Admin Dashboard"
    api_test "Admin Dashboard" "GET" "/api/Dashboard/admin" "" "$ADMIN_TOKEN"
fi

if [ -n "$INSTRUCTOR_TOKEN" ]; then
    print_step "Instructor Dashboard"
    api_test "Instructor Dashboard" "GET" "/api/Dashboard/instructor" "" "$INSTRUCTOR_TOKEN"
fi

# ============================================================================
# SUMMARY
# ============================================================================

print_header "TEST SUMMARY"

pass_rate=0
if [ $TOTAL -gt 0 ]; then
    pass_rate=$(echo "scale=2; $PASSED * 100 / $TOTAL" | bc)
fi

echo "  Total Tests:  $TOTAL"
echo -e "  Passed:       ${GREEN}$PASSED${NC}"
echo -e "  Failed:       ${RED}$FAILED${NC}"
echo -e "  Skipped:      ${GRAY}$SKIPPED${NC}"
echo "  Pass Rate:    ${pass_rate}%"

echo ""
echo "  End Time: $(date '+%Y-%m-%d %H:%M:%S')"

if [ $FAILED -eq 0 ]; then
    echo -e "\n  ${GREEN}✓ All tests passed!${NC}"
else
    echo -e "\n  ${RED}✗ Some tests failed. Please review the output above.${NC}"
fi

echo ""
