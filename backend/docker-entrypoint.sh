#!/bin/sh
set -e

echo "🐳 Docker Entrypoint - Starting initialization..."

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

# Seed database using the standard seed script
echo "🌱 Seeding database..."
npm run seed

# Start the application
echo "🚀 Starting NestJS application..."
exec node dist/main
