# ?? AMS Bulk User Import Test Script
# 10 Hoca + 150 Ö?renci = 160 Kullan?c?

Write-Host "?? AMS BULK USER IMPORT TEST BA?LIYOR..." -ForegroundColor Green
Write-Host "?? Target: 10 Instructors + 150 Students = 160 Users"

# Admin Token Al
$headers = @{ "Content-Type" = "application/json" }
$body = '{"email":"admin@ams.com","password":"Admin123!"}'
$adminLoginResponse = Invoke-RestMethod -Uri "http://localhost:5281/api/Auth/login" -Method POST -Headers $headers -Body $body
$adminToken = $adminLoginResponse.data.token
Write-Host "? Admin Token al?nd?"

# ?? BULK USER DATA OLU?TUR
$bulkUsers = @()

# 10 Instructor Olu?tur
Write-Host "????? Creating 10 Instructors..."
for ($i = 1; $i -le 10; $i++) {
    $instructor = @{
        firstName = "Instructor$i"
        lastName = "Lecturer"
        email = "instructor$i@university.edu"
        password = "Inst123!"
        role = 2  # Instructor
        department = "Computer Engineering"
        phoneNumber = "+9055123400$($i.ToString().PadLeft(2,'0'))"
    }
    $bulkUsers += $instructor
}

# 150 Student Olu?tur
Write-Host "????? Creating 150 Students..."
for ($i = 1; $i -le 150; $i++) {
    $student = @{
        firstName = "Student$i"
        lastName = "Learner"
        email = "student$i@student.university.edu"
        password = "Stud123!"
        role = 1  # Student
        studentNumber = "202400$($i.ToString().PadLeft(3,'0'))"
        department = "Computer Engineering"
        phoneNumber = "+9055124000$($i.ToString().PadLeft(3,'0'))"
    }
    $bulkUsers += $student
}

Write-Host "?? Total Users to Import: $($bulkUsers.Count)"

# BULK IMPORT REQUEST OLU?TUR
$bulkImportRequest = @{
    users = $bulkUsers
    skipDuplicateEmails = $true
    sendWelcomeEmails = $false  # 160 ki?iye email göndermeyelim
} | ConvertTo-Json -Depth 3

# BULK IMPORT API CALL
Write-Host "?? Sending bulk import request..."
$headers = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $adminToken" 
}

try {
    $importResponse = Invoke-RestMethod -Uri "http://localhost:5281/api/User/bulk-import" -Method POST -Headers $headers -Body $bulkImportRequest
    
    Write-Host ""
    Write-Host "?? BULK IMPORT COMPLETED!" -ForegroundColor Green
    Write-Host "?? RESULTS:"
    Write-Host "   Total Users: $($importResponse.data.totalUsers)"
    Write-Host "   ? Successful: $($importResponse.data.successfulImports)"
    Write-Host "   ? Failed: $($importResponse.data.failedImports)"
    Write-Host "   ?? Created User IDs: $($importResponse.data.createdUserIds.Count) users"
    
    if ($importResponse.data.errors.Count -gt 0) {
        Write-Host ""
        Write-Host "? ERRORS:" -ForegroundColor Red
        $importResponse.data.errors | ForEach-Object {
            Write-Host "   Row $($_.rowNumber): $($_.email) - $($_.errorMessage)"
        }
    }
    
    # Son kontrol: Total user count
    $allUsers = Invoke-RestMethod -Uri "http://localhost:5281/api/User" -Method GET -Headers $headers
    Write-Host ""
    Write-Host "?? FINAL USER COUNT: $($allUsers.data.Count) users in system"
    
    # Role distribution
    $instructorCount = ($allUsers.data | Where-Object { $_.role -eq "Instructor" }).Count
    $studentCount = ($allUsers.data | Where-Object { $_.role -eq "Student" }).Count
    $adminCount = ($allUsers.data | Where-Object { $_.role -eq "Admin" }).Count
    
    Write-Host "?? ROLE DISTRIBUTION:"
    Write-Host "   ????? Instructors: $instructorCount"
    Write-Host "   ????? Students: $studentCount"
    Write-Host "   ????? Admins: $adminCount"
    
} catch {
    Write-Host "? BULK IMPORT FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error Details: $($errorResponse.message)"
    }
}

Write-Host ""
Write-Host "?? Bulk import test completed!"