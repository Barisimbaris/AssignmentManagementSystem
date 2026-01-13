#!/bin/bash

# AMS Advanced Newman Automation Script
# Usage: ./newman-advanced.sh [environment] [collection]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
NEWMAN_DIR="$PROJECT_ROOT/newman"
REPORTS_DIR="$NEWMAN_DIR/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-development}"
COLLECTION="${2:-ams-collection.json}"
API_URL="http://localhost:5281"
TIMEOUT=15000
PARALLEL_RUNS=1

echo -e "${CYAN}?? AMS Advanced Newman Automation${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Collection: $COLLECTION${NC}"
echo -e "${YELLOW}API URL: $API_URL${NC}"
echo ""

# Function: Setup directories
setup_directories() {
    echo -e "${BLUE}?? Setting up directories...${NC}"
    mkdir -p "$NEWMAN_DIR"
    mkdir -p "$REPORTS_DIR"
    mkdir -p "$REPORTS_DIR/archive"
}

# Function: Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}?? Checking prerequisites...${NC}"
    
    # Check Newman
    if ! command -v newman &> /dev/null; then
        echo -e "${RED}? Newman not found. Installing...${NC}"
        npm install -g newman newman-reporter-htmlextra
    else
        echo -e "${GREEN}? Newman found: $(newman --version)${NC}"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}? Node.js not found. Please install Node.js${NC}"
        exit 1
    else
        echo -e "${GREEN}? Node.js found: $(node --version)${NC}"
    fi
    
    # Check .NET
    if ! command -v dotnet &> /dev/null; then
        echo -e "${RED}? .NET not found. Please install .NET${NC}"
        exit 1
    else
        echo -e "${GREEN}? .NET found: $(dotnet --version)${NC}"
    fi
}

# Function: Start API
start_api() {
    echo -e "${BLUE}?? Starting API server...${NC}"
    
    # Check if API is already running
    if curl -s "$API_URL/swagger/v1/swagger.json" > /dev/null 2>&1; then
        echo -e "${GREEN}? API is already running${NC}"
        return 0
    fi
    
    # Start API
    cd "$PROJECT_ROOT/src/AMS.API"
    nohup dotnet run --urls="$API_URL" > "$REPORTS_DIR/api.log" 2>&1 &
    API_PID=$!
    echo $API_PID > "$REPORTS_DIR/api.pid"
    
    # Wait for API to start
    echo -e "${YELLOW}? Waiting for API to start...${NC}"
    for i in {1..30}; do
        if curl -s "$API_URL/swagger/v1/swagger.json" > /dev/null 2>&1; then
            echo -e "${GREEN}? API started successfully${NC}"
            return 0
        fi
        sleep 2
        echo -n "."
    done
    
    echo -e "${RED}? Failed to start API${NC}"
    exit 1
}

# Function: Stop API
stop_api() {
    if [ -f "$REPORTS_DIR/api.pid" ]; then
        API_PID=$(cat "$REPORTS_DIR/api.pid")
        echo -e "${BLUE}?? Stopping API (PID: $API_PID)...${NC}"
        kill $API_PID 2>/dev/null || true
        rm "$REPORTS_DIR/api.pid"
        echo -e "${GREEN}? API stopped${NC}"
    fi
}

# Function: Run Newman tests
run_newman_tests() {
    echo -e "${CYAN}?? Running Newman tests...${NC}"
    
    local collection_file="$NEWMAN_DIR/$COLLECTION"
    local environment_file="$NEWMAN_DIR/ams-environment-${ENVIRONMENT}.json"
    
    # Check if files exist
    if [ ! -f "$collection_file" ]; then
        echo -e "${RED}? Collection file not found: $collection_file${NC}"
        exit 1
    fi
    
    if [ ! -f "$environment_file" ]; then
        echo -e "${RED}? Environment file not found: $environment_file${NC}"
        exit 1
    fi
    
    # Generate report names
    local html_report="$REPORTS_DIR/ams-test-report-$TIMESTAMP.html"
    local json_report="$REPORTS_DIR/ams-test-report-$TIMESTAMP.json"
    local junit_report="$REPORTS_DIR/ams-test-report-$TIMESTAMP.xml"
    
    # Run Newman
    newman run "$collection_file" \
        --environment "$environment_file" \
        --reporters cli,htmlextra,json,junit \
        --reporter-htmlextra-export "$html_report" \
        --reporter-json-export "$json_report" \
        --reporter-junit-export "$junit_report" \
        --timeout $TIMEOUT \
        --bail false \
        --color on \
        --delay-request 100 \
        --timeout-request 10000 \
        --timeout-script 5000
    
    local newman_exit_code=$?
    
    # Generate summary
    generate_summary "$json_report" "$newman_exit_code"
    
    return $newman_exit_code
}

# Function: Generate test summary
generate_summary() {
    local json_report="$1"
    local exit_code="$2"
    
    echo -e "${MAGENTA}?? Test Summary${NC}"
    echo "=================================="
    
    if [ -f "$json_report" ]; then
        local total_tests=$(jq '.run.stats.tests.total' "$json_report" 2>/dev/null || echo "0")
        local passed_tests=$(jq '.run.stats.tests.passed' "$json_report" 2>/dev/null || echo "0")
        local failed_tests=$(jq '.run.stats.tests.failed' "$json_report" 2>/dev/null || echo "0")
        local total_requests=$(jq '.run.stats.requests.total' "$json_report" 2>/dev/null || echo "0")
        
        echo "?? Total Tests: $total_tests"
        echo "? Passed: $passed_tests"
        echo "? Failed: $failed_tests"
        echo "?? Total Requests: $total_requests"
    fi
    
    echo "?? Timestamp: $TIMESTAMP"
    echo "?? Environment: $ENVIRONMENT"
    echo "?? Reports: $REPORTS_DIR"
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}?? All tests passed!${NC}"
    else
        echo -e "${RED}?? Some tests failed!${NC}"
    fi
}

# Function: Archive old reports
archive_old_reports() {
    echo -e "${BLUE}?? Archiving old reports...${NC}"
    
    # Move reports older than 7 days to archive
    find "$REPORTS_DIR" -name "*.html" -o -name "*.json" -o -name "*.xml" | \
    grep -E "[0-9]{8}_[0-9]{6}\.(html|json|xml)$" | \
    while read -r file; do
        if [ $(find "$file" -mtime +7 -print 2>/dev/null) ]; then
            mv "$file" "$REPORTS_DIR/archive/" 2>/dev/null || true
        fi
    done
}

# Function: Send notifications
send_notifications() {
    local exit_code="$1"
    
    if [ ! -z "$WEBHOOK_URL" ]; then
        echo -e "${BLUE}?? Sending notifications...${NC}"
        
        if [ $exit_code -eq 0 ]; then
            curl -X POST "$WEBHOOK_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "text": "? AMS API Tests Passed",
                    "sections": [{
                        "activityTitle": "All tests completed successfully",
                        "activitySubtitle": "Environment: '"$ENVIRONMENT"' | Timestamp: '"$TIMESTAMP"'"
                    }]
                }' 2>/dev/null || true
        else
            curl -X POST "$WEBHOOK_URL" \
                -H "Content-Type: application/json" \
                -d '{
                    "text": "? AMS API Tests Failed",
                    "sections": [{
                        "activityTitle": "Some tests failed - check reports",
                        "activitySubtitle": "Environment: '"$ENVIRONMENT"' | Timestamp: '"$TIMESTAMP"'"
                    }]
                }' 2>/dev/null || true
        fi
    fi
}

# Function: Cleanup
cleanup() {
    echo -e "${BLUE}?? Cleaning up...${NC}"
    stop_api
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    setup_directories
    check_prerequisites
    archive_old_reports
    start_api
    
    if run_newman_tests; then
        send_notifications 0
        echo -e "${GREEN}?? Automation completed successfully!${NC}"
        exit 0
    else
        send_notifications 1
        echo -e "${RED}?? Automation completed with errors!${NC}"
        exit 1
    fi
}

# Run main function
main "$@"