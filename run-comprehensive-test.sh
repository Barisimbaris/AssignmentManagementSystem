#!/bin/bash

# ============================================================================
# AMS COMPREHENSIVE TEST WITH NEWMAN
# ============================================================================

echo "?? Starting AMS Comprehensive Test with Newman..."
echo "================================================================"

# Check if newman is installed
if ! command -v newman &> /dev/null; then
    echo "? Newman not found! Installing..."
    npm install -g newman
fi

# Set environment
export AMS_BASE_URL="http://localhost:5281"

# Check if API is running
echo "?? Checking if AMS API is running..."
response=$(curl -s -o /dev/null -w "%{http_code}" $AMS_BASE_URL/api/Auth/login || echo "000")

if [ "$response" != "400" ] && [ "$response" != "200" ]; then
    echo "? AMS API is not running at $AMS_BASE_URL"
    echo "?? Please start the API first: dotnet run --project src/AMS.API"
    exit 1
fi

echo "? AMS API is running!"

# Run Newman tests
echo "?? Running comprehensive test collection..."

newman run newman/ams-comprehensive-test.json \
    --environment newman/ams-environment.json \
    --reporters cli,html \
    --reporter-html-export test-report.html \
    --delay-request 1000 \
    --timeout-request 30000 \
    --insecure \
    --color on

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo "================================================================"
    echo "?? ALL TESTS PASSED SUCCESSFULLY!"
    echo "================================================================"
    echo "?? Test report generated: test-report.html"
    echo "?? You can view the detailed report by opening test-report.html"
    echo ""
    echo "?? TESTED FEATURES:"
    echo "? Admin & User Management"
    echo "? Instructor & Student Creation"
    echo "? Course & Class Management" 
    echo "? Assignment Creation (Individual & Group)"
    echo "? Group Management System"
    echo "? Submission System"
    echo "? Instructor Dashboard"
    echo "? Statistics & Analytics"
    echo ""
    echo "?? System is ready for production!"
else
    echo ""
    echo "? SOME TESTS FAILED!"
    echo "?? Check test-report.html for detailed information"
    exit 1
fi