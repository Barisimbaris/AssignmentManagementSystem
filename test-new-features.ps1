# Test New Features: ClassSchedule and Instructor Students
$baseUrl = "http://localhost:5281"
$passed = 0
$failed = 0
$skipped = 0
$total = 0

$global:Tokens = @{
    Admin = ""
    Instructor = ""
    Student = ""
}

$global:TestData = @{
    InstructorId = 0
    ClassId = 0
    ScheduleId = 0
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [string]$Body = $null,
        [string]$Token = "",
        [int]$ExpectedStatus = 200,
        [bool]$Required = $true
    )
    
    $script:total++
    Write-Host "  Testing: $Name..." -ForegroundColor Yellow -NoNewline
    
    try {
        $headers = @{"Content-Type" = "application/json"}
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        if ($Body) {
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method -Headers $headers -Body $Body -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method -Headers $headers -ErrorAction Stop
        }
        
        Write-Host " PASSED" -ForegroundColor Green
        $script:passed++
        return @{ Success = $true; Data = $response }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host " PASSED (Expected $ExpectedStatus)" -ForegroundColor Green
            $script:passed++
            return @{ Success = $true }
        } else {
            if ($Required) {
                Write-Host " FAILED ($statusCode)" -ForegroundColor Red
                Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
                $script:failed++
            } else {
                Write-Host " SKIPPED" -ForegroundColor Gray
                $script:skipped++
            }
            return @{ Success = $false; Error = $_.Exception.Message }
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  NEW FEATURES TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================================================
# 1. AUTHENTICATION
# ============================================================================
Write-Host "1. AUTHENTICATION" -ForegroundColor Cyan

$instructorBody = '{"email":"yakup.kalay@test.com","password":"Test123!"}'
$instructorResult = Test-Endpoint "Instructor Login" "POST" "/api/Auth/login" $instructorBody
if ($instructorResult.Success -and $instructorResult.Data.data.token) {
    $global:Tokens.Instructor = $instructorResult.Data.data.token
    $global:TestData.InstructorId = $instructorResult.Data.data.userId
}

$adminBody = '{"email":"admin@ams.com","password":"Admin123!"}'
$adminResult = Test-Endpoint "Admin Login" "POST" "/api/Auth/login" $adminBody
if ($adminResult.Success -and $adminResult.Data.data.token) {
    $global:Tokens.Admin = $adminResult.Data.data.token
}

# ============================================================================
# 2. INSTRUCTOR STUDENTS ENDPOINT
# ============================================================================
Write-Host "`n2. INSTRUCTOR STUDENTS ENDPOINT" -ForegroundColor Cyan

if ($global:Tokens.Instructor) {
    Test-Endpoint "Get My Students (Instructor)" "GET" "/api/User/my-students" $null $global:Tokens.Instructor
}

# ============================================================================
# 3. CLASS SCHEDULE ENDPOINTS
# ============================================================================
Write-Host "`n3. CLASS SCHEDULE ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Instructor) {
    # Get instructor's classes first
    $classesResult = Test-Endpoint "Get My Classes" "GET" "/api/Class/my-classes" $null $global:Tokens.Instructor
    if ($classesResult.Success -and $classesResult.Data.data -and $classesResult.Data.data.Count -gt 0) {
        $global:TestData.ClassId = $classesResult.Data.data[0].id
        
        # Get schedules for class
        Test-Endpoint "Get Schedules by Class" "GET" "/api/ClassSchedule/class/$($global:TestData.ClassId)" $null $global:Tokens.Instructor
        
        # Get my schedules
        Test-Endpoint "Get My Schedules" "GET" "/api/ClassSchedule/my-schedules" $null $global:Tokens.Instructor
        
        # Get weekly schedule
        Test-Endpoint "Get Weekly Schedule" "GET" "/api/ClassSchedule/class/$($global:TestData.ClassId)/weekly" $null $global:Tokens.Instructor
        
        # Create schedule (DayOfWeek: 1 = Monday)
        $scheduleBody = "{`"classId`":$($global:TestData.ClassId),`"dayOfWeek`":1,`"startTime`":`"09:00:00`",`"endTime`":`"10:30:00`",`"roomNumber`":`"A-101`",`"building`":`"Main Building`",`"notes`":`"Test Schedule`",`"isActive`":true}"
        $scheduleResult = Test-Endpoint "Create Schedule" "POST" "/api/ClassSchedule" $scheduleBody $global:Tokens.Instructor
        if ($scheduleResult.Success -and $scheduleResult.Data.data.id) {
            $global:TestData.ScheduleId = $scheduleResult.Data.data.id
            
            # Get schedule by ID
            Test-Endpoint "Get Schedule by ID" "GET" "/api/ClassSchedule/$($global:TestData.ScheduleId)" $null $global:Tokens.Instructor
            
            # Update schedule
            $updateScheduleBody = "{`"dayOfWeek`":1,`"startTime`":`"09:00:00`",`"endTime`":`"11:00:00`",`"roomNumber`":`"A-102`",`"building`":`"Main Building`",`"notes`":`"Updated Schedule`",`"isActive`":true}"
            Test-Endpoint "Update Schedule" "PUT" "/api/ClassSchedule/$($global:TestData.ScheduleId)" $updateScheduleBody $global:Tokens.Instructor
        }
    } else {
        Write-Host "  ⚠️  No classes found for instructor. Skipping schedule tests." -ForegroundColor Yellow
    }
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests:  $total" -ForegroundColor White
Write-Host "Passed:      $passed" -ForegroundColor Green
Write-Host "Failed:      $failed" -ForegroundColor Red
Write-Host "Skipped:     $skipped" -ForegroundColor Gray

$passRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }
Write-Host "Pass Rate:   $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 50) { "Yellow" } else { "Red" })

if ($failed -eq 0) {
    Write-Host ""
    Write-Host "All tests passed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Some tests failed. Review output above." -ForegroundColor Red
}

Write-Host ""
