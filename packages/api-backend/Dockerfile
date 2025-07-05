# Build stage
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/api-backend/package.json ./packages/api-backend/
COPY packages/core-engine/package.json ./packages/core-engine/
COPY packages/shared/package.json ./packages/shared/

# Install pnpm
RUN npm install -g pnpm@8.15.6

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build --filter=@code-check/api-backend

# Production stage
FROM node:24-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/api-backend/package.json ./packages/api-backend/
COPY --from=builder /app/packages/core-engine/package.json ./packages/core-engine/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# Install pnpm
RUN npm install -g pnpm@8.15.6

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/packages/api-backend/dist ./packages/api-backend/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/core-engine/dist ./packages/core-engine/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/shared/dist ./packages/shared/dist

# Copy prisma files if they exist
COPY --from=builder --chown=nextjs:nodejs /app/packages/api-backend/prisma ./packages/api-backend/prisma 2>/dev/null || true

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "packages/api-backend/dist/index.js"]
