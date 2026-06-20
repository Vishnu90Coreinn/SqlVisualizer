@echo off
cd /d D:\GitHubRepository\sql-visualizer

echo Removing git lock files...
if exist .git\config.lock del /f .git\config.lock
if exist .git\index.lock del /f .git\index.lock

echo Configuring git...
git config user.email "mail.vishnurajs@gmail.com"
git config user.name "VishnuRaj"
git remote remove origin 2>nul
git remote add origin https://github.com/Vishnu90Coreinn/SQL-Visualizer.git

echo Staging all files...
git add -A

echo Committing...
git commit -m "Initial commit: SQL Visualizer project"

echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo Done!
pause
