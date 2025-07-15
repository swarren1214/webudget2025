@echo off
setlocal enabledelayedexpansion

:: WeBudget Development Environment Setup Script (Windows)
:: This script helps you get the entire development environment running with minimal effort

echo.
echo ==========================================
echo ^🚀 WeBudget Development Environment Setup
echo ==========================================
echo.

echo This script will help you set up the complete WeBudget development environment.
echo It will:
echo   ✓ Check system requirements
echo   ✓ Set up environment variables
echo   ✓ Install dependencies
echo   ✓ Start the development environment
echo.

set /p "proceed=Ready to proceed? (y/n): "
if /i "!proceed!" neq "y" (
    echo Setup cancelled.
    exit /b 0
)

:: Step 1: Check Prerequisites
echo.
echo ==========================================
echo ^📋 Step 1: Checking Prerequisites
echo ==========================================
echo.

set "missing_deps=0"

:: Check for Docker
docker --version >nul 2>&1
if !errorlevel! equ 0 (
    docker info >nul 2>&1
    if !errorlevel! equ 0 (
        echo [INFO] ✓ Docker is installed and running
    ) else (
        echo [ERROR] Docker is installed but not running. Please start Docker Desktop.
        set "missing_deps=1"
    )
) else (
    echo [ERROR] Docker is not installed. Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    set "missing_deps=1"
)

:: Check for Node.js
node --version >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set "node_version=%%i"
    echo [INFO] ✓ Node.js is installed (!node_version!)
) else (
    echo [ERROR] Node.js is not installed. Please install Node.js from: https://nodejs.org/
    set "missing_deps=1"
)

:: Check for npm
npm --version >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set "npm_version=%%i"
    echo [INFO] ✓ npm is installed (!npm_version!)
) else (
    echo [ERROR] npm is not installed. It should come with Node.js.
    set "missing_deps=1"
)

if "!missing_deps!" equ "1" (
    echo [ERROR] Please install the missing dependencies and run this script again.
    pause
    exit /b 1
)

:: Step 2: Environment Configuration
echo.
echo ==========================================
echo ^⚙️  Step 2: Environment Configuration
echo ==========================================
echo.

if not exist .env (
    echo [INFO] Creating .env file from template...
    
    if not exist .env.example (
        echo [ERROR] .env.example file not found. Creating a basic template...
        (
            echo # Database Configuration
            echo POSTGRES_USER=webudget_user
            echo POSTGRES_PASSWORD=your_secure_password_here
            echo POSTGRES_DB=webudget_db
            echo DATABASE_URL=postgresql://webudget_user:your_secure_password_here@localhost:5432/webudget_db
            echo.
            echo # API Configuration
            echo JWT_SECRET=your_jwt_secret_here
            echo SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here
            echo ENCRYPTION_KEY=your_64_character_encryption_key_here
            echo.
            echo # Plaid Configuration (get from https://dashboard.plaid.com/team/keys^)
            echo PLAID_CLIENT_ID=your_plaid_client_id_here
            echo PLAID_SECRET=your_plaid_secret_here
            echo PLAID_ENV=sandbox
            echo.
            echo # Frontend Configuration (Vite^)
            echo VITE_API_BASE_URL=http://localhost:3000
            echo VITE_SUPABASE_URL=https://your-project.supabase.co
            echo VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
        ) > .env.example
    )
    
    copy .env.example .env >nul
    echo [INFO] ✓ Created .env file
    
    echo.
    echo [WARNING] IMPORTANT: You need to configure your .env file with actual values.
    echo.
    echo Required steps:
    echo 1. Set a secure POSTGRES_PASSWORD
    echo 2. Generate JWT_SECRET (can be any long random string^)
    echo 3. Generate SUPABASE_JWT_SECRET (can be any long random string^)
    echo 4. Generate ENCRYPTION_KEY (64 characters^)
    echo 5. Get Plaid credentials from https://dashboard.plaid.com/team/keys
    echo 6. Configure Supabase frontend variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY^)
    echo.
    
    set /p "edit_env=Would you like to open the .env file now to configure it? (y/n): "
    if /i "!edit_env!" equ "y" (
        if exist "%ProgramFiles%\Microsoft VS Code\Code.exe" (
            "%ProgramFiles%\Microsoft VS Code\Code.exe" .env
        ) else (
            notepad .env
        )
        
        echo.
        echo [WARNING] Please configure your .env file with the actual values mentioned above.
        pause
    ) else (
        echo [WARNING] Remember to configure your .env file before continuing!
        pause
    )
) else (
    echo [INFO] ✓ .env file already exists
)

:: Step 3: Install Dependencies
echo.
echo ==========================================
echo ^📦 Step 3: Installing Dependencies
echo ==========================================
echo.

echo [INFO] Installing root dependencies...
call npm install

echo [INFO] Installing client dependencies...
cd client
call npm install
cd ..

echo [INFO] Installing server dependencies...
cd server
call npm install
cd ..

echo [INFO] ✓ All dependencies installed

:: Step 4: Choose Development Mode
echo.
echo ==========================================
echo ^🔧 Step 4: Choose Development Mode
echo ==========================================
echo.

echo Choose your preferred development setup:
echo.
echo 1. 🐳 Full Docker Mode (Recommended for beginners^)
echo    - Everything runs in Docker containers
echo    - Most consistent across different machines
echo    - Slightly slower frontend hot-reload
echo.
echo 2. 🔀 Hybrid Mode (Recommended for experienced developers^)
echo    - Backend + Database in Docker
echo    - Frontend runs natively (faster development^)
echo    - Requires Node.js setup locally
echo.

:choice_loop
set /p "choice=Enter your choice (1 or 2): "
if "!choice!" equ "1" (
    set "development_mode=docker"
    goto :start_env
) else if "!choice!" equ "2" (
    set "development_mode=hybrid"
    goto :start_env
) else (
    echo Please enter 1 or 2.
    goto :choice_loop
)

:start_env
:: Step 5: Start Development Environment
echo.
echo ==========================================
echo ^🚀 Step 5: Starting Development Environment
echo ==========================================
echo.

if "!development_mode!" equ "docker" (
    echo [INFO] Starting Full Docker development environment...
    echo [INFO] This may take a few minutes on the first run...
    
    call npm run dev:docker
    
) else if "!development_mode!" equ "hybrid" (
    echo [INFO] Starting Hybrid development environment...
    echo [INFO] Backend and database in Docker, frontend native...
    
    call npm run dev:hybrid
)

echo.
echo ==========================================
echo ^🎉 Setup Complete!
echo ==========================================
echo.

echo Your WeBudget development environment is now running!
echo.
echo 🌐 Access your application:
echo   • Frontend: http://localhost:5173
echo   • Backend API: http://localhost:3000
echo   • API Health Check: http://localhost:3000/health
echo.
echo 📚 Useful commands:
echo   • Stop: npm run dev:docker:down
echo   • Restart: npm run dev:docker
echo   • View logs: docker compose -f docker-compose.dev.yml logs -f
echo.
echo 🔧 Need help? Check the documentation:
echo   • README.md - Quick start guide
echo   • docs/Deployment ^& Operations Guide.md - Detailed setup
echo.
echo Happy coding! 🚀
echo.
pause 