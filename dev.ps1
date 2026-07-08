# Howard AIOS — Development Startup Script (PowerShell)
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

function Log($msg) { Write-Host "[AIOS] $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "[AIOS] $msg" -ForegroundColor Yellow }

# Step 1: Docker
Log "Starting Docker services..."
try {
    docker compose -f docker/docker-compose.yml up -d postgres redis qdrant
} catch {
    Warn "Docker not available - skipping"
}

# Step 2: Wait for services
Log "Waiting for PostgreSQL..."
Start-Sleep -Seconds 5

# Step 3: Prisma
Log "Generating Prisma client..."
pnpm --filter @howard-aios/database db:generate
Log "Pushing schema..."
pnpm --filter @howard-aios/database db:push

# Step 4: Open browsers
Log "Frontend:  http://localhost:3001"
Log "API:       http://localhost:3000"
Log "Swagger:   http://localhost:3000/docs"

Start-Sleep -Seconds 2
Start-Process "http://localhost:3001"
Start-Process "http://localhost:3000/docs"

# Step 5: Dev
pnpm turbo dev
