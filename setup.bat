@echo off
REM PDF Annotation App - Setup Script for Windows

echo.
echo 🚀 PDF Annotation App Setup
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo 📝 Creating .env.local from .env.example...
    copy .env.example .env.local
    echo ✅ .env.local created. Please fill in your Supabase credentials.
) else (
    echo ✅ .env.local already exists
)

echo.
echo 📦 Installing dependencies...
call npm install

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Fill in .env.local with your Supabase URL and Anon Key
echo 2. Run 'npm run dev' to start development server
echo 3. Visit http://localhost:3000
echo.
echo For detailed setup instructions, see QUICKSTART.md
echo.
pause
