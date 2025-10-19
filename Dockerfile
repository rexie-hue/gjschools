# Multi-stage Dockerfile for EduManage Pro

# Development stage
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S edumanage -u 1001

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Change ownership to app user
RUN chown -R edumanage:nodejs /app
USER edumanage

# Expose port
EXPOSE 4000

# Start development server
CMD ["npm", "run", "dev"]

# Production build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Optional: Run tests
# RUN npm test

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk --no-cache add dumb-init

# Set working directory
WORKDIR /app

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S edumanage -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build --chown=edumanage:nodejs /app .

# Remove unnecessary files in production
RUN rm -rf .git \
    && rm -rf node_modules/.cache \
    && rm -rf /tmp/*

# Set environment to production
ENV NODE_ENV=production

# Change to app user
USER edumanage

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Expose port
EXPOSE 4000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start production server
CMD ["npm", "start"]

# Standalone stage (for simple deployment)
FROM node:18-alpine AS standalone

WORKDIR /app

# Install system dependencies
RUN apk --no-cache add \
    postgresql-client \
    curl \
    dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S edumanage -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/temp

# Set permissions
RUN chown -R edumanage:nodejs /app

# Switch to app user
USER edumanage

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Expose port
EXPOSE 4000

# Start command
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# Build arguments for customization
ARG BUILD_VERSION="1.0.0"
ARG BUILD_DATE
ARG BUILD_COMMIT

# Labels for image metadata
LABEL maintainer="EduManage Team <support@edumanage.com>" \
      version="${BUILD_VERSION}" \
      description="EduManage Pro - School Management System" \
      build-date="${BUILD_DATE}" \
      build-commit="${BUILD_COMMIT}" \
      org.opencontainers.image.title="EduManage Pro" \
      org.opencontainers.image.description="Complete school management system" \
      org.opencontainers.image.version="${BUILD_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.source="https://github.com/yourusername/edumanage-pro" \
      org.opencontainers.image.vendor="EduManage" \
      org.opencontainers.image.licenses="MIT"

# Build instructions:
# Development: docker build --target development -t edumanage-pro:dev .
# Production:  docker build --target production -t edumanage-pro:prod .
# Standalone:  docker build --target standalone -t edumanage-pro:standalone .