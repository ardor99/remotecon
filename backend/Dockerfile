# Backend Dockerfile for NestJS API
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Copy node_modules from builder (includes all dependencies and generated client)
COPY --from=builder /app/node_modules ./node_modules

# Install Prisma CLI globally for migrations  
RUN npm install -g prisma

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.js ./

# Expose port
EXPOSE 3000

# Start command - test direct start first
CMD ["node", "dist/main"]
# CMD ["node", "docker-entrypoint.js"]
