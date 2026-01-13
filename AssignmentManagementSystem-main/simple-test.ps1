# Simple API Test
$baseUrl = "http://localhost:5281"
$passed = 0
$failed = 0

Write-Host "`n=== AMS API Test ===" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl`n" -ForegroundColor White

# Test 1: Admin Login
Write-Host "1. Admin Login..." -ForegroundColor Yellow
try {
    $body = '{"email":"admin@ams.com","password":"Admin123!"}'
    $response = Invoke-RestMethod -Uri "$baseUrl/api/Auth/login" -Method POST -Body $body -ContentType "application/json"
    if ($response.data.token) {
        $adminToken = $response.data.token
        Write-Host "   SUCCESS" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   FAILED" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 2: Instructor Dashboard
if ($adminToken) {
    Write-Host "`n2. Instructor Dashboard..." -ForegroundColor Yellow
    try {
        # Login as instructor first
        $instructorBody = '{"email":"yakup.kalay@test.com","password":"Test123!"}'
        $instructorLogin = Invoke-RestMethod -Uri "$baseUrl/api/Auth/login" -Method POST -Body $instructorBody -ContentType "application/json"
        
        if ($instructorLogin.data.token) {
            $instructorToken = $instructorLogin.data.token
            $headers = @{"Authorization"="Bearer $instructorToken"}
            $dashboard = Invoke-RestMethod -Uri "$baseUrl/api/Dashboard/instructor" -Method GET -Headers $headers
            Write-Host "   SUCCESS - Classes: $($dashboard.data.totalClasses), Assignments: $($dashboard.data.totalAssignments)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "   SKIPPED (instructor not found)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Test 3: Get Users
if ($adminToken) {
    Write-Host "`n3. Get All Users..." -ForegroundColor Yellow
    try {
        $headers = @{"Authorization"="Bearer $adminToken"}
        $users = Invoke-RestMethod -Uri "$baseUrl/api/User" -Method GET -Headers $headers
        Write-Host "   SUCCESS - Found $($users.data.Count) users" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "`n"
