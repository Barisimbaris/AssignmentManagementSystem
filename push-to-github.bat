@echo off
echo ========================================
echo GitHub'a yukleme basladi...
echo ========================================
echo.

cd /d C:\Users\DOGUS\Desktop\ozelkonular

echo [1/5] Git durumu kontrol ediliyor...
git status
echo.

echo [2/5] Remote repository kontrol ediliyor...
git remote -v
echo.

echo [3/5] Tum dosyalar ekleniyor...
git add .
echo.

echo [4/5] Commit yapiliyor...
git commit -m "feat: Add course information to student grades and fix date calculation"
echo.

echo [5/5] GitHub'a push yapiliyor...
git branch -M main
git push -u origin main
echo.

echo ========================================
echo Islem tamamlandi!
echo Repository: https://github.com/ahmetdoganaltay/ams3.git
echo ========================================
pause

