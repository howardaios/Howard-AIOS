# ── Base ───────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate
WORKDIR /app
ENV CI=true
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV PNPM_CONFIRMMODULESPURGE=false
RUN pnpm config set confirmModulesPurge false 2>/dev/null; echo "pnpm config done"

# Fix DNS resolution for npm registry (Docker DNS issues) — inherited by all stages
RUN echo 'nameserver 8.8.8.8' >> /etc/resolv.conf && echo 'nameserver 8.8.4.4' >> /etc/resolv.conf

# Network configuration for pnpm (inherited by all stages)
RUN printf 'network-timeout=900000\nnetwork-concurrency=2\nfetch-retries=5\nfetch-retry-mintimeout=20000\nfetch-retry-maxtimeout=120000\n' > /root/.npmrc

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps

# Root config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# All workspace package.json files (required for pnpm workspace resolution)
COPY apps/api/package.json             ./apps/api/
COPY apps/web/package.json             ./apps/web/
COPY packages/config/package.json      ./packages/config/
COPY packages/database/package.json    ./packages/database/
COPY packages/types/package.json       ./packages/types/
COPY packages/utils/package.json       ./packages/utils/
COPY services/ai/package.json          ./services/ai/
COPY services/auth/package.json        ./services/auth/
COPY services/inbox/package.json       ./services/inbox/
COPY services/information/package.json ./services/information/
COPY services/knowledge/package.json   ./services/knowledge/
COPY services/meeting/package.json     ./services/meeting/
COPY services/ocr/package.json         ./services/ocr/
COPY services/pipeline/package.json    ./services/pipeline/
COPY services/rbac/package.json        ./services/rbac/
COPY services/search/package.json      ./services/search/
COPY services/speech/package.json      ./services/speech/
COPY services/upload/package.json      ./services/upload/
COPY services/workflow/package.json    ./services/workflow/

# Prisma schema (required for prisma generate)
COPY packages/database/prisma ./packages/database/prisma

# Install with --ignore-scripts to skip husky/prisma postinstall
# Multiple retries to handle intermittent DNS failures in Docker
RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --frozen-lockfile --ignore-scripts || pnpm install --frozen-lockfile --ignore-scripts

# Explicitly generate Prisma client (required for TypeScript build)
RUN pnpm --filter @howard-aios/database exec prisma generate

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS build

# Copy full source from build context (.dockerignore excludes node_modules etc.)
COPY . .

# Overlay installed node_modules from deps stage (overrides any host artifacts)
COPY --from=deps /app/node_modules ./node_modules

# Build only API and its transitive dependencies — no install triggered
RUN npx turbo run build --filter='@howard-aios/api...'

# Bundle with esbuild (resolves workspace .ts package exports + ESM issues)
# Workspace packages export .ts source files which Node.js can't run from node_modules
RUN npm install -g esbuild && esbuild apps/api/dist/index.js --bundle \
    --platform=node --target=node22 --format=cjs \
    --outfile=/app/apps/api/dist/index.bundle.cjs

# Copy Prisma engine binary next to the bundle
RUN cp /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/libquery_engine-*.so.node /app/apps/api/dist/ && \
    echo "Prisma engine copied"

# Copy @fastify/swagger-ui static files next to the bundle (esbuild changes __dirname)
RUN mkdir -p /app/apps/api/dist/static && \
    cp /app/node_modules/.pnpm/@fastify+swagger-ui*/node_modules/@fastify/swagger-ui/static/* /app/apps/api/dist/static/ && \
    echo "Swagger UI static files copied"

# ── Production ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV CI=true
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/dist/libquery_engine-linux-musl-openssl-3.0.x.so.node

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy esbuild bundle + Prisma engine + swagger static (all in apps/api/dist/)
COPY --from=build --chown=appuser:nodejs /app/apps/api/dist ./dist

# Copy node_modules from build stage (pnpm symlinks resolve correctly since both use /app)
COPY --from=build --chown=appuser:nodejs /app/node_modules ./node_modules

# Copy package.json for module resolution
COPY --from=build --chown=appuser:nodejs /app/apps/api/package.json ./package.json

USER appuser
EXPOSE 3000
CMD ["node", "dist/index.bundle.cjs"]
