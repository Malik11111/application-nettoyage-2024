# Multi-stage build for optimal production image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY index.html ./
COPY public ./public

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for nginx worker processes
RUN addgroup -g 1001 -S frontend && \
    adduser -S frontend -u 1001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]