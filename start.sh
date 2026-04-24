#!/bin/bash

# ============================================
# AI Animal Shelter & Rescue Manager - Startup
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║   🐾 AI Animal Shelter & Rescue Manager 🐾   ║"
echo "  ╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create it.${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# ---- Kill processes on used ports ----
echo -e "\n${YELLOW}Cleaning up ports...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${YELLOW}Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo -e "  ${GREEN}Port $port is free${NC}"
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# ---- Check PostgreSQL ----
echo -e "\n${CYAN}Checking PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
  if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
    echo -e "  ${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    else
      sudo service postgresql start 2>/dev/null || true
    fi
    sleep 2
    if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
      echo -e "  ${GREEN}✓ PostgreSQL started${NC}"
    else
      echo -e "  ${RED}✗ Could not start PostgreSQL. Please start it manually.${NC}"
      exit 1
    fi
  fi
else
  echo -e "  ${YELLOW}⚠ pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ---- Create database if not exists ----
echo -e "\n${CYAN}Setting up database...${NC}"
DB_NAME=${DB_NAME:-animal_shelter}
DB_USER=${DB_USER:-postgres}

if psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME; then
  echo -e "  ${GREEN}✓ Database '$DB_NAME' exists${NC}"
else
  echo -e "  ${YELLOW}Creating database '$DB_NAME'...${NC}"
  createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER $DB_NAME 2>/dev/null || \
    psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
  echo -e "  ${GREEN}✓ Database created${NC}"
fi

# ---- Install dependencies ----
echo -e "\n${CYAN}Installing dependencies...${NC}"

echo -e "  ${BLUE}Installing backend dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
npm install --silent 2>&1 | tail -1
echo -e "  ${GREEN}✓ Backend dependencies installed${NC}"

echo -e "  ${BLUE}Installing frontend dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"
npm install --silent 2>&1 | tail -1
echo -e "  ${GREEN}✓ Frontend dependencies installed${NC}"

cd "$SCRIPT_DIR"

# ---- Seed database ----
echo -e "\n${CYAN}Seeding database...${NC}"
cd "$SCRIPT_DIR/backend"
node seed.js
echo -e "  ${GREEN}✓ Database seeded with sample data${NC}"

cd "$SCRIPT_DIR"

# ---- Start Backend with hot reload ----
echo -e "\n${CYAN}Starting backend server on port $BACKEND_PORT...${NC}"
cd "$SCRIPT_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!
echo -e "  ${GREEN}✓ Backend starting (PID: $BACKEND_PID) with hot reload (nodemon)${NC}"

cd "$SCRIPT_DIR"

# ---- Start Frontend with hot reload ----
echo -e "\n${CYAN}Starting frontend on port $FRONTEND_PORT...${NC}"
cd "$SCRIPT_DIR/frontend"
npx vite --port $FRONTEND_PORT --host &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓ Frontend starting (PID: $FRONTEND_PID) with hot reload (Vite HMR)${NC}"

cd "$SCRIPT_DIR"

# ---- Summary ----
echo -e "\n${PURPLE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Application is starting!${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo -e ""
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:$FRONTEND_PORT"
echo -e "  ${CYAN}Backend:${NC}   http://localhost:$BACKEND_PORT"
echo -e ""
echo -e "  ${YELLOW}Login Credentials:${NC}"
echo -e "    Admin: admin@shelter.com / admin123"
echo -e "    Staff: staff@shelter.com / staff123"
echo -e ""
echo -e "  ${YELLOW}Or use the Quick Login button on the login page!${NC}"
echo -e ""
echo -e "  ${BLUE}Both servers have hot reload enabled.${NC}"
echo -e "  ${BLUE}Press Ctrl+C to stop all services.${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"

# ---- Cleanup on exit ----
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  cleanup_port $BACKEND_PORT
  cleanup_port $FRONTEND_PORT
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Wait for both processes
wait
