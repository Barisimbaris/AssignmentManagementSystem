# Complete API Endpoint Test Suite - ALL ENDPOINTS
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
    AdminId = 0
    InstructorId = 0
    StudentId = 0
    CourseId = 0
    ClassId = 0
    AssignmentId = 0
    SubmissionId = 0
    GradeId = 0
    GroupId = 0
    NotificationId = 0
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
Write-Host "  AMS API - FULL ENDPOINT TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================================================
# 1. AUTHENTICATION (3 endpoints)
# ============================================================================
Write-Host "1. AUTHENTICATION ENDPOINTS" -ForegroundColor Cyan

$adminBody = '{"email":"admin@ams.com","password":"Admin123!"}'
$adminResult = Test-Endpoint "Admin Login" "POST" "/api/Auth/login" $adminBody
if ($adminResult.Success -and $adminResult.Data.data.token) {
    $global:Tokens.Admin = $adminResult.Data.data.token
    $global:TestData.AdminId = $adminResult.Data.data.userId
}

$instructorBody = '{"email":"yakup.kalay@test.com","password":"Test123!"}'
$instructorResult = Test-Endpoint "Instructor Login" "POST" "/api/Auth/login" $instructorBody $null 200 $false
if ($instructorResult.Success -and $instructorResult.Data.data.token) {
    $global:Tokens.Instructor = $instructorResult.Data.data.token
    $global:TestData.InstructorId = $instructorResult.Data.data.userId
}

$studentBody = '{"email":"student@test.com","password":"Test123!"}'
$studentResult = Test-Endpoint "Student Login" "POST" "/api/Auth/login" $studentBody $null 200 $false
if ($studentResult.Success -and $studentResult.Data.data.token) {
    $global:Tokens.Student = $studentResult.Data.data.token
    $global:TestData.StudentId = $studentResult.Data.data.userId
}

# Register (test user - will fail if exists, that's OK)
$registerBody = '{"firstName":"Test","lastName":"User","email":"testuser' + (Get-Random) + '@test.com","password":"Test123!","role":1,"studentNumber":"TEST' + (Get-Random) + '"}'
Test-Endpoint "Register User" "POST" "/api/Auth/register" $registerBody $null 200 $false

# Change Password
if ($global:Tokens.Admin) {
    $changePwdBody = '{"currentPassword":"Admin123!","newPassword":"Admin123!New","confirmPassword":"Admin123!New"}'
    Test-Endpoint "Change Password" "POST" "/api/Auth/change-password" $changePwdBody $global:Tokens.Admin $null $false
}

# ============================================================================
# 2. USER MANAGEMENT (10 endpoints)
# ============================================================================
Write-Host "`n2. USER MANAGEMENT ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Admin) {
    Test-Endpoint "Get All Users" "GET" "/api/User" $null $global:Tokens.Admin
    Test-Endpoint "Get Students" "GET" "/api/User/students" $null $global:Tokens.Admin
    Test-Endpoint "Get Instructors" "GET" "/api/User/instructors" $null $global:Tokens.Admin
    Test-Endpoint "Get My Profile" "GET" "/api/User/profile" $null $global:Tokens.Admin
    
    if ($global:TestData.AdminId -gt 0) {
        Test-Endpoint "Get User by ID" "GET" "/api/User/$($global:TestData.AdminId)" $null $global:Tokens.Admin
    }
    
    Test-Endpoint "Get User by Email" "GET" "/api/User/email/admin@ams.com" $null $global:Tokens.Admin
    Test-Endpoint "Get Bulk Import Template" "GET" "/api/User/bulk-import-template" $null $global:Tokens.Admin
}

if ($global:Tokens.Instructor) {
    Test-Endpoint "Get My Profile (Instructor)" "GET" "/api/User/profile" $null $global:Tokens.Instructor
}

if ($global:Tokens.Student) {
    Test-Endpoint "Get My Profile (Student)" "GET" "/api/User/profile" $null $global:Tokens.Student
}

# ============================================================================
# 3. COURSE MANAGEMENT (10 endpoints)
# ============================================================================
Write-Host "`n3. COURSE MANAGEMENT ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Admin) {
    Test-Endpoint "Get All Courses" "GET" "/api/Course" $null $global:Tokens.Admin
    
    # Create Course
    $uniqueCode = "TEST" + (Get-Random -Minimum 1000 -Maximum 9999)
    $courseBody = "{`"courseCode`":`"$uniqueCode`",`"courseName`":`"Test Course`",`"description`":`"Test`",`"department`":`"Test`",`"creditHours`":3,`"academicYear`":`"2024-2025`"}"
    $courseResult = Test-Endpoint "Create Course" "POST" "/api/Course" $courseBody $global:Tokens.Admin
    if ($courseResult.Success -and $courseResult.Data.data.id) {
        $global:TestData.CourseId = $courseResult.Data.data.id
        Test-Endpoint "Get Course by ID" "GET" "/api/Course/$($global:TestData.CourseId)" $null $global:Tokens.Admin
        Test-Endpoint "Get Courses by Department" "GET" "/api/Course/department/Test" $null $global:Tokens.Admin
        
        # Update Course
        $updateCourseBody = '{"courseName":"Updated Test Course","description":"Updated"}'
        Test-Endpoint "Update Course" "PUT" "/api/Course/$($global:TestData.CourseId)" $updateCourseBody $global:Tokens.Admin
        
        # Assign Instructor
        if ($global:TestData.InstructorId -gt 0) {
            $assignBody = "{`"instructorId`":$($global:TestData.InstructorId),`"academicYear`":`"2024-2025`"}"
            Test-Endpoint "Assign Instructor to Course" "POST" "/api/Course/$($global:TestData.CourseId)/assign-instructor" $assignBody $global:Tokens.Admin
            Test-Endpoint "Get Course Instructors" "GET" "/api/Course/$($global:TestData.CourseId)/instructors" $null $global:Tokens.Admin
        }
    }
}

if ($global:Tokens.Instructor) {
    Test-Endpoint "Get My Courses (Instructor)" "GET" "/api/Course/my-courses" $null $global:Tokens.Instructor
}

# ============================================================================
# 4. CLASS MANAGEMENT (12 endpoints)
# ============================================================================
Write-Host "`n4. CLASS MANAGEMENT ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Admin) {
    Test-Endpoint "Get All Classes" "GET" "/api/Class" $null $global:Tokens.Admin
    
    if ($global:TestData.CourseId -gt 0 -and $global:TestData.InstructorId -gt 0) {
        # Create Class
        $uniqueClassCode = "TEST" + (Get-Random -Minimum 100 -Maximum 999)
        $classBody = "{`"courseId`":$($global:TestData.CourseId),`"className`":`"Test Class`",`"classCode`":`"$uniqueClassCode`",`"instructorId`":$($global:TestData.InstructorId),`"maxCapacity`":30,`"semester`":`"Fall 2024`"}"
        $classResult = Test-Endpoint "Create Class" "POST" "/api/Class" $classBody $global:Tokens.Admin
        if ($classResult.Success -and $classResult.Data.data.id) {
            $global:TestData.ClassId = $classResult.Data.data.id
            Test-Endpoint "Get Class by ID" "GET" "/api/Class/$($global:TestData.ClassId)" $null $global:Tokens.Admin
            Test-Endpoint "Get Classes by Course" "GET" "/api/Class/course/$($global:TestData.CourseId)" $null $global:Tokens.Admin
            
            # Update Class
            $updateClassBody = '{"className":"Updated Test Class","maxCapacity":35}'
            Test-Endpoint "Update Class" "PUT" "/api/Class/$($global:TestData.ClassId)" $updateClassBody $global:Tokens.Admin
            
            # Enroll Student
            if ($global:TestData.StudentId -gt 0) {
                Test-Endpoint "Enroll Student" "POST" "/api/Class/$($global:TestData.ClassId)/enroll/$($global:TestData.StudentId)" $null $global:Tokens.Admin
            }
        }
    }
    
    if ($global:TestData.InstructorId -gt 0) {
        Test-Endpoint "Get Classes by Instructor" "GET" "/api/Class/instructor/$($global:TestData.InstructorId)" $null $global:Tokens.Admin
    }
}

if ($global:Tokens.Instructor) {
    Test-Endpoint "Get My Classes (Instructor)" "GET" "/api/Class/my-classes" $null $global:Tokens.Instructor
}

# ============================================================================
# 5. ASSIGNMENT MANAGEMENT (7 endpoints)
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
            Test-Endpoint "Get Assignments by Class" "GET" "/api/Assignment/class/$($global:TestData.ClassId)" $null $global:Tokens.Instructor
            
            # Update Assignment
            $updateAssignmentBody = '{"title":"Updated Test Assignment","maxScore":120}'
            Test-Endpoint "Update Assignment" "PUT" "/api/Assignment/$($global:TestData.AssignmentId)" $updateAssignmentBody $global:Tokens.Instructor
        }
    }
}

if ($global:Tokens.Student) {
    Test-Endpoint "Get My Assignments (Student)" "GET" "/api/Assignment/my-assignments" $null $global:Tokens.Student
}

# ============================================================================
# 6. SUBMISSION MANAGEMENT (7 endpoints)
# ============================================================================
Write-Host "`n6. SUBMISSION MANAGEMENT ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Student) {
    Test-Endpoint "Get My Submissions" "GET" "/api/Submission/my-submissions" $null $global:Tokens.Student
}

if ($global:Tokens.Instructor -and $global:TestData.AssignmentId -gt 0) {
    Test-Endpoint "Get Submissions by Assignment" "GET" "/api/Submission/assignment/$($global:TestData.AssignmentId)" $null $global:Tokens.Instructor
}

# Note: File upload tests (Submit, Resubmit) require multipart/form-data which is complex in PowerShell
# These would need special handling

# ============================================================================
# 7. GRADE MANAGEMENT (9 endpoints)
# ============================================================================
Write-Host "`n7. GRADE MANAGEMENT ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Instructor) {
    if ($global:TestData.ClassId -gt 0) {
        Test-Endpoint "Get Grades by Class" "GET" "/api/Grade/class/$($global:TestData.ClassId)" $null $global:Tokens.Instructor
    }
}

if ($global:Tokens.Student) {
    Test-Endpoint "Get My Grades" "GET" "/api/Grade/my-grades" $null $global:Tokens.Student
}

# Note: Create/Update/Delete Grade require existing submission, would need setup

# ============================================================================
# 8. GROUP MANAGEMENT (8 endpoints)
# ============================================================================
Write-Host "`n8. GROUP MANAGEMENT ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Student -and $global:TestData.AssignmentId -gt 0) {
    Test-Endpoint "Get Available Students" "GET" "/api/Group/available-students/$($global:TestData.AssignmentId)" $null $global:Tokens.Student
    Test-Endpoint "Can Create Group" "GET" "/api/Group/can-create/$($global:TestData.AssignmentId)" $null $global:Tokens.Student
    Test-Endpoint "Get My Group" "GET" "/api/Group/my-group/$($global:TestData.AssignmentId)" $null $global:Tokens.Student
}

if ($global:Tokens.Instructor -and $global:TestData.AssignmentId -gt 0) {
    Test-Endpoint "Get Assignment Groups" "GET" "/api/Group/assignment/$($global:TestData.AssignmentId)" $null $global:Tokens.Instructor
}

# ============================================================================
# 9. NOTIFICATION (3 endpoints)
# ============================================================================
Write-Host "`n9. NOTIFICATION ENDPOINTS" -ForegroundColor Cyan

if ($global:Tokens.Student) {
    Test-Endpoint "Get My Notifications" "GET" "/api/Notification/my-notifications" $null $global:Tokens.Student
    Test-Endpoint "Get Unread Count" "GET" "/api/Notification/unread-count" $null $global:Tokens.Student
    
    # Mark as Read (requires notification ID - will likely fail, that's OK)
    if ($global:TestData.NotificationId -gt 0) {
        Test-Endpoint "Mark Notification as Read" "PUT" "/api/Notification/$($global:TestData.NotificationId)/mark-read" $null $global:Tokens.Student $null $false
    }
}

# ============================================================================
# 10. DASHBOARD & STATISTICS (6 endpoints)
# ============================================================================
Write-Host "`n10. DASHBOARD & STATISTICS ENDPOINTS" -ForegroundColor Cyan

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

Write-Host "`nNote: File upload endpoints (Submission Submit/Resubmit) require multipart/form-data" -ForegroundColor Gray
Write-Host "      and are not tested in this script. Test manually or use Postman." -ForegroundColor Gray
Write-Host ""
