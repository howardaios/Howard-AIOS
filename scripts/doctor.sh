#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS="${GREEN}✔${NC}"
FAIL="${RED}✘${NC}"
WARN="${YELLOW}⚠${NC}"

PASS_COUNT=0
FAIL_COUNT=0

check_pass() { echo -e "  ${PASS} $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
check_fail() { echo -e "  ${FAIL} $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }
check_warn() { echo -e "  ${WARN} $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}  Howard AIOS Doctor${NC}"
echo -e "${CYAN}  ─────────────────────────────────────${NC}"
echo ""

# ── 1. Docker ─────────────────────────────────────────────────────────────────
if command -v docker &>/dev/null; then
  if docker info &>/dev/null 2>&1; then
    DOCKER_VER=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    check_pass "Docker ${DOCKER_VER}"
  else
    check_fail "Docker — daemon not running"
    echo -e "    ${YELLOW}→ Start Docker Desktop${NC}"
  fi
else
  check_fail "Docker — not installed"
  echo -e "    ${YELLOW}→ Install: https://docs.docker.com/get-docker/${NC}"
fi

# ── 2. PostgreSQL ─────────────────────────────────────────────────────────────
PG_OK=false
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  if docker compose -f docker/docker-compose.yml ps postgres 2>/dev/null | grep -q "Up"; then
    if docker compose -f docker/docker-compose.yml exec -T postgres pg_isready -U postgres &>/dev/null 2>&1; then
      PG_OK=true
      check_pass "PostgreSQL — running (Docker)"
    fi
  fi
fi
if [ "$PG_OK" = false ]; then
  if command -v pg_isready &>/dev/null; then
    if pg_isready -h localhost -p 5432 &>/dev/null 2>&1; then
      PG_OK=true
      check_pass "PostgreSQL — running (local)"
    fi
  fi
fi
if [ "$PG_OK" = false ]; then
  check_fail "PostgreSQL — not reachable"
  echo -e "    ${YELLOW}→ Start: docker compose -f docker/docker-compose.yml up -d postgres${NC}"
fi

# ── 3. Redis ──────────────────────────────────────────────────────────────────
REDIS_OK=false
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  if docker compose -f docker/docker-compose.yml ps redis 2>/dev/null | grep -q "Up"; then
    if docker compose -f docker/docker-compose.yml exec -T redis redis-cli ping &>/dev/null 2>&1; then
      REDIS_OK=true
      check_pass "Redis — running (Docker)"
    fi
  fi
fi
if [ "$REDIS_OK" = false ]; then
  if command -v redis-cli &>/dev/null; then
    if redis-cli -h localhost -p 6379 ping 2>/dev/null | grep -q PONG; then
      REDIS_OK=true
      check_pass "Redis — running (local)"
    fi
  fi
fi
if [ "$REDIS_OK" = false ]; then
  check_fail "Redis — not reachable"
  echo -e "    ${YELLOW}→ Start: docker compose -f docker/docker-compose.yml up -d redis${NC}"
fi

# ── 4. Qdrant ─────────────────────────────────────────────────────────────────
QDRANT_OK=false
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  if docker compose -f docker/docker-compose.yml ps qdrant 2>/dev/null | grep -q "Up"; then
    QDRANT_OK=true
    check_pass "Qdrant — running (Docker)"
  fi
fi
if [ "$QDRANT_OK" = false ]; then
  if curl -sf http://localhost:6333/healthz &>/dev/null 2>&1; then
    QDRANT_OK=true
    check_pass "Qdrant — running (local)"
  fi
fi
if [ "$QDRANT_OK" = false ]; then
  check_fail "Qdrant — not reachable"
  echo -e "    ${YELLOW}→ Start: docker compose -f docker/docker-compose.yml up -d qdrant${NC}"
fi

# ── 5. DATABASE_URL ──────────────────────────────────────────────────────────
DB_URL_OK=false
if [ -f .env ]; then
  # Source .env to check DATABASE_URL
  set +u
  source .env 2>/dev/null || true
  set -u
  if [ -n "${DATABASE_URL:-}" ]; then
    DB_URL_OK=true
    # Mask password in URL for display
    MASKED_URL=$(echo "$DATABASE_URL" | sed 's|://[^:]*:[^@]*@|://***:***@|')
    check_pass "DATABASE_URL — configured (${MASKED_URL})"
  fi
fi
if [ "$DB_URL_OK" = false ]; then
  check_fail "DATABASE_URL — not configured"
  echo -e "    ${YELLOW}→ Copy .env.example to .env and set DATABASE_URL${NC}"
  echo -e "    ${YELLOW}→ Default: postgresql://postgres:postgres@localhost:5432/howard_aios${NC}"
fi

# ── 6. Prisma Client ─────────────────────────────────────────────────────────
PRISMA_OK=false
if [ -d node_modules/.pnpm ] && ls node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/index.js &>/dev/null 2>&1; then
  PRISMA_OK=true
  PRISMA_VER=$(cat node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/package.json 2>/dev/null | grep '"version"' | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
  check_pass "Prisma Client — generated (${PRISMA_VER:-installed})"
fi
if [ "$PRISMA_OK" = false ]; then
  check_fail "Prisma Client — not generated"
  echo -e "    ${YELLOW}→ Run: pnpm prisma:generate${NC}"
fi

# ── 7. API ────────────────────────────────────────────────────────────────────
API_OK=false
if curl -sf http://localhost:3000/api/health &>/dev/null 2>&1; then
  API_OK=true
  check_pass "API — running (localhost:3000)"
fi
if [ "$API_OK" = false ]; then
  if lsof -i :3000 -sTCP:LISTEN &>/dev/null 2>&1; then
    check_fail "API — port 3000 in use but not healthy"
    echo -e "    ${YELLOW}→ Check: curl http://localhost:3000/api/health${NC}"
  else
    check_fail "API — not running"
    echo -e "    ${YELLOW}→ Start: pnpm start${NC}"
  fi
fi

# ── 8. Web ────────────────────────────────────────────────────────────────────
WEB_OK=false
if curl -sf http://localhost:3001 &>/dev/null 2>&1; then
  WEB_OK=true
  check_pass "Web — running (localhost:3001)"
fi
if [ "$WEB_OK" = false ]; then
  if lsof -i :3001 -sTCP:LISTEN &>/dev/null 2>&1; then
    check_fail "Web — port 3001 in use but not healthy"
    echo -e "    ${YELLOW}→ Check browser: http://localhost:3001${NC}"
  else
    check_fail "Web — not running"
    echo -e "    ${YELLOW}→ Start: pnpm start${NC}"
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}  ─────────────────────────────────────${NC}"
TOTAL=$((PASS_COUNT + FAIL_COUNT))
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}✔ Environment Healthy${NC} (${PASS_COUNT}/${TOTAL} checks passed)"
else
  echo -e "  ${RED}${BOLD}✘ ${FAIL_COUNT} issue(s) found${NC} (${PASS_COUNT}/${TOTAL} checks passed)"
  echo -e "  ${YELLOW}Fix the issues above and run: pnpm doctor${NC}"
fi
echo ""

exit $FAIL_COUNT
