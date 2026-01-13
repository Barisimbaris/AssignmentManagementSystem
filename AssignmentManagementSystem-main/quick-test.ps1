# Quick API Test Script
$baseUrl = "http://localhost:5281"
$passed = 0
$failed = 0

Write-Host "`n=== AMS API Quick Test ===" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl`n" -ForegroundColor White

# Test 1: Admin Login
Write-Host "1. Testing Admin Login..." -ForegroundColor Yellow
try {
    $body = @{
        email = "admin@ams.com"
        password = "Admin123!"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/Auth/login" -Method POST -Body $body -ContentType "application/json"
    
    if ($response.data -and $response.data.token) {
        $adminToken = $response.data.token
        Write-Host "   ✓ Admin Login: SUCCESS" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ✗ Admin Login: FAILED" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   ✗ Admin Login: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 2: Instructor Dashboard
if ($adminToken) {
    Write-Host "`n2. Testing Instructor Dashboard..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $adminToken"
        }
        
        # First, try to login as instructor
        $instructorBody = @{
            email = "yakup.kalay@test.com"
            password = "Test123!"
        } | ConvertTo-Json
        
        $instructorLogin = Invoke-RestMethod -Uri "$baseUrl/api/Auth/login" -Method POST -Body $instructorBody -ContentType "application/json"
        
        if ($instructorLogin.data -and $instructorLogin.data.token) {
            $instructorToken = $instructorLogin.data.token
            $instructorHeaders = @{
                "Authorization" = "Bearer $instructorToken"
            }
            
            $dashboard = Invoke-RestMethod -Uri "$baseUrl/api/Dashboard/instructor" -Method GET -Headers $instructorHeaders
            Write-Host "   ✓ Instructor Dashboard: SUCCESS" -ForegroundColor Green
            Write-Host "     - Total Classes: $($dashboard.data.totalClasses)" -ForegroundColor Gray
            Write-Host "     - Total Assignments: $($dashboard.data.totalAssignments)" -ForegroundColor Gray
            $passed++
        } else {
            Write-Host "   ⊘ Instructor Login: SKIPPED (instructor not found)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ✗ Instructor Dashboard: FAILED - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Test 3: Get All Users
if ($adminToken) {
    Write-Host "`n3. Testing Get All Users..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $adminToken"
        }
        $users = Invoke-RestMethod -Uri "$baseUrl/api/User" -Method GET -Headers $headers
        Write-Host "   ✓ Get All Users: SUCCESS (Found $($users.data.Count) users)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "   ✗ Get All Users: FAILED - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Test 4: Get All Courses
if ($adminToken) {
    Write-Host "`n4. Testing Get All Courses..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $adminToken"
        }
        $courses = Invoke-RestMethod -Uri "$baseUrl/api/Course" -Method GET -Headers $headers
        Write-Host "   ✓ Get All Courses: SUCCESS (Found $($courses.data.Count) courses)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "   ✗ Get All Courses: FAILED - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "`n"
