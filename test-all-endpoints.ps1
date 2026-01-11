# ============================================================================
# AMS API - COMPREHENSIVE ENDPOINT TEST SUITE
# ============================================================================
# Bu script tüm API endpoint'lerini otomatik olarak test eder
# Kullanım: .\test-all-endpoints.ps1

param(
    [string]$BaseUrl = "http://localhost:5281",
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"
$global:TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Skipped = 0
    Details = @()
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n" -NoNewline
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "=" * 80 -ForegroundColor Cyan
}

function Write-TestStep {
    param([string]$Message)
    Write-Host "  → $Message" -ForegroundColor Yellow
}

function Write-TestPass {
    param([string]$Message)
    Write-Host "  ✓ $Message" -ForegroundColor Green
    $global:TestResults.Passed++
    $global:TestResults.Total++
}

function Write-TestFail {
    param([string]$Message, [string]$Error = "")
    Write-Host "  ✗ $Message" -ForegroundColor Red
    if ($Error) {
        Write-Host "    Error: $Error" -ForegroundColor DarkRed
    }
    $global:TestResults.Failed++
    $global:TestResults.Total++
}

function Write-TestSkip {
    param([string]$Message)
    Write-Host "  ⊘ $Message" -ForegroundColor Gray
    $global:TestResults.Skipped++
    $global:TestResults.Total++
}

function Invoke-ApiTest {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = "",
        [int]$ExpectedStatus = 200,
        [scriptblock]$Validation = $null,
        [bool]$Required = $true
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        $uri = "$BaseUrl$Endpoint"
        if ($Verbose) {
            Write-Host "    [DEBUG] $Method $uri" -ForegroundColor DarkGray
        }
        
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10 -Compress
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $jsonBody -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -ErrorAction Stop
        }
        
        $statusCode = 200
        if ($response -is [System.Net.HttpWebResponse]) {
            $statusCode = [int]$response.StatusCode
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            if ($Validation) {
                $validationResult = & $Validation $response
                if ($validationResult) {
                    Write-TestPass "$Name"
                    return @{ Success = $true; Data = $response }
                } else {
                    Write-TestFail "$Name" "Validation failed"
                    return @{ Success = $false; Data = $response }
                }
            } else {
                Write-TestPass "$Name"
                return @{ Success = $true; Data = $response }
            }
        } else {
            Write-TestFail "$Name" "Expected status $ExpectedStatus, got $statusCode"
            return @{ Success = $false; Data = $response }
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorMsg = $reader.ReadToEnd()
        }
        
        if ($Required) {
            Write-TestFail "$Name" $errorMsg
            return @{ Success = $false; Error = $errorMsg }
        } else {
            Write-TestSkip "$Name (Optional)"
            return @{ Success = $false; Error = $errorMsg }
        }
    }
}

# ============================================================================
# TEST DATA SETUP
# ============================================================================

Write-TestHeader "AMS API - Comprehensive Endpoint Test Suite"
Write-Host "Base URL: $BaseUrl" -ForegroundColor White
Write-Host "Start Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White

$global:Tokens = @{
    Admin = ""
    Instructor = ""
    Student = ""
}

$global:TestData = @{
    AdminId = 0
    InstructorId = 0
    StudentId = 0
    CourseId = 0
    ClassId = 0
    AssignmentId = 0
    SubmissionId = 0
    GradeId = 0
    GroupId = 0
}

# ============================================================================
# 1. AUTHENTICATION TESTS
# ============================================================================

Write-TestHeader "1. AUTHENTICATION ENDPOINTS"

# 1.1 Admin Login
Write-TestStep "Admin Login"
$adminLogin = Invoke-ApiTest -Name "Admin Login" `
    -Method "POST" `
    -Endpoint "/api/Auth/login" `
    -Body @{
        email = "admin@ams.com"
        password = "Admin123!"
    } `
    -Validation { param($r) 
        if ($r.data -and $r.data.token) {
            $global:Tokens.Admin = $r.data.token
            $global:TestData.AdminId = $r.data.userId
            return $true
        }
        return $false
    }

# 1.2 Instructor Login (or Register if needed)
Write-TestStep "Instructor Login"
$instructorLogin = Invoke-ApiTest -Name "Instructor Login" `
    -Method "POST" `
    -Endpoint "/api/Auth/login" `
    -Body @{
        email = "yakup.kalay@test.com"
        password = "Test123!"
    } `
    -Required $false `
    -Validation { param($r)
        if ($r.data -and $r.data.token) {
            $global:Tokens.Instructor = $r.data.token
            $global:TestData.InstructorId = $r.data.userId
            return $true
        }
        return $false
    }

# 1.3 Student Login (or Register if needed)
Write-TestStep "Student Login"
$studentLogin = Invoke-ApiTest -Name "Student Login" `
    -Method "POST" `
    -Endpoint "/api/Auth/login" `
    -Body @{
        email = "student@ams.com"
        password = "Student123!"
    } `
    -Required $false `
    -Validation { param($r)
        if ($r.data -and $r.data.token) {
            $global:Tokens.Student = $r.data.token
            $global:TestData.StudentId = $r.data.userId
            return $true
        }
        return $false
    }

# ============================================================================
# 2. USER MANAGEMENT TESTS
# ============================================================================

Write-TestHeader "2. USER MANAGEMENT ENDPOINTS"

if ($global:Tokens.Admin) {
    # 2.1 Get All Users
    Write-TestStep "Get All Users"
    Invoke-ApiTest -Name "Get All Users" `
        -Method "GET" `
        -Endpoint "/api/User" `
        -Token $global:Tokens.Admin
    
    # 2.2 Get Students
    Write-TestStep "Get Students"
    Invoke-ApiTest -Name "Get Students" `
        -Method "GET" `
        -Endpoint "/api/User/students" `
        -Token $global:Tokens.Admin
    
    # 2.3 Get Instructors
    Write-TestStep "Get Instructors"
    Invoke-ApiTest -Name "Get Instructors" `
        -Method "GET" `
        -Endpoint "/api/User/instructors" `
        -Token $global:Tokens.Admin
    
    # 2.4 Get My Profile
    Write-TestStep "Get My Profile (Admin)"
    Invoke-ApiTest -Name "Get My Profile" `
        -Method "GET" `
        -Endpoint "/api/User/me" `
        -Token $global:Tokens.Admin
}

# ============================================================================
# 3. COURSE MANAGEMENT TESTS
# ============================================================================

Write-TestHeader "3. COURSE MANAGEMENT ENDPOINTS"

if ($global:Tokens.Admin) {
    # 3.1 Create Course
    Write-TestStep "Create Course"
    $courseCreate = Invoke-ApiTest -Name "Create Course" `
        -Method "POST" `
        -Endpoint "/api/Course" `
        -Token $global:Tokens.Admin `
        -Body @{
            courseCode = "TEST101"
            courseName = "Test Course"
            description = "Test course description"
            department = "Test Department"
            creditHours = 3
            academicYear = "2024-2025"
        } `
        -Validation { param($r)
            if ($r.data -and $r.data.id) {
                $global:TestData.CourseId = $r.data.id
                return $true
            }
            return $false
        }
    
    # 3.2 Get All Courses
    Write-TestStep "Get All Courses"
    Invoke-ApiTest -Name "Get All Courses" `
        -Method "GET" `
        -Endpoint "/api/Course" `
        -Token $global:Tokens.Admin
    
    # 3.3 Get Course by ID
    if ($global:TestData.CourseId -gt 0) {
        Write-TestStep "Get Course by ID"
        Invoke-ApiTest -Name "Get Course by ID" `
            -Method "GET" `
            -Endpoint "/api/Course/$($global:TestData.CourseId)" `
            -Token $global:Tokens.Admin
    }
}

# ============================================================================
# 4. CLASS MANAGEMENT TESTS
# ============================================================================

Write-TestHeader "4. CLASS MANAGEMENT ENDPOINTS"

if ($global:Tokens.Admin -and $global:TestData.CourseId -gt 0 -and $global:TestData.InstructorId -gt 0) {
    # 4.1 Create Class
    Write-TestStep "Create Class"
    $classCreate = Invoke-ApiTest -Name "Create Class" `
        -Method "POST" `
        -Endpoint "/api/Class" `
        -Token $global:Tokens.Admin `
        -Body @{
            courseId = $global:TestData.CourseId
            className = "Test Class"
            classCode = "TEST101-01"
            instructorId = $global:TestData.InstructorId
            maxCapacity = 30
            semester = "Fall 2024"
        } `
        -Validation { param($r)
            if ($r.data -and $r.data.id) {
                $global:TestData.ClassId = $r.data.id
                return $true
            }
            return $false
        }
    
    # 4.2 Get All Classes
    Write-TestStep "Get All Classes"
    Invoke-ApiTest -Name "Get All Classes" `
        -Method "GET" `
        -Endpoint "/api/Class" `
        -Token $global:Tokens.Admin
    
    # 4.3 Get Class by ID
    if ($global:TestData.ClassId -gt 0) {
        Write-TestStep "Get Class by ID"
        Invoke-ApiTest -Name "Get Class by ID" `
            -Method "GET" `
            -Endpoint "/api/Class/$($global:TestData.ClassId)" `
            -Token $global:Tokens.Admin
    }
}

# ============================================================================
# 5. ASSIGNMENT MANAGEMENT TESTS
# ============================================================================

Write-TestHeader "5. ASSIGNMENT MANAGEMENT ENDPOINTS"

if ($global:Tokens.Instructor -and $global:TestData.ClassId -gt 0) {
    # 5.1 Create Assignment
    Write-TestStep "Create Assignment"
    $assignmentCreate = Invoke-ApiTest -Name "Create Assignment" `
        -Method "POST" `
        -Endpoint "/api/Assignment" `
        -Token $global:Tokens.Instructor `
        -Body @{
            title = "Test Assignment"
            description = "Test assignment description"
            classId = $global:TestData.ClassId
            type = 1
            dueDate = (Get-Date).AddDays(30).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            maxScore = 100
            allowLateSubmission = $true
            allowResubmission = $false
        } `
        -Validation { param($r)
            if ($r.data -and $r.data.id) {
                $global:TestData.AssignmentId = $r.data.id
                return $true
            }
            return $false
        }
    
    # 5.2 Get All Assignments
    Write-TestStep "Get All Assignments"
    Invoke-ApiTest -Name "Get All Assignments" `
        -Method "GET" `
        -Endpoint "/api/Assignment" `
        -Token $global:Tokens.Instructor
    
    # 5.3 Get Assignment by ID
    if ($global:TestData.AssignmentId -gt 0) {
        Write-TestStep "Get Assignment by ID"
        Invoke-ApiTest -Name "Get Assignment by ID" `
            -Method "GET" `
            -Endpoint "/api/Assignment/$($global:TestData.AssignmentId)" `
            -Token $global:Tokens.Instructor
    }
}

# ============================================================================
# 6. DASHBOARD TESTS
# ============================================================================

Write-TestHeader "6. DASHBOARD AND STATISTICS ENDPOINTS"

# 6.1 Admin Dashboard
if ($global:Tokens.Admin) {
    Write-TestStep "Admin Dashboard"
    Invoke-ApiTest -Name "Admin Dashboard" `
        -Method "GET" `
        -Endpoint "/api/Dashboard/admin" `
        -Token $global:Tokens.Admin
}

# 6.2 Instructor Dashboard
if ($global:Tokens.Instructor) {
    Write-TestStep "Instructor Dashboard"
    Invoke-ApiTest -Name "Instructor Dashboard" `
        -Method "GET" `
        -Endpoint "/api/Dashboard/instructor" `
        -Token $global:Tokens.Instructor
}

# 6.3 Student Dashboard
if ($global:Tokens.Student) {
    Write-TestStep "Student Dashboard"
    Invoke-ApiTest -Name "Student Dashboard" `
        -Method "GET" `
        -Endpoint "/api/Dashboard/student" `
        -Token $global:Tokens.Student
}

# 6.4 Course Statistics
if ($global:Tokens.Admin) {
    Write-TestStep "Course Statistics"
    Invoke-ApiTest -Name "Course Statistics" `
        -Method "GET" `
        -Endpoint "/api/Dashboard/statistics/courses" `
        -Token $global:Tokens.Admin
}

# 6.5 Department Statistics
if ($global:Tokens.Admin) {
    Write-TestStep "Department Statistics"
    Invoke-ApiTest -Name "Department Statistics" `
        -Method "GET" `
        -Endpoint "/api/Dashboard/statistics/departments" `
        -Token $global:Tokens.Admin
}

# 6.6 My Class Statistics (Instructor)
if ($global:Tokens.Instructor) {
    Write-TestStep "My Class Statistics"
    Invoke-ApiTest -Name "My Class Statistics" `
        -Method "GET" `
        -Endpoint "/api/Dashboard/statistics/my-classes" `
        -Token $global:Tokens.Instructor
}

# ============================================================================
# 7. NOTIFICATION TESTS
# ============================================================================

Write-TestHeader "7. NOTIFICATION ENDPOINTS"

if ($global:Tokens.Student) {
    # 7.1 Get My Notifications
    Write-TestStep "Get My Notifications"
    Invoke-ApiTest -Name "Get My Notifications" `
        -Method "GET" `
        -Endpoint "/api/Notification/my-notifications" `
        -Token $global:Tokens.Student
    
    # 7.2 Get Unread Count
    Write-TestStep "Get Unread Count"
    Invoke-ApiTest -Name "Get Unread Count" `
        -Method "GET" `
        -Endpoint "/api/Notification/unread-count" `
        -Token $global:Tokens.Student
}

# ============================================================================
# FINAL SUMMARY
# ============================================================================

Write-TestHeader "TEST SUMMARY"

$total = $global:TestResults.Total
$passed = $global:TestResults.Passed
$failed = $global:TestResults.Failed
$skipped = $global:TestResults.Skipped
$passRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }

Write-Host "  Total Tests:  $total" -ForegroundColor White
Write-Host "  Passed:       $passed" -ForegroundColor Green
Write-Host "  Failed:       $failed" -ForegroundColor Red
Write-Host "  Skipped:      $skipped" -ForegroundColor Gray
Write-Host "  Pass Rate:    $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 50) { "Yellow" } else { "Red" })

Write-Host "`n  End Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White

if ($failed -eq 0) {
    Write-Host "`n  ✓ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n  ✗ Some tests failed. Please review the output above." -ForegroundColor Red
}

Write-Host "`n" -NoNewline
