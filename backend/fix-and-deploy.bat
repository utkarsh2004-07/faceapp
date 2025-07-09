@echo off
echo ==========================================
echo   Face Analysis API - Fix and Deploy
echo   Author: Utkarsh
echo ==========================================
echo.

echo [INFO] Fixing common Windows deployment issues...

REM Kill any existing Node.js processes
echo [INFO] Stopping any running Node.js processes...
taskkill /f /im node.exe 2>nul || echo No Node.js processes to kill

REM Kill PM2 processes
echo [INFO] Stopping PM2 processes...
pm2 kill 2>nul || echo No PM2 processes to kill

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Clean node_modules if it exists and is causing issues
if exist "node_modules" (
    echo [INFO] Cleaning node_modules for fresh installation...
    rmdir /s /q node_modules 2>nul || echo Could not remove node_modules automatically
)

REM Remove package-lock.json to force fresh install
if exist "package-lock.json" (
    echo [INFO] Removing package-lock.json for fresh install...
    del package-lock.json 2>nul || echo Could not remove package-lock.json
)

echo [INFO] Starting fresh deployment...
echo.

REM Run the deployment script
node auto-deploy.js

echo.
echo [INFO] Deployment script completed.
echo.

REM Check if PM2 is running
echo [INFO] Checking PM2 status...
pm2 status

echo.
echo [INFO] Testing API health...
timeout /t 5 /nobreak >nul
curl -f http://localhost:3001/api/health 2>nul
if errorlevel 1 (
    echo [WARNING] API health check failed. The API might still be starting up.
    echo [INFO] Wait a few more seconds and try: curl http://localhost:3001/api/health
) else (
    echo [SUCCESS] API is responding correctly!
)

echo.
echo ==========================================
echo   Fix and Deploy Completed!
echo ==========================================
echo.
echo Management Commands:
echo   pm2 status       - Check PM2 processes
echo   pm2 logs         - View application logs
echo   pm2 monit        - Real-time monitoring
echo   monitor.bat      - Run health check
echo   restart.bat      - Restart application
echo.
pause
