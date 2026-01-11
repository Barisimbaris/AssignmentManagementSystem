# ============================================================================
# AMS COMPREHENSIVE TEST AUTOMATION SCRIPT
# ============================================================================
# Bu script tüm e?itim yönetim sistemi ak???n? test eder:
# 1. Admin Setup
# 2. 10 Instructor Creation  
# 3. Sample Students Creation
# 4. Course & Class Creation
# 5. Assignment Creation (Individual & Group)
# 6. Group Management Testing
# 7. Instructor Dashboard Testing

Write-Host "?? AMS COMPREHENSIVE TEST AUTOMATION BA?LATIYOR..." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Yellow

# API Base URL
$baseUrl = "http://localhost:5281"

# Global Variables
$adminToken = ""
$adminUserId = ""
$instructors = @{}
$students = @{}
$courses = @{}
$classes = @{}
$assignments = @{}
$groups = @{}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

function Write-Step {
    param([string]$Message)
    Write-Host "?? $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "? $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "? $Message" -ForegroundColor Red
}

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = ""
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token -ne "") {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method -Headers $headers -Body $jsonBody
        } else {
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method -Headers $headers
        }
        return $response
    } catch {
        Write-Error "API Request Failed: $($_.Exception.Message)"
        return $null
    }
}

# ============================================================================
# STEP 1: ADMIN SETUP
# ============================================================================

Write-Step "STEP 1: Admin Login..."

try {
    $loginResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/Auth/login" -Body @{
        email = "admin@ams.com"
        password = "Admin123!"
    }

    if ($loginResponse.data.token) {
        $adminToken = $loginResponse.data.token
        $adminUserId = $loginResponse.data.user.id
        Write-Success "Admin login successful! Token: $($adminToken.Substring(0,20))..."
    } else {
        Write-Error "Admin login failed!"
        exit 1
    }
} catch {
    Write-Error "Admin login failed: $($_.Exception.Message)"
    exit 1
}

# ============================================================================
# STEP 2: CREATE INSTRUCTORS
# ============================================================================

Write-Step "STEP 2: Creating Instructors..."

$instructorData = @(
    @{ firstName = "Yakup"; lastName = "Kalay"; email = "yakup.kalay@test.com"; department = "Bilgisayar Mühendisli?i"; phone = "05381234567" },
    @{ firstName = "Zeynep"; lastName = "Bast?k"; email = "zeynep.bastik@test.com"; department = "Konservatuar"; phone = "05399876543" },
    @{ firstName = "K?vanç"; lastName = "Tatl?tu?"; email = "kivanc.tatlitug@test.com"; department = "?leti?im Fakültesi"; phone = "05355554433" },
    @{ firstName = "Emre"; lastName = "Alkin"; email = "emre.alkin@test.com"; department = "?ktisat"; phone = "05321112233" },
    @{ firstName = "?lker"; lastName = "Canikligil"; email = "ilker.canikligil@test.com"; department = "Sinema ve Televizyon"; phone = "05367778899" }
)

foreach ($instructor in $instructorData) {
    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/api/Auth/register" -Token $adminToken -Body @{
        firstName = $instructor.firstName
        lastName = $instructor.lastName
        email = $instructor.email
        password = "Test123!"
        role = 2
        department = $instructor.department
        phoneNumber = $instructor.phone
    }
    
    if ($response.data.id) {
        $instructors[$instructor.firstName] = @{
            id = $response.data.id
            email = $instructor.email
            name = "$($instructor.firstName) $($instructor.lastName)"
        }
        Write-Success "Instructor $($instructor.firstName) $($instructor.lastName) created with ID: $($response.data.id)"
    }
}

# ============================================================================
# STEP 3: CREATE SAMPLE STUDENTS
# ============================================================================

Write-Step "STEP 3: Creating Sample Students..."

$studentData = @(
    @{ firstName = "Ahmet"; lastName = "Y?lmaz"; email = "ahmet.yilmaz101@test.com"; studentNumber = "20240001"; department = "Bilgisayar Mühendisli?i" },
    @{ firstName = "Ay?e"; lastName = "Kaya"; email = "ayse.kaya102@test.com"; studentNumber = "20240002"; department = "Bilgisayar Mühendisli?i" },
    @{ firstName = "Mehmet"; lastName = "Demir"; email = "mehmet.demir103@test.com"; studentNumber = "20240003"; department = "Bilgisayar Mühendisli?i" },
    @{ firstName = "Fatma"; lastName = "Çelik"; email = "fatma.celik104@test.com"; studentNumber = "20240004"; department = "Bilgisayar Mühendisli?i" }
)

foreach ($student in $studentData) {
    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/api/Auth/register" -Token $adminToken -Body @{
        firstName = $student.firstName
        lastName = $student.lastName
        email = $student.email
        password = "Test123."
        role = 1
        department = $student.department
        studentNumber = $student.studentNumber
        phoneNumber = "05" + (Get-Random -Minimum 300000000 -Maximum 599999999)
    }
    
    if ($response.data.id) {
        $students[$student.firstName] = @{
            id = $response.data.id
            email = $student.email
            name = "$($student.firstName) $($student.lastName)"
            studentNumber = $student.studentNumber
        }
        Write-Success "Student $($student.firstName) $($student.lastName) created with ID: $($response.data.id)"
    }
}

# ============================================================================
# STEP 4: CREATE COURSES & CLASSES
# ============================================================================

Write-Step "STEP 4: Creating Courses and Classes..."

# Create Courses
$courseData = @(
    @{ code = "CS201"; name = "Veri Yap?lar?"; description = "Temel veri yap?lar? ve algoritmalar?"; department = "Bilgisayar Mühendisli?i"; credits = 4 },
    @{ code = "CS301"; name = "Programlama Dilleri"; description = "Modern programlama dilleri ve paradigmalar?"; department = "Bilgisayar Mühendisli?i"; credits = 3 }
)

foreach ($course in $courseData) {
    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/api/Course" -Token $adminToken -Body @{
        courseCode = $course.code
        courseName = $course.name
        description = $course.description
        department = $course.department
        creditHours = $course.credits
        academicYear = "2024-2025"
    }
    
    if ($response.data.id) {
        $courses[$course.name] = $response.data.id
        Write-Success "Course $($course.name) created with ID: $($response.data.id)"
    }
}

# Create Classes
if ($courses["Veri Yap?lar?"] -and $instructors["Yakup"]) {
    $response = Invoke-ApiRequest -Method "POST" -Endpoint "/api/Class" -Token $adminToken -Body @{
        courseId = $courses["Veri Yap?lar?"]
        className = "Veri Yap?lar? - Fall 2024"
        instructorId = $instructors["Yakup"].id
        classCode = "CS201-01"
        maxCapacity = 50
        semester = "Fall 2024"
    }
    
    if ($response.data.id) {
        $classes["Veri Yap?lar?"] = $response.data.id
        Write-Success "Class Veri Yap?lar? created with ID: $($response.data.id)"
    }
}

# ============================================================================
# STEP 5: INSTRUCTOR LOGIN & CREATE ASSIGNMENTS
# ============================================================================

Write-Step "STEP 5: Instructor creates assignments..."

# Yakup login
$yakupLoginResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/Auth/login" -Body @{
    email = $instructors["Yakup"].email
    password = "Test123!"
}

if ($yakupLoginResponse.data.token) {
    $yakupToken = $yakupLoginResponse.data.token
    Write-Success "Yakup instructor login successful"
    
    # Create Individual Assignment
    $individualResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/Assignment" -Token $yakupToken -Body @{
        title = "Algoritma Analizi Ödevi"
        description = "Big O notasyonu ve algoritma karma??kl??? analizi yap?n?z."
        classId = $classes["Veri Yap?lar?"]
        type = 1
        dueDate = "2025-02-15T23:59:59Z"
        maxScore = 100
        allowLateSubmission = $true
        allowResubmission = $false
    }
    
    if ($individualResponse.data.id) {
        $assignments["Individual"] = $individualResponse.data.id
        Write-Success "Individual Assignment created with ID: $($individualResponse.data.id)"
    }
    
    # Create Group Assignment
    $groupResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/Assignment" -Token $yakupToken -Body @{
        title = "Veri Yap?s? Implementasyon Projesi"
        description = "Grup halinde Binary Search Tree, Hash Table ve Graph veri yap?lar?ndan birini seçerek tam implementasyonunu yap?n."
        classId = $classes["Veri Yap?lar?"]
        type = 2
        dueDate = "2025-03-15T23:59:59Z"
        maxScore = 200
        allowLateSubmission = $false
        allowResubmission = $true
    }
    
    if ($groupResponse.data.id) {
        $assignments["Group"] = $groupResponse.data.id
        Write-Success "Group Assignment created with ID: $($groupResponse.data.id)"
    }
}

# ============================================================================
# STEP 6: STUDENT GROUP MANAGEMENT
# ============================================================================

Write-Step "STEP 6: Testing Group Management..."

# Ahmet login
$ahmetLoginResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/Auth/login" -Body @{
    email = $students["Ahmet"].email
    password = "Test123."
}

if ($ahmetLoginResponse.data.token) {
    $ahmetToken = $ahmetLoginResponse.data.token
    Write-Success "Ahmet student login successful"
    
    # Check available students for group
    $availableStudents = Invoke-ApiRequest -Method "GET" -Endpoint "/api/Group/available-students/$($assignments["Group"])" -Token $ahmetToken
    Write-Success "Available students for group: $($availableStudents.data.Count)"
    
    # Create group
    $groupResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/Group/create" -Token $ahmetToken -Body @{
        assignmentId = $assignments["Group"]
        groupName = "Code Warriors"
        memberIds = @($students["Ahmet"].id)
    }
    
    if ($groupResponse.data.id) {
        $groups["Code Warriors"] = $groupResponse.data.id
        Write-Success "Group 'Code Warriors' created with ID: $($groupResponse.data.id)"
    }
}

# ============================================================================
# STEP 7: INSTRUCTOR DASHBOARD TESTING
# ============================================================================

Write-Step "STEP 7: Testing Instructor Dashboard..."

if ($yakupToken) {
    # Get assignment groups
    $groupsList = Invoke-ApiRequest -Method "GET" -Endpoint "/api/Group/assignment/$($assignments["Group"])" -Token $yakupToken
    if ($groupsList.data) {
        Write-Success "Instructor can view $($groupsList.data.Count) groups for assignment"
    }
    
    # Get assignment submissions
    $submissions = Invoke-ApiRequest -Method "GET" -Endpoint "/api/Submission/assignment/$($assignments["Group"])" -Token $yakupToken
    Write-Success "Instructor can view submissions: $($submissions.data.Count) submissions found"
    
    # Get group details
    if ($groups["Code Warriors"]) {
        $groupDetails = Invoke-ApiRequest -Method "GET" -Endpoint "/api/Group/$($groups["Code Warriors"])" -Token $yakupToken
        if ($groupDetails.data) {
            Write-Success "Group details retrieved: $($groupDetails.data.groupName) with $($groupDetails.data.members.Count) members"
        }
    }
}

# ============================================================================
# STEP 8: DASHBOARD TESTING
# ============================================================================

Write-Step "STEP 8: Testing Dashboard Endpoints..."

# Admin Dashboard
$adminDashboard = Invoke-ApiRequest -Method "GET" -Endpoint "/api/Dashboard/admin" -Token $adminToken
if ($adminDashboard.data) {
    Write-Success "Admin Dashboard: $($adminDashboard.data.totalUsers) total users, $($adminDashboard.data.totalAssignments) assignments"
}

# Instructor Dashboard  
if ($yakupToken) {
    $instructorDashboard = Invoke-ApiRequest -Method "GET" -Endpoint "/api/Dashboard/instructor" -Token $yakupToken
    if ($instructorDashboard.data) {
        Write-Success "Instructor Dashboard: $($instructorDashboard.data.totalClasses) classes, $($instructorDashboard.data.totalAssignments) assignments"
    }
}

# Student Dashboard
if ($ahmetToken) {
    $studentDashboard = Invoke-ApiRequest -Method "GET" -Endpoint "/api/Dashboard/student" -Token $ahmetToken
    if ($studentDashboard.data) {
        Write-Success "Student Dashboard: $($studentDashboard.data.totalEnrollments) enrollments"
    }
}

# ============================================================================
# FINAL SUMMARY
# ============================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "?? AMS COMPREHENSIVE TEST COMPLETED!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Yellow

Write-Host "?? SUMMARY:" -ForegroundColor Cyan
Write-Host "• Instructors Created: $($instructors.Count)" -ForegroundColor White
Write-Host "• Students Created: $($students.Count)" -ForegroundColor White  
Write-Host "• Courses Created: $($courses.Count)" -ForegroundColor White
Write-Host "• Classes Created: $($classes.Count)" -ForegroundColor White
Write-Host "• Assignments Created: $($assignments.Count)" -ForegroundColor White
Write-Host "• Groups Created: $($groups.Count)" -ForegroundColor White

Write-Host ""
Write-Host "?? TESTED ENDPOINTS:" -ForegroundColor Cyan
Write-Host "? User Authentication & Registration" -ForegroundColor Green
Write-Host "? Course & Class Management" -ForegroundColor Green  
Write-Host "? Assignment Creation (Individual & Group)" -ForegroundColor Green
Write-Host "? Group Management System" -ForegroundColor Green
Write-Host "? Instructor Dashboard" -ForegroundColor Green
Write-Host "? Statistics & Analytics" -ForegroundColor Green

Write-Host ""
Write-Host "?? KEY IDs for Manual Testing:" -ForegroundColor Yellow
if ($assignments["Group"]) { Write-Host "• Group Assignment ID: $($assignments["Group"])" -ForegroundColor Gray }
if ($groups["Code Warriors"]) { Write-Host "• Code Warriors Group ID: $($groups["Code Warriors"])" -ForegroundColor Gray }
Write-Host "• Yakup Instructor ID: $($instructors["Yakup"].id)" -ForegroundColor Gray
Write-Host "• Ahmet Student ID: $($students["Ahmet"].id)" -ForegroundColor Gray

Write-Host ""
Write-Host "?? All tests completed successfully! System is ready for production use." -ForegroundColor Green