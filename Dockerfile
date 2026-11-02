# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev --no-audit

# Stage 3: Production image
FROM node:22-alpine AS runner
WORKDIR /app

# Run as non-root user
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser

# Copy built artifacts and minimal deps
COPY --from=builder --chown=appuser:appgroup /app/.next /app/.next
COPY --from=builder --chown=appuser:appgroup /app/node_modules /app/node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json /app/package.json
COPY --from=builder --chown=appuser:appgroup /app/public /app/public

ENV NODE_ENV=production
EXPOSE 3101

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3101 || exit 1

CMD ["npm", "start"]
