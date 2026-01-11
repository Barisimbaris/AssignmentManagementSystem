#!/bin/bash
# Web Frontend Test Sunucusu
# Bash script

echo "========================================"
echo "Web Frontend Test Sunucusu Başlatılıyor"
echo "========================================"
echo ""

# Python kontrolü
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 bulundu: $(python3 --version)"
    echo ""
    echo "🌐 Sunucu başlatılıyor..."
    echo "📍 URL: http://localhost:8000/pages/index.html"
    echo "⚠️  Backend'in çalıştığından emin olun: http://localhost:5281"
    echo ""
    echo "Durdurmak için: Ctrl+C"
    echo ""
    
    # Python 3 HTTP sunucusu başlat
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Python bulundu: $(python --version)"
    echo "⚠️  Python 3 önerilir, Python 2 kullanılıyor..."
    echo ""
    echo "🌐 Sunucu başlatılıyor..."
    echo "📍 URL: http://localhost:8000/pages/index.html"
    echo ""
    
    # Python 2 HTTP sunucusu başlat
    python -m SimpleHTTPServer 8000
else
    echo "❌ Python bulunamadı!"
    echo ""
    echo "Alternatif yöntemler:"
    echo "1. Node.js http-server:"
    echo "   npm install -g http-server"
    echo "   http-server -p 8000"
    echo ""
    echo "2. VS Code Live Server extension kullanın"
    echo ""
    echo "3. Direkt HTML dosyalarını tarayıcıda açın (CORS sorunları olabilir)"
    echo ""
    read -p "Devam etmek için Enter'a basın..."
fi
