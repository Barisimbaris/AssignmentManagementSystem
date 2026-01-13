# AMP Newman Automation Script
# Export and run automated tests for Assignment Management Platform

Write-Host "?? AMP API Automation with Newman" -ForegroundColor Green

# Configuration
$baseUrl = "http://localhost:5281"
$collectionPath = "./newman/ams-collection.json"
$environmentPath = "./newman/ams-environment.json" 
$reportsPath = "./newman/reports"

# Create directories
if (!(Test-Path "./newman")) { New-Item -ItemType Directory -Path "./newman" }
if (!(Test-Path $reportsPath)) { New-Item -ItemType Directory -Path $reportsPath }

Write-Host "?? Directories created" -ForegroundColor Yellow

# Check if API is running
try {
    $healthCheck = Invoke-RestMethod -Uri "$baseUrl/swagger/v1/swagger.json" -TimeoutSec 5
    Write-Host "? AMP API is accessible" -ForegroundColor Green
} catch {
    Write-Host "? AMP API is not running. Starting API..." -ForegroundColor Red
    
    # Start API in background
    Start-Process -FilePath "dotnet" -ArgumentList "run --project src/AMS.API" -WindowStyle Hidden
    
    # Wait for API to start
    Write-Host "? Waiting for AMP API to start..." -ForegroundColor Yellow
    Start-Sleep 10
}

# Generate timestamp for reports
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "?? Running AMP Newman tests..." -ForegroundColor Cyan

# Try with basic CLI reporter first
Write-Host "?? Running basic AMP Newman test..." -ForegroundColor Yellow

newman run $collectionPath `
    --environment $environmentPath `
    --reporters cli `
    --timeout 30000 `
    --timeout-request 30000 `
    --timeout-script 30000 `
    --color on

# Check test results
if ($LASTEXITCODE -eq 0) {
    Write-Host "? All AMP tests passed!" -ForegroundColor Green
    
    # Now try with HTML reporter
    Write-Host "?? Generating AMP HTML report..." -ForegroundColor Yellow
    
    try {
        newman run $collectionPath `
            --environment $environmentPath `
            --reporters htmlextra `
            --reporter-htmlextra-export "$reportsPath/amp-report-$timestamp.html" `
            --timeout 30000 `
            --timeout-request 30000 `
            --timeout-script 30000 `
            --color on `
            --disable-unicode
            
        Write-Host "? AMP HTML report generated!" -ForegroundColor Green
        
        # Open report automatically (optional)
        Start-Process "$reportsPath/amp-report-$timestamp.html"
        
    } catch {
        Write-Host "?? AMP HTML report generation failed, but tests passed!" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "? Some AMP tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "?? AMP Reports generated at: $reportsPath" -ForegroundColor Magenta
Write-Host "?? AMP Automation completed!" -ForegroundColor Green