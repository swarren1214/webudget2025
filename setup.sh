#!/bin/bash

# WeBudget Development Environment Setup Script
# This script helps you get the entire development environment running with minimal effort

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}===========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===========================================${NC}\n"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for user input
wait_for_user() {
    echo -e "\n${YELLOW}Press Enter to continue...${NC}"
    read -r
}

# Function to ask yes/no question
ask_yes_no() {
    while true; do
        read -p "$1 (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

print_header "🚀 WeBudget Development Environment Setup"

echo "This script will help you set up the complete WeBudget development environment."
echo "It will:"
echo "  ✓ Check system requirements"
echo "  ✓ Set up environment variables"
echo "  ✓ Install dependencies"
echo "  ✓ Start the development environment"
echo ""

if ! ask_yes_no "Ready to proceed?"; then
    echo "Setup cancelled."
    exit 0
fi

# Step 1: Check Prerequisites
print_header "📋 Step 1: Checking Prerequisites"

MISSING_DEPS=0

# Check for Docker
if command_exists docker; then
    if docker info >/dev/null 2>&1; then
        print_status "✓ Docker is installed and running"
    else
        print_error "Docker is installed but not running. Please start Docker Desktop."
        MISSING_DEPS=1
    fi
else
    print_error "Docker is not installed. Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    MISSING_DEPS=1
fi

# Check for Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "✓ Node.js is installed ($NODE_VERSION)"
else
    print_error "Node.js is not installed. Please install Node.js from: https://nodejs.org/"
    MISSING_DEPS=1
fi

# Check for npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status "✓ npm is installed ($NPM_VERSION)"
else
    print_error "npm is not installed. It should come with Node.js."
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Please install the missing dependencies and run this script again."
    exit 1
fi

# Step 2: Environment Configuration
print_header "⚙️  Step 2: Environment Configuration"

if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    
    if [ ! -f .env.example ]; then
        print_error ".env.example file not found. Creating a basic template..."
        cat > .env.example << 'EOF'
# Database Configuration
POSTGRES_USER=webudget_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=webudget_db
DATABASE_URL=postgresql://webudget_user:your_secure_password_here@localhost:5432/webudget_db

# API Configuration
JWT_SECRET=your_jwt_secret_here
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here
ENCRYPTION_KEY=your_64_character_encryption_key_here

# Plaid Configuration (get from https://dashboard.plaid.com/team/keys)
PLAID_CLIENT_ID=your_plaid_client_id_here
PLAID_SECRET=your_plaid_secret_here
PLAID_ENV=sandbox

# Frontend Configuration (Vite)
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOF
    fi
    
    cp .env.example .env
    print_status "✓ Created .env file"
    
    print_warning "IMPORTANT: You need to configure your .env file with actual values."
    echo ""
    echo "Required steps:"
    echo "1. Set a secure POSTGRES_PASSWORD"
    echo "2. Generate JWT_SECRET (can be any long random string)"
    echo "3. Generate SUPABASE_JWT_SECRET (can be any long random string)"
    echo "4. Generate ENCRYPTION_KEY (64 characters, use: openssl rand -hex 32)"
    echo "5. Get Plaid credentials from https://dashboard.plaid.com/team/keys"
    echo "6. Configure Supabase frontend variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)"
    echo ""
    
    if ask_yes_no "Would you like to open the .env file now to configure it?"; then
        if command_exists code; then
            code .env
        elif command_exists nano; then
            nano .env
        elif command_exists vi; then
            vi .env
        else
            print_warning "No text editor found. Please manually edit the .env file."
        fi
        
        echo ""
        print_warning "Please configure your .env file with the actual values mentioned above."
        wait_for_user
    else
        print_warning "Remember to configure your .env file before continuing!"
        wait_for_user
    fi
else
    print_status "✓ .env file already exists"
fi

# Step 3: Install Dependencies
print_header "📦 Step 3: Installing Dependencies"

print_status "Installing root dependencies..."
npm install

print_status "Installing client dependencies..."
cd client
npm install
cd ..

print_status "Installing server dependencies..."
cd server
npm install
cd ..

print_status "✓ All dependencies installed"

# Step 4: Choose Development Mode
print_header "🔧 Step 4: Choose Development Mode"

echo "Choose your preferred development setup:"
echo ""
echo "1. 🐳 Full Docker Mode (Recommended for beginners)"
echo "   - Everything runs in Docker containers"
echo "   - Most consistent across different machines"
echo "   - Slightly slower frontend hot-reload"
echo ""
echo "2. 🔀 Hybrid Mode (Recommended for experienced developers)"
echo "   - Backend + Database in Docker"
echo "   - Frontend runs natively (faster development)"
echo "   - Requires Node.js setup locally"
echo ""

while true; do
    read -p "Enter your choice (1 or 2): " choice
    case $choice in
        1)
            DEVELOPMENT_MODE="docker"
            break
            ;;
        2)
            DEVELOPMENT_MODE="hybrid"
            break
            ;;
        *)
            echo "Please enter 1 or 2."
            ;;
    esac
done

# Step 5: Start Development Environment
print_header "🚀 Step 5: Starting Development Environment"

if [ "$DEVELOPMENT_MODE" = "docker" ]; then
    print_status "Starting Full Docker development environment..."
    print_status "This may take a few minutes on the first run..."
    
    npm run dev:docker
    
elif [ "$DEVELOPMENT_MODE" = "hybrid" ]; then
    print_status "Starting Hybrid development environment..."
    print_status "Backend and database in Docker, frontend native..."
    
    print_status "Starting Hybrid development environment..."
    npm run dev:hybrid
fi

print_header "🎉 Setup Complete!"

echo "Your WeBudget development environment is now running!"
echo ""
echo "🌐 Access your application:"
echo "  • Frontend: http://localhost:5173"
echo "  • Backend API: http://localhost:3000"
echo "  • API Health Check: http://localhost:3000/health"
echo ""
echo "📚 Useful commands:"
echo "  • Stop: npm run dev:docker:down"
echo "  • Restart: npm run dev:docker"
echo "  • View logs: docker compose -f docker-compose.dev.yml logs -f"
echo ""
echo "🔧 Need help? Check the documentation:"
echo "  • README.md - Quick start guide"
echo "  • docs/Deployment & Operations Guide.md - Detailed setup"
echo ""
echo "Happy coding! 🚀" 