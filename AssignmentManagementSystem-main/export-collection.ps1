# AMS API Collection Auto Export Script
param(
    [string]$BaseUrl = "http://localhost:5281",
    [string]$OutputDir = "./exports"
)

Write-Host "?? Starting AMS API Export..." -ForegroundColor Green

# Create output directory
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir
    Write-Host "?? Created output directory: $OutputDir" -ForegroundColor Yellow
}

# Test API availability
try {
    $healthCheck = Invoke-RestMethod -Uri "$BaseUrl/swagger/v1/swagger.json" -TimeoutSec 5
    Write-Host "? API is accessible" -ForegroundColor Green
} catch {
    Write-Host "? API is not accessible at $BaseUrl" -ForegroundColor Red
    Write-Host "Make sure your API is running with: dotnet run --project src/AMS.API" -ForegroundColor Yellow
    exit 1
}

# Export Swagger JSON
try {
    Write-Host "?? Exporting Swagger JSON..." -ForegroundColor Cyan
    $swaggerJson = Invoke-RestMethod -Uri "$BaseUrl/swagger/v1/swagger.json"
    $swaggerJson | ConvertTo-Json -Depth 100 | Out-File "$OutputDir/ams-swagger.json" -Encoding UTF8
    Write-Host "? Swagger JSON exported to: $OutputDir/ams-swagger.json" -ForegroundColor Green
} catch {
    Write-Host "? Failed to export Swagger JSON: $_" -ForegroundColor Red
}

# Generate Postman Collection
$postmanCollection = @{
    info = @{
        name = "AMS API Collection"
        description = "Complete Assignment Management System API Collection"
        schema = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    }
    variable = @(
        @{ key = "baseUrl"; value = $BaseUrl; type = "string" }
        @{ key = "adminToken"; value = ""; type = "string" }
        @{ key = "instructorToken"; value = ""; type = "string" }
        @{ key = "studentToken"; value = ""; type = "string" }
        @{ key = "courseId"; value = ""; type = "string" }
        @{ key = "classId"; value = ""; type = "string" }
        @{ key = "assignmentId"; value = ""; type = "string" }
        @{ key = "submissionId"; value = ""; type = "string" }
    )
    item = @(
        @{
            name = "Authentication"
            item = @(
                @{
                    name = "Admin Register"
                    request = @{
                        method = "POST"
                        url = "{{baseUrl}}/api/Auth/register"
                        header = @(
                            @{ key = "Content-Type"; value = "application/json" }
                        )
                        body = @{
                            mode = "raw"
                            raw = @{
                                firstName = "System"
                                lastName = "Admin"
                                email = "admin@ams.com"
                                password = "Admin123!"
                                confirmPassword = "Admin123!"
                                role = 3
                                department = "IT"
                            } | ConvertTo-Json
                        }
                    }
                },
                @{
                    name = "Admin Login"
                    request = @{
                        method = "POST"
                        url = "{{baseUrl}}/api/Auth/login"
                        header = @(
                            @{ key = "Content-Type"; value = "application/json" }
                        )
                        body = @{
                            mode = "raw"
                            raw = @{
                                email = "admin@ams.com"
                                password = "Admin123!"
                            } | ConvertTo-Json
                        }
                    }
                },
                @{
                    name = "Instructor Register"
                    request = @{
                        method = "POST"
                        url = "{{baseUrl}}/api/Auth/register"
                        header = @(
                            @{ key = "Content-Type"; value = "application/json" }
                        )
                        body = @{
                            mode = "raw"
                            raw = @{
                                firstName = "John"
                                lastName = "Instructor"
                                email = "instructor@ams.com"
                                password = "Instructor123!"
                                confirmPassword = "Instructor123!"
                                role = 2
                                department = "Computer Science"
                            } | ConvertTo-Json
                        }
                    }
                },
                @{
                    name = "Student Register"
                    request = @{
                        method = "POST"
                        url = "{{baseUrl}}/api/Auth/register"
                        header = @(
                            @{ key = "Content-Type"; value = "application/json" }
                        )
                        body = @{
                            mode = "raw"
                            raw = @{
                                firstName = "Jane"
                                lastName = "Student"
                                email = "student@ams.com"
                                password = "Student123!"
                                confirmPassword = "Student123!"
                                role = 1
                                studentNumber = "CS2024001"
                                department = "Computer Science"
                            } | ConvertTo-Json
                        }
                    }
                }
            )
        },
        @{
            name = "Course Management"
            item = @(
                @{
                    name = "Create Course"
                    request = @{
                        method = "POST"
                        url = "{{baseUrl}}/api/Course"
                        header = @(
                            @{ key = "Authorization"; value = "Bearer {{adminToken}}" }
                            @{ key = "Content-Type"; value = "application/json" }
                        )
                        body = @{
                            mode = "raw"
                            raw = @{
                                courseCode = "CS101"
                                courseName = "Introduction to Programming"
                                description = "Basic programming concepts"
                                department = "Computer Science"
                                creditHours = 3
                                academicYear = "2024-2025"
                            } | ConvertTo-Json
                        }
                    }
                },
                @{
                    name = "Get All Courses"
                    request = @{
                        method = "GET"
                        url = "{{baseUrl}}/api/Course"
                        header = @(
                            @{ key = "Authorization"; value = "Bearer {{adminToken}}" }
                        )
                    }
                }
            )
        },
        @{
            name = "Dashboard"
            item = @(
                @{
                    name = "Admin Dashboard"
                    request = @{
                        method = "GET"
                        url = "{{baseUrl}}/api/Dashboard/admin"
                        header = @(
                            @{ key = "Authorization"; value = "Bearer {{adminToken}}" }
                        )
                    }
                },
                @{
                    name = "Instructor Dashboard"
                    request = @{
                        method = "GET"
                        url = "{{baseUrl}}/api/Dashboard/instructor"
                        header = @(
                            @{ key = "Authorization"; value = "Bearer {{instructorToken}}" }
                        )
                    }
                },
                @{
                    name = "Student Dashboard"
                    request = @{
                        method = "GET"
                        url = "{{baseUrl}}/api/Dashboard/student"
                        header = @(
                            @{ key = "Authorization"; value = "Bearer {{studentToken}}" }
                        )
                    }
                }
            )
        }
    )
}

try {
    Write-Host "?? Generating Postman Collection..." -ForegroundColor Cyan
    $postmanCollection | ConvertTo-Json -Depth 100 | Out-File "$OutputDir/ams-postman-collection.json" -Encoding UTF8
    Write-Host "? Postman Collection exported to: $OutputDir/ams-postman-collection.json" -ForegroundColor Green
} catch {
    Write-Host "? Failed to generate Postman Collection: $_" -ForegroundColor Red
}

# Generate Environment File
$environment = @{
    name = "AMS Development"
    values = @(
        @{ key = "baseUrl"; value = $BaseUrl; enabled = $true }
        @{ key = "adminToken"; value = ""; enabled = $true }
        @{ key = "instructorToken"; value = ""; enabled = $true }
        @{ key = "studentToken"; value = ""; enabled = $true }
        @{ key = "courseId"; value = ""; enabled = $true }
        @{ key = "classId"; value = ""; enabled = $true }
        @{ key = "assignmentId"; value = ""; enabled = $true }
        @{ key = "submissionId"; value = ""; enabled = $true }
    )
}

try {
    Write-Host "?? Generating Environment File..." -ForegroundColor Cyan
    $environment | ConvertTo-Json -Depth 100 | Out-File "$OutputDir/ams-environment.json" -Encoding UTF8
    Write-Host "? Environment file exported to: $OutputDir/ams-environment.json" -ForegroundColor Green
} catch {
    Write-Host "? Failed to generate Environment file: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n?? EXPORT SUMMARY:" -ForegroundColor Magenta
Write-Host "==================" -ForegroundColor Magenta
Write-Host "?? Output Directory: $OutputDir" -ForegroundColor White
Write-Host "?? Swagger JSON: ams-swagger.json" -ForegroundColor White
Write-Host "?? Postman Collection: ams-postman-collection.json" -ForegroundColor White
Write-Host "?? Environment Variables: ams-environment.json" -ForegroundColor White
Write-Host "?? HTTP Client File: ../ams-api-tests.http" -ForegroundColor White

Write-Host "`n?? NEXT STEPS:" -ForegroundColor Green
Write-Host "1. Import Postman Collection: $OutputDir/ams-postman-collection.json" -ForegroundColor Yellow
Write-Host "2. Import Environment: $OutputDir/ams-environment.json" -ForegroundColor Yellow
Write-Host "3. Use HTTP file in VS Code: ams-api-tests.http" -ForegroundColor Yellow
Write-Host "4. Start testing your API endpoints!" -ForegroundColor Yellow

Write-Host "`n? Export completed successfully!" -ForegroundColor Green