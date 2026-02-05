@echo off
TITLE LS9 OTOP Website Launcher
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo       LS9 OTOP Website Launcher
echo ==========================================
echo.

:: Check for node_modules
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] npm install failed. Please check your Node.js installation.
        pause
        exit /b !errorlevel!
    )
    echo [SUCCESS] Dependencies installed.
    echo.
)

:: Start the development server
echo [INFO] Starting website at http://localhost:5173 ...
echo.
npm run dev

echo.
echo Website stopped.
pause
