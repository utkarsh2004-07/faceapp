@echo off
echo 🧪 Complete API Testing Suite
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo 💡 Please run this script from the backend directory
    echo    Example: cd D:\myidea\backend
    pause
    exit /b 1
)

REM Check if server is running
echo 🔍 Checking if server is running...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Server is not running
    echo 💡 Please start the server first with: npm start
    pause
    exit /b 1
)
echo ✅ Server is running

echo.
echo 🚀 Starting Complete Testing Suite...
echo ========================================
echo.

REM Run the complete test suite
node run-all-tests.js

echo.
echo ========================================
echo ✅ Testing Complete!
echo.
echo 📖 For detailed documentation, see:
echo    - COMPLETE_TESTING_GUIDE.md
echo    - COMPLETE_API_GUIDE.md
echo    - QUICK_API_REFERENCE.md
echo.
pause
