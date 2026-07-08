#!/usr/bin/env bash
set -euo pipefail

# ── Howard AIOS — Quality Check Script ────────────────────────────────────────
# Runs all guardian checks and reports PASS/FAIL

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0

run_check() {
  local name=$1
  local cmd=$2
  echo -e "${BOLD}── $name ──${NC}"
  if eval "$cmd" > /tmp/aios-check-output.log 2>&1; then
    echo -e "  ${GREEN}✅ PASS${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}❌ FAIL${NC}"
    tail -5 /tmp/aios-check-output.log
    FAIL=$((FAIL + 1))
  fi
  echo ""
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Howard AIOS — Quality Check            ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

run_check "Build"      "pnpm turbo build"
run_check "Typecheck"  "pnpm turbo typecheck"
run_check "Lint"       "pnpm turbo lint"
run_check "Test"       "pnpm turbo test"

echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo -e "  Build:     $([ $PASS -ge 1 ] && echo "${GREEN}✅ PASS${NC}" || echo "${RED}❌ FAIL${NC}")"
echo -e "  Typecheck: $([ $PASS -ge 2 ] && echo "${GREEN}✅ PASS${NC}" || echo "${RED}❌ FAIL${NC}")"
echo -e "  Lint:      $([ $PASS -ge 3 ] && echo "${GREEN}✅ PASS${NC}" || echo "${RED}❌ FAIL${NC}")"
echo -e "  Test:      $([ $PASS -ge 4 ] && echo "${GREEN}✅ PASS${NC}" || echo "${RED}❌ FAIL${NC}")"
echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}${BOLD}✅ ALL CHECKS PASS ($PASS/4)${NC}"
  exit 0
else
  echo -e "${RED}${BOLD}❌ $FAIL CHECK(S) FAILED${NC}"
  exit 1
fi
