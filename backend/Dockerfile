# Backend Dockerfile
FROM node:18-alpine

# Build argument to determine environment
ARG NODE_ENV=production

# Set working directory
WORKDIR /app

# Install git for development dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies based on environment
RUN if [ "$NODE_ENV" = "development" ] ; then \
        npm install ; \
    else \
        npm ci --only=production && \
        npm install --only=dev typescript ts-node @types/node ; \
    fi

# Copy source code
COPY . .

# Build TypeScript for production
RUN if [ "$NODE_ENV" = "production" ] ; then npm run build ; fi

# Create non-root user for production
RUN if [ "$NODE_ENV" = "production" ] ; then \
        addgroup -g 1001 -S nodejs && \
        adduser -S nodejs -u 1001 && \
        chown -R nodejs:nodejs /app ; \
    fi

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Switch to non-root user for production
USER ${NODE_ENV:+nodejs}

# Start command based on environment
CMD if [ "$NODE_ENV" = "development" ] ; then npm run dev ; else node dist/index.js ; fi
