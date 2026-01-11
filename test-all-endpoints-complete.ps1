# Complete API Endpoint Test Suite
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
    CourseId = 0
    ClassId = 0
    AssignmentId = 0
    SubmissionId = 0
    GradeId = 0
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
Write-Host "  AMS API - Complete Endpoint Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================================================
# 1. AUTHENTICATION
# ============================================================================
Write-Host "1. AUTHENTICATION ENDPOINTS" -ForegroundColor Cyan

$adminBody = '{"email":"admin@ams.com","password":"Admin123!"}'
$adminResult = Test-Endpoint "Admin Login" "POST" "/api/Auth/login" $adminBody
if ($adminResult.Success -and $adminResult.Data.data.token) {
    $global:Tokens.Admin = $adminResult.Data.data.token
}

$instructorBody = '{"email":"yakup.kalay@test.com","password":"Test123!"}'
$instructorResult = Test-Endpoint "Instructor Login" "POST" "/api/Auth/login" $instructorBody $null 200 $false
if ($instructorResult.Success -and $instructorResult.Data.data.token) {
    $global:Tokens.Instructor = $instructorResult.Data.data.token
}

$studentBody = '{"email":"student@test.com","password":"Test123!"}'
$studentResult = Test-Endpoint "Student Login" "POST" "/api/Auth/login" $studentBody $null 200 $false
if ($studentResult.Success -and $studentResult.Data.data.token) {
    $global:Tokens.Student = $studentResult.Data.data.token
}

# ============================================================================
# 2. USER MANAGEMENT
# ============================================================================
Write-Host "`n2. USER MANAGEMENT ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Admin) {
    Test-Endpoint "Get All Users" "GET" "/api/User" $null $global:Tokens.Admin
    Test-Endpoint "Get Students" "GET" "/api/User/students" $null $global:Tokens.Admin
    Test-Endpoint "Get Instructors" "GET" "/api/User/instructors" $null $global:Tokens.Admin
    Test-Endpoint "Get My Profile" "GET" "/api/User/profile" $null $global:Tokens.Admin
}

# ============================================================================
# 3. COURSE MANAGEMENT
# ============================================================================
Write-Host "`n3. COURSE MANAGEMENT ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Admin) {
    Test-Endpoint "Get All Courses" "GET" "/api/Course" $null $global:Tokens.Admin
    
    # Create Course (with unique code)
    $uniqueCode = "TEST" + (Get-Random -Minimum 1000 -Maximum 9999)
    $courseBody = "{`"courseCode`":`"$uniqueCode`",`"courseName`":`"Test Course`",`"description`":`"Test`",`"department`":`"Test`",`"creditHours`":3,`"academicYear`":`"2024-2025`"}"
    $courseResult = Test-Endpoint "Create Course" "POST" "/api/Course" $courseBody $global:Tokens.Admin
    if ($courseResult.Success -and $courseResult.Data.data.id) {
        $global:TestData.CourseId = $courseResult.Data.data.id
        Test-Endpoint "Get Course by ID" "GET" "/api/Course/$($global:TestData.CourseId)" $null $global:Tokens.Admin
    }
}

# ============================================================================
# 4. CLASS MANAGEMENT
# ============================================================================
Write-Host "`n4. CLASS MANAGEMENT ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Admin) {
    Test-Endpoint "Get All Classes" "GET" "/api/Class" $null $global:Tokens.Admin
    
    if ($global:TestData.CourseId -gt 0 -and $global:Tokens.Instructor) {
        # Get instructor ID from login response
        if ($instructorResult.Success) {
            $instructorId = $instructorResult.Data.data.userId
            $classBody = "{`"courseId`":$($global:TestData.CourseId),`"className`":`"Test Class`",`"classCode`":`"TEST101-01`",`"instructorId`":$instructorId,`"maxCapacity`":30,`"semester`":`"Fall 2024`"}"
            $classResult = Test-Endpoint "Create Class" "POST" "/api/Class" $classBody $global:Tokens.Admin
            if ($classResult.Success -and $classResult.Data.data.id) {
                $global:TestData.ClassId = $classResult.Data.data.id
                Test-Endpoint "Get Class by ID" "GET" "/api/Class/$($global:TestData.ClassId)" $null $global:Tokens.Admin
            }
        }
    }
}

if ($global:Tokens.Instructor) {
    Test-Endpoint "Get My Classes (Instructor)" "GET" "/api/Class/my-classes" $null $global:Tokens.Instructor
}

# ============================================================================
# 5. ASSIGNMENT MANAGEMENT
# ============================================================================
Write-Host "`n5. ASSIGNMENT MANAGEMENT ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Instructor) {
    Test-Endpoint "Get All Assignments" "GET" "/api/Assignment" $null $global:Tokens.Instructor
    
    if ($global:TestData.ClassId -gt 0) {
        $dueDate = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ssZ")
        $assignmentBody = "{`"title`":`"Test Assignment`",`"description`":`"Test`",`"classId`":$($global:TestData.ClassId),`"type`":1,`"dueDate`":`"$dueDate`",`"maxScore`":100,`"allowLateSubmission`":true,`"allowResubmission`":false}"
        $assignmentResult = Test-Endpoint "Create Assignment" "POST" "/api/Assignment" $assignmentBody $global:Tokens.Instructor
        if ($assignmentResult.Success -and $assignmentResult.Data.data.id) {
            $global:TestData.AssignmentId = $assignmentResult.Data.data.id
            Test-Endpoint "Get Assignment by ID" "GET" "/api/Assignment/$($global:TestData.AssignmentId)" $null $global:Tokens.Instructor
        }
    }
}

if ($global:Tokens.Student) {
    Test-Endpoint "Get My Assignments (Student)" "GET" "/api/Assignment/my-assignments" $null $global:Tokens.Student
}

# ============================================================================
# 6. DASHBOARD & STATISTICS
# ============================================================================
Write-Host "`n6. DASHBOARD & STATISTICS ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Admin) {
    Test-Endpoint "Admin Dashboard" "GET" "/api/Dashboard/admin" $null $global:Tokens.Admin
    Test-Endpoint "Course Statistics" "GET" "/api/Dashboard/statistics/courses" $null $global:Tokens.Admin
    Test-Endpoint "Department Statistics" "GET" "/api/Dashboard/statistics/departments" $null $global:Tokens.Admin
}

if ($global:Tokens.Instructor) {
    Test-Endpoint "Instructor Dashboard" "GET" "/api/Dashboard/instructor" $null $global:Tokens.Instructor
    Test-Endpoint "My Class Statistics" "GET" "/api/Dashboard/statistics/my-classes" $null $global:Tokens.Instructor
}

if ($global:Tokens.Student) {
    Test-Endpoint "Student Dashboard" "GET" "/api/Dashboard/student" $null $global:Tokens.Student
}

# ============================================================================
# 7. NOTIFICATION
# ============================================================================
Write-Host "`n7. NOTIFICATION ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Student) {
    Test-Endpoint "Get My Notifications" "GET" "/api/Notification/my-notifications" $null $global:Tokens.Student
    Test-Endpoint "Get Unread Count" "GET" "/api/Notification/unread-count" $null $global:Tokens.Student
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
