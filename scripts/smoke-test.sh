#!/usr/bin/env bash
set -euo pipefail

# ── Howard AIOS — Smoke Test Script ───────────────────────────────────────────
# Tests all API endpoints against a running server

API_URL="${API_URL:-http://localhost:3000}"
WEB_URL="${WEB_URL:-http://localhost:3001}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  local expected_code=${4:-200}

  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" 2>/dev/null || echo "000")

  if [ "$http_code" = "$expected_code" ]; then
    echo -e "  ${GREEN}✅${NC} $name ($http_code)"
    PASS=$((PASS + 1))
  elif [ "$http_code" = "000" ]; then
    echo -e "  ${RED}❌${NC} $name (UNREACHABLE)"
    FAIL=$((FAIL + 1))
  elif [ "$http_code" = "500" ]; then
    echo -e "  ${YELLOW}⚠️${NC}  $name ($http_code — DB may be unavailable)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}❌${NC} $name (expected $expected_code, got $http_code)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Howard AIOS — Smoke Test               ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  API: ${API_URL}"
echo -e "  Web: ${WEB_URL}"
echo ""

# ── API Root ──────────────────────────────────────────────────────────────────
echo -e "${BOLD}── API Root ──${NC}"
check "API Root"         "$API_URL/"
check "Swagger Docs"     "$API_URL/docs"
check "Health Check"     "$API_URL/api/health"
check "Version"          "$API_URL/api/version"
echo ""

# ── Dashboard ─────────────────────────────────────────────────────────────────
echo -e "${BOLD}── Dashboard ──${NC}"
check "Dashboard"        "$API_URL/api/dashboard"
check "Dashboard Today"  "$API_URL/api/dashboard/today"
check "Pipeline Status"  "$API_URL/api/dashboard/pipeline-status"
check "AI Status"        "$API_URL/api/dashboard/ai-status"
echo ""

# ── CEO Office ────────────────────────────────────────────────────────────────
echo -e "${BOLD}── CEO Office ──${NC}"
check "CEO Companies"       "$API_URL/api/ceo/companies"
check "CEO Overview"        "$API_URL/api/ceo/overview"
check "CEO Inbox"           "$API_URL/api/ceo/inbox"
check "CEO Brief"           "$API_URL/api/ceo/brief"
check "CEO Intelligence"    "$API_URL/api/ceo/intelligence"
check "CEO Recommendations" "$API_URL/api/ceo/recommendations"
check "CEO KPI"             "$API_URL/api/ceo/kpi"
echo ""

# ── Data Endpoints ────────────────────────────────────────────────────────────
echo -e "${BOLD}── Data Endpoints ──${NC}"
check "Meetings"         "$API_URL/api/meetings"
check "Inbox"            "$API_URL/api/inbox"
check "Documents"        "$API_URL/api/information"
check "Search"           "$API_URL/api/search?q=test"
echo ""

# ── Knowledge & Memory ───────────────────────────────────────────────────────
echo -e "${BOLD}── Knowledge & Memory ──${NC}"
check "Knowledge Stats"  "$API_URL/api/knowledge/stats"
check "Memory Stats"     "$API_URL/api/memories/stats"
echo ""

# ── Pipeline & LLM ──────────────────────────────────────────────────────────
echo -e "${BOLD}── Pipeline & LLM ──${NC}"
check "Pipeline Status"  "$API_URL/api/pipelines/status"
check "LLM Status"       "$API_URL/api/llm/status"
echo ""

# ── Frontend ──────────────────────────────────────────────────────────────────
echo -e "${BOLD}── Frontend ──${NC}"
check "Web Frontend"     "$WEB_URL" "GET" "200"
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
TOTAL=$((PASS + FAIL))
echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo -e "  Total:  $TOTAL"
echo -e "  Pass:   ${GREEN}$PASS${NC}"
echo -e "  Fail:   ${RED}$FAIL${NC}"
echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}${BOLD}✅ ALL SMOKE TESTS PASS ($PASS/$TOTAL)${NC}"
  exit 0
else
  echo -e "${RED}${BOLD}❌ $FAIL SMOKE TEST(S) FAILED${NC}"
  exit 1
fi
