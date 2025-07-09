@echo off
echo ========================================
echo Face Analysis API Auto-Start Script
echo ========================================
echo.

REM Change to the backend directory
cd /d "%~dp0"
echo Current directory: %CD%
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if PM2 is available
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: PM2 is not installed globally
    echo Installing PM2...
    npm install -g pm2
    if errorlevel 1 (
        echo ERROR: Failed to install PM2
        pause
        exit /b 1
    )
)

echo PM2 version:
pm2 --version
echo.

REM Kill any existing PM2 processes
echo Stopping any existing PM2 processes...
pm2 kill >nul 2>&1

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start the Face Analysis API with PM2
echo Starting Face Analysis API with PM2...
pm2 start ecosystem.config.js --env production

if errorlevel 1 (
    echo ERROR: Failed to start PM2 processes
    echo Trying alternative start method...
    pm2 start server.js --name "faceapp-backend" -i max
    if errorlevel 1 (
        echo ERROR: All start methods failed
        pause
        exit /b 1
    )
)

REM Save PM2 configuration
echo Saving PM2 configuration...
pm2 save

REM Show PM2 status
echo.
echo PM2 Status:
pm2 status

REM Test API health
echo.
echo Testing API health...
timeout /t 5 /nobreak >nul

curl -f http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    echo WARNING: API health check failed
    echo The API might still be starting up...
) else (
    echo SUCCESS: API is responding correctly
)

echo.
echo ========================================
echo Face Analysis API started successfully!
echo ========================================
echo.
echo API URL: http://localhost:3001
echo PM2 Status: pm2 status
echo PM2 Logs: pm2 logs
echo PM2 Monitor: pm2 monit
echo.
echo Press any key to exit...
pause >nul
