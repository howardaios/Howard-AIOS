#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Colors & Helpers ──────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${GREEN}[AIOS]${NC} $1"; }
warn() { echo -e "${YELLOW}[AIOS]${NC} $1"; }
err()  { echo -e "${RED}[AIOS]${NC} $1"; }
info() { echo -e "${CYAN}[AIOS]${NC} $1"; }

# ── Banner ────────────────────────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}"
echo "  ╦ ╦╔═╗╦ ╦╔╦╗╦═╗  ╔═╗╦╔═╗╔═╗"
echo "  ╠═╣║ ║║ ║ ║ ╠╦╝  ╠═╣║║ ║╚═╗"
echo "  ╩ ╩╚═╝╚═╝ ╩ ╩╚═  ╩ ╩╩╚═╝╚═╝"
echo -e "${NC}"
echo -e "${CYAN}  Howard AIOS — Founder Operating System${NC}"
echo -e "${CYAN}  Beta v0.6 — Development Mode${NC}"
echo ""

# ── Step 1: Environment Checks ───────────────────────────────────────────────
log "Checking environment..."

# Node.js
if ! command -v node &>/dev/null; then
  err "Node.js not found. Please install Node.js >= 22: https://nodejs.org"
  exit 1
fi
NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 22 ]; then
  err "Node.js >= 22 required (found $(node -v))"
  exit 1
fi
info "Node.js $(node -v) ✓"

# pnpm
if ! command -v pnpm &>/dev/null; then
  err "pnpm not found. Install: npm install -g pnpm"
  exit 1
fi
info "pnpm $(pnpm -v) ✓"

# Docker
DOCKER_OK=false
if command -v docker &>/dev/null; then
  if docker info &>/dev/null 2>&1; then
    DOCKER_OK=true
    info "Docker $(docker --version | cut -d' ' -f3 | tr -d ',') ✓"
  else
    warn "Docker installed but daemon not running"
  fi
else
  warn "Docker not found — database services unavailable"
fi

# ── Step 2: .env + DATABASE_URL Pre-check ────────────────────────────────────
if [ ! -f .env ]; then
  warn ".env not found — copying from .env.example"
  cp .env.example .env
  info ".env created from .env.example"
fi

# Source .env to validate DATABASE_URL
set +u
source .env 2>/dev/null || true
set -u

if [ -z "${DATABASE_URL:-}" ]; then
  echo ""
  err "═══════════════════════════════════════════════════"
  err "  DATABASE_URL not found"
  err ""
  err "  Please configure:"
  err ""
  err "    Howard-AIOS/.env"
  err ""
  err "  Add the following line:"
  err ""
  err "    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/howard_aios"
  err ""
  err "  Then run: pnpm start"
  err "═══════════════════════════════════════════════════"
  echo ""
  exit 1
fi

# Mask password for display
MASKED_URL=$(echo "$DATABASE_URL" | sed 's|://[^:]*:[^@]*@|://***:***@|')
info "DATABASE_URL configured (${MASKED_URL}) ✓"

# ── Step 3: Port Checks ──────────────────────────────────────────────────────
log "Checking ports..."

check_port() {
  local port=$1 name=$2
  if lsof -i :"$port" -sTCP:LISTEN &>/dev/null 2>&1; then
    warn "Port $port ($name) already in use"
    return 1
  fi
  info "Port $port ($name) available ✓"
  return 0
}

check_port 3000 "API"   || true
check_port 3001 "Web"   || true
check_port 5432 "PgSQL" || true

# ── Step 4: Dependencies ─────────────────────────────────────────────────────
if [ ! -d node_modules ]; then
  log "Installing dependencies..."
  pnpm install
else
  info "node_modules found ✓"
fi

# ── Step 5: Start Docker services ─────────────────────────────────────────────
if [ "$DOCKER_OK" = true ]; then
  log "Starting Docker services (PostgreSQL, Redis, Qdrant)..."
  docker compose -f docker/docker-compose.yml up -d postgres redis qdrant 2>/dev/null || {
    warn "Docker compose failed — skipping container startup"
  }

  # Wait for PostgreSQL
  log "Waiting for PostgreSQL..."
  for _i in $(seq 1 30); do
    if docker compose -f docker/docker-compose.yml exec -T postgres pg_isready -U postgres &>/dev/null 2>&1; then
      log "PostgreSQL is ready"
      break
    fi
    sleep 1
  done

  # Wait for Redis
  log "Waiting for Redis..."
  for _i in $(seq 1 15); do
    if docker compose -f docker/docker-compose.yml exec -T redis redis-cli ping &>/dev/null 2>&1; then
      log "Redis is ready"
      break
    fi
    sleep 1
  done
else
  warn "Skipping Docker services (Docker unavailable)"
fi

# ── Step 6: Prisma ────────────────────────────────────────────────────────────
log "Generating Prisma client..."
pnpm prisma:generate

log "Pushing schema to database..."
pnpm prisma:push 2>/dev/null || warn "prisma:push skipped (no DB connection)"

log "Seeding demo companies..."
pnpm prisma:seed 2>/dev/null || warn "prisma:seed skipped (no DB connection)"

# ── Step 7: Start Turbo dev ──────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}  ═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀  Starting Howard AIOS Development Server${NC}"
echo -e "${BOLD}${GREEN}  ═══════════════════════════════════════════${NC}"
echo ""
info "Frontend:  http://localhost:3001"
info "API:       http://localhost:3000"
info "Swagger:   http://localhost:3000/docs"
info "Health:    http://localhost:3000/api/health"
info "Prisma:    http://localhost:5555  (run: pnpm studio)"
echo ""

# Open browser after short delay
(sleep 3 && open http://localhost:3001 2>/dev/null || true) &
(sleep 4 && open http://localhost:3000/docs 2>/dev/null || true) &

pnpm turbo dev
