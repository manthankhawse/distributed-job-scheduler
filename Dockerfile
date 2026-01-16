# ==========================================
# STAGE 1: Build Frontend (Client)
# ==========================================
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy config files
COPY client/package.json client/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY client/ .
# 🟢 Set API URL to empty string (relative path)
ENV VITE_API_URL=""
RUN pnpm run build

# ==========================================
# STAGE 2: Build Backend (Scheduler)
# ==========================================
FROM node:20-alpine AS server-builder
WORKDIR /app/server

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy config files
COPY scheduler/package.json scheduler/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY scheduler/ .
# This runs 'tsc' (Make sure you added the "build": "tsc" script!)
RUN pnpm run build 

# ==========================================
# STAGE 3: Final Production Image
# ==========================================
FROM node:20-slim

# 🟢 Install Docker CLI (Required for Worker to spawn sibling containers)
RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy Backend Manifests
COPY --from=server-builder /app/server/package.json ./
COPY --from=server-builder /app/server/pnpm-lock.yaml ./

# Install ONLY production deps
RUN pnpm install --prod --frozen-lockfile

# Copy Backend Build
COPY --from=server-builder /app/server/dist ./dist

# Copy Frontend Build (to 'public' folder served by Express)
COPY --from=client-builder /app/client/dist ./public

# Environment
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 🟢 USE TINI + START SCRIPT
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["./start.sh"]