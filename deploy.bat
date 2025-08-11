@echo off
echo ========================================
echo    DEPLOIEMENT CLEANING APP SUR RAILWAY
echo ========================================

echo.
echo 1. Initialisation Git...
git init
git add .
git commit -m "Production ready - Cleaning App"

echo.
echo 2. Configuration des remotes Git...
echo IMPORTANT: Copiez l'URL de votre depot GitHub ici:
set /p GITHUB_URL="URL GitHub (https://github.com/VOTRE-USERNAME/REPO.git): "

git remote add origin %GITHUB_URL%

echo.
echo 3. Push vers GitHub...
git branch -M main
git push -u origin main

echo.
echo ========================================
echo TERMINE! Votre code est sur GitHub
echo ========================================
echo.
echo Prochaine etape:
echo 1. Allez sur Railway
echo 2. New Project > Deploy from GitHub
echo 3. Selectionnez votre depot
echo.
pause