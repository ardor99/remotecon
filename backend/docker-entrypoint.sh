#!/bin/sh
set -e

echo "🐳 Docker Entrypoint - Starting initialization..."

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

# Seed database using the compiled seed script (idempotent upsert)
echo "🌱 Seeding database..."
node dist/prisma/seed.js || echo "⚠️  Seeding failed or was skipped"

# Start the application
echo "🚀 Starting NestJS application..."
node dist/src/main || { echo "❌ App crashed with exit code $?"; sleep 3600; }
