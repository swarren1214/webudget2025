# WeBudget Development Quick Reference

## 🚀 Getting Started

### First Time Setup
```bash
# Mac/Linux
./setup.sh

# Windows
setup.cmd
```

### Manual Setup
```bash
# Install dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your values (includes both server and client variables)
```

## 🔧 Daily Development Commands

### Start Development Environment
```bash
# Recommended: Backend in Docker, Frontend native (fastest)
npm run dev:hybrid

# Alternative: Everything in Docker (most consistent)
npm run dev:docker

# Stop everything
npm run dev:docker:down
```

### Individual Services
```bash
# Start only backend services (API)
docker compose -f docker-compose.dev.yml up -d api

# Start only frontend (native)
cd client && npm run dev
```

## 📊 Quick Debugging

### Check Status
```bash
# Check running containers
docker compose -f docker-compose.dev.yml ps

# Health check
curl http://localhost:3000/health
```

### View Logs
```bash
# API logs
docker compose -f docker-compose.dev.yml logs -f api
```

## 📱 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Main application |
| Backend API | http://localhost:3000 | REST API |
| API Health | http://localhost:3000/health | Health check |
| Supabase | https://app.supabase.io | Database |

## 🛠️ Common Tasks

### Database
```bash
# Run migrations
docker compose -f docker-compose.dev.yml run --rm api npm run migrate:up

# Connect to Supabase
# Use the Supabase dashboard or a PostgreSQL client with the connection string provided in your .env file
```

### Clean Reset
```bash
# Nuclear option: Remove everything and start fresh
docker compose -f docker-compose.dev.yml down -v
npm run dev:docker
```

---

**Need help?** Run the setup script again or check the full documentation in `docs/` directory.