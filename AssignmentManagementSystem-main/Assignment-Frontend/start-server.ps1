# Web Frontend Test Sunucusu
# PowerShell script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Web Frontend Test Sunucusu Başlatılıyor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Python kontrolü
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python bulundu: $pythonVersion" -ForegroundColor Green
    
    # Python 3 kontrolü
    $python3Version = python3 --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Python 3 bulundu: $python3Version" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Sunucu başlatılıyor..." -ForegroundColor Yellow
        Write-Host "📍 URL: http://localhost:8000/pages/index.html" -ForegroundColor Cyan
        Write-Host "⚠️  Backend'in çalıştığından emin olun: http://localhost:5281" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Durdurmak için: Ctrl+C" -ForegroundColor Gray
        Write-Host ""
        
        # Python 3 HTTP sunucusu başlat
        python3 -m http.server 8000
    } else {
        Write-Host "⚠️  Python 3 bulunamadı, Python 2 kullanılıyor..." -ForegroundColor Yellow
        Write-Host "🌐 Sunucu başlatılıyor..." -ForegroundColor Yellow
        Write-Host "📍 URL: http://localhost:8000/pages/index.html" -ForegroundColor Cyan
        Write-Host ""
        
        # Python 2 HTTP sunucusu başlat
        python -m SimpleHTTPServer 8000
    }
} else {
    Write-Host "❌ Python bulunamadı!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternatif yöntemler:" -ForegroundColor Yellow
    Write-Host "1. Node.js http-server:" -ForegroundColor Cyan
    Write-Host "   npm install -g http-server" -ForegroundColor Gray
    Write-Host "   http-server -p 8000" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. VS Code Live Server extension kullanın" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Direkt HTML dosyalarını tarayıcıda açın (CORS sorunları olabilir)" -ForegroundColor Cyan
    Write-Host ""
    pause
}
