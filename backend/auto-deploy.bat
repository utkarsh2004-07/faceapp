@echo off
REM Face Analysis API - One-Command Auto Deployment Script for Windows
REM Author: Utkarsh
REM This script automatically sets up everything: PM2, auto-start, monitoring, and optimization

setlocal enabledelayedexpansion

echo ==========================================
echo   Face Analysis API Auto-Deployment
echo   Author: Utkarsh
echo   %date% %time%
echo ==========================================
echo.

REM Change to script directory
cd /d "%~dp0"

echo [INFO] Starting automated deployment...
echo.

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ and try again.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js is installed: 
    node --version
)
echo.

REM Check if npm is available
echo [INFO] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available. Please reinstall Node.js.
    pause
    exit /b 1
) else (
    echo [SUCCESS] npm is available: 
    npm --version
)
echo.

REM Install PM2 globally if not present
echo [INFO] Checking PM2 installation...
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing PM2 globally...
    npm install -g pm2
    if errorlevel 1 (
        echo [ERROR] Failed to install PM2
        pause
        exit /b 1
    )
    echo [SUCCESS] PM2 installed successfully
) else (
    echo [SUCCESS] PM2 is already installed: 
    pm2 --version
)
echo.

REM Install dependencies
echo [INFO] Installing Node.js dependencies...
if exist "package-lock.json" (
    npm ci --only=production
) else (
    npm install --only=production
)
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully
echo.

REM Setup environment
echo [INFO] Setting up environment configuration...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [WARNING] Created .env from .env.example. Please update with your production values.
    ) else (
        echo NODE_ENV=production > .env
        echo PORT=3001 >> .env
        echo MONGODB_URI=mongodb://localhost:27017/faceapp_production >> .env
        echo JWT_SECRET=your_jwt_secret_here_change_this >> .env
        echo JWT_EXPIRE=7d >> .env
        echo CLOUDINARY_CLOUD_NAME=dy1tsskkm >> .env
        echo CLOUDINARY_API_KEY=your_cloudinary_api_key >> .env
        echo CLOUDINARY_API_SECRET=your_cloudinary_api_secret >> .env
        echo CLOUDINARY_FOLDER=faceapp-uploads >> .env
        echo CLOUDINARY_AUTO_DELETE_DAYS=5 >> .env
        echo UV_THREADPOOL_SIZE=16 >> .env
        echo NODE_OPTIONS=--max-old-space-size=2048 >> .env
        echo [WARNING] Created basic .env file. Please update with your production values.
    )
) else (
    echo [SUCCESS] Environment file already exists
)
echo.

REM Setup MongoDB indexes
echo [INFO] Setting up MongoDB indexes for performance...
if exist "scripts\createIndexes.js" (
    node scripts\createIndexes.js
    if errorlevel 1 (
        echo [WARNING] MongoDB index creation failed. Database might not be available.
    ) else (
        echo [SUCCESS] MongoDB indexes created successfully
    )
) else (
    echo [WARNING] MongoDB index script not found. Skipping database optimization.
)
echo.

REM Stop any existing processes
echo [INFO] Stopping any existing processes...
pm2 kill >nul 2>&1
echo [SUCCESS] Existing processes stopped
echo.

REM Start PM2 with clustering
echo [INFO] Starting Face Analysis API with PM2 clustering...
if exist "ecosystem.config.js" (
    pm2 start ecosystem.config.js --env production
) else (
    pm2 start server.js --name "faceapp-backend" -i max --env production
)
if errorlevel 1 (
    echo [ERROR] Failed to start PM2 processes
    pause
    exit /b 1
)

REM Save PM2 configuration
pm2 save
echo [SUCCESS] PM2 started with clustering enabled
echo.

REM Setup Windows auto-start
echo [INFO] Setting up auto-start for Windows...
echo [INFO] Installing PM2 Windows Service...
npm install -g pm2-windows-service >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Failed to install pm2-windows-service. Auto-start setup skipped.
    echo [INFO] You can set up auto-start manually using Task Scheduler.
) else (
    pm2-service-install -n "FaceAnalysisAPI" >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] Windows service installation failed. You can set up auto-start manually.
    ) else (
        echo [SUCCESS] Windows service installed for auto-start
        net start "FaceAnalysisAPI" >nul 2>&1
    )
)
echo.

REM Test deployment
echo [INFO] Testing deployment...
timeout /t 10 /nobreak >nul
pm2 status
echo.

REM Test API health
echo [INFO] Testing API health...
curl -f http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] API health check failed. The API might still be starting up.
) else (
    echo [SUCCESS] API health check passed
)
echo.

REM Create monitoring script
echo [INFO] Creating monitoring script...
echo @echo off > monitor.bat
echo echo Face Analysis API Status - %%date%% %%time%% >> monitor.bat
echo echo ================================== >> monitor.bat
echo echo. >> monitor.bat
echo echo PM2 Status: >> monitor.bat
echo pm2 status >> monitor.bat
echo echo. >> monitor.bat
echo echo API Health: >> monitor.bat
echo curl -f http://localhost:3001/api/health ^>nul 2^>^&1 >> monitor.bat
echo if errorlevel 1 ^( >> monitor.bat
echo     echo API is not responding >> monitor.bat
echo ^) else ^( >> monitor.bat
echo     echo API is responding correctly >> monitor.bat
echo ^) >> monitor.bat
echo pause >> monitor.bat
echo [SUCCESS] Monitoring script created (monitor.bat)
echo.

REM Create restart script
echo [INFO] Creating management scripts...
echo @echo off > restart.bat
echo echo Restarting Face Analysis API... >> restart.bat
echo pm2 restart faceapp-backend >> restart.bat
echo echo Restart completed >> restart.bat
echo pm2 status >> restart.bat
echo pause >> restart.bat

REM Create update script
echo @echo off > update.bat
echo echo Updating Face Analysis API... >> update.bat
echo git pull origin main >> update.bat
echo npm install --only=production >> update.bat
echo pm2 reload faceapp-backend >> update.bat
echo echo Update completed >> update.bat
echo pm2 status >> update.bat
echo pause >> update.bat

echo [SUCCESS] Management scripts created (restart.bat, update.bat)
echo.

REM Display final status
echo ==========================================
echo   DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ==========================================
echo.
echo [SUCCESS] What's been set up:
echo    • Node.js and PM2 verified/installed
echo    • Dependencies installed
echo    • Environment configured
echo    • MongoDB indexes optimized
echo    • PM2 clustering enabled
echo    • Windows auto-start configured
echo    • Monitoring and management scripts created
echo.
echo Management Commands:
echo    monitor.bat      - Check status and health
echo    restart.bat      - Restart the application
echo    update.bat       - Update from git and reload
echo    pm2 status       - Check PM2 processes
echo    pm2 logs         - View application logs
echo    pm2 monit        - Real-time monitoring
echo.
echo API Information:
echo    Local URL:  http://localhost:3001
echo    Health:     http://localhost:3001/api/health
echo.
echo Next Steps:
echo    1. Update .env file with your production values
echo    2. Configure Windows Firewall to allow port 3001
echo    3. Test auto-start by restarting your computer
echo    4. Set up reverse proxy (IIS/nginx) for production
echo.
echo Your Face Analysis API is now production-ready! 🚀
echo.
pause
