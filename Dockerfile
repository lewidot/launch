# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy root package.json and lock file
COPY package.json bun.lock ./

# Copy workspace packages
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/

# Install all dependencies
RUN bun install --frozen-lockfile

# Copy all source code
COPY server ./server
COPY frontend ./frontend

# Build frontend (outputs to server/public)
WORKDIR /app/frontend
RUN bun run build

# Build server executable
WORKDIR /app/server
RUN bun run build

# Stage 3: Runtime with Playwright
FROM mcr.microsoft.com/playwright:v1.57.0-noble

WORKDIR /app

# Copy the compiled server executable
COPY --from=builder /app/server/server .

# Copy the built frontend assets
COPY --from=builder /app/server/public ./public

# Copy and setup entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT [ "/entrypoint.sh" ]
