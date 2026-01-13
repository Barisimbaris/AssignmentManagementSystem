@echo off
cd /d C:\Users\DOGUS\Desktop\ozelkonular
echo Git durumu kontrol ediliyor...
git status
echo.
echo Remote kontrol ediliyor...
git remote -v
echo.
echo Tüm dosyalar ekleniyor...
git add .
echo.
echo Commit yapiliyor...
git commit -m "feat: Add course information to student grades and fix date calculation"
echo.
echo Main branch'e geciliyor...
git branch -M main
echo.
echo GitHub'a push yapiliyor...
git push -u origin main
echo.
echo Islem tamamlandi!
pause

