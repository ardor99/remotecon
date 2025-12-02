# Docker Deployment Guide

This guide explains how to run the Remote Elevator Control System using Docker.

## 🐳 Quick Start

**Start all services:**
```bash
docker-compose up -d
```

**Access the application:**
- Frontend (Web App): http://localhost:8080
- Backend API: http://localhost:3000
- Database: localhost:5432

**Default credentials:**
- Admin email: `admin@remotecon.local`
- Admin password: `admin123`

## 📦 Services

The Docker Compose setup includes:

1. **PostgreSQL Database** (port 5432)
   - Persistent data storage
   - Automatic health checks

2. **Backend API** (port 3000)
   - NestJS application
   - Automatic database migrations
   - Auto-seeding on first run

3. **Frontend Web App** (port 8080)
   - Angular/Ionic app served by Nginx
   - Production-optimized build

## 🔧 Configuration

### Environment Variables

Edit `docker-compose.yml` to change:

**Database:**
```yaml
POSTGRES_USER: remotecon
POSTGRES_PASSWORD: remotecon_password_change_this  # ⚠️ CHANGE THIS
POSTGRES_DB: remotecon
```

**Backend:**
```yaml
JWT_ACCESS_SECRET: your-secret-key  # ⚠️ CHANGE THIS
JWT_REFRESH_SECRET: your-refresh-secret  # ⚠️ CHANGE THIS
CORS_ORIGIN: http://localhost,http://localhost:8080
```

### ESP32 Configuration

The ESP32 firmware is **not** containerized. Configure it to connect to your Docker backend:

Edit `esp32/src/config.h`:
```cpp
#define SERVER_URL "http://YOUR_HOST_IP:3000/api"
#define DEVICE_KEY "test-device-key-12345"
```

**Note**: Use your host machine's IP address (not `localhost`) so the ESP32 can reach the Docker container.

## 📋 Commands

**Start services:**
```bash
docker-compose up -d
```

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

**Stop services:**
```bash
docker-compose stop
```

**Stop and remove containers:**
```bash
docker-compose down
```

**Stop and remove containers + volumes (⚠️ deletes database):**
```bash
docker-compose down -v
```

**Rebuild after code changes:**
```bash
docker-compose up -d --build
```

**Access backend shell:**
```bash
docker exec -it remotecon-backend sh
```

**Access database:**
```bash
docker exec -it remotecon-db psql -U remotecon -d remotecon
```

## 🔄 Database Management

**Run migrations manually:**
```bash
docker exec remotecon-backend npx prisma migrate deploy
```

**Seed database:**
```bash
docker exec remotecon-backend npx prisma db seed
```

**Reset database (⚠️ deletes all data):**
```bash
docker-compose down -v
docker-compose up -d
```

## 🚀 Production Deployment

### Security Checklist

Before deploying to production:

- [ ] Change `POSTGRES_PASSWORD` in docker-compose.yml
- [ ] Change `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Update `CORS_ORIGIN` to your production domain
- [ ] Use environment file instead of hardcoded secrets
- [ ] Enable HTTPS (use reverse proxy like Traefik or Nginx)
- [ ] Set resource limits for containers
- [ ] Configure backup strategy for database volume
- [ ] Update ESP32 `SERVER_URL` to production domain

### Using Environment File

Create `.env` file in root directory:
```env
POSTGRES_PASSWORD=secure_password_here
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
CORS_ORIGIN=https://yourdomain.com
```

Update `docker-compose.yml` to use env file:
```yaml
services:
  backend:
    env_file:
      - .env
```

### HTTPS with Nginx Reverse Proxy

Add nginx reverse proxy service to docker-compose.yml:

```yaml
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
```

### Resource Limits

Add resource limits to services:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait for health check
# 2. Migration failed - check DATABASE_URL
# 3. Port conflict - change port in docker-compose.yml
```

### Frontend shows connection errors
```bash
# Check backend is running
docker-compose ps

# Verify API URL in frontend build
# Check CORS settings in backend
```

### Database connection refused
```bash
# Check postgres is running
docker-compose ps postgres

# Check health status
docker inspect remotecon-db | grep Health
```

### ESP32 can't connect
```bash
# Get host machine IP
# Windows: ipconfig
# Linux/Mac: ifconfig or ip addr

# Update ESP32 config.h with host IP:
# #define SERVER_URL "http://192.168.1.100:3000/api"
```

### Rebuild specific service
```bash
docker-compose up -d --build backend
```

## 📊 Monitoring

**View resource usage:**
```bash
docker stats
```

**Check service health:**
```bash
docker-compose ps
```

**Database size:**
```bash
docker exec remotecon-db psql -U remotecon -d remotecon -c "SELECT pg_size_pretty(pg_database_size('remotecon'));"
```

## 🔐 Backup & Restore

**Backup database:**
```bash
docker exec remotecon-db pg_dump -U remotecon remotecon > backup.sql
```

**Restore database:**
```bash
docker exec -i remotecon-db psql -U remotecon remotecon < backup.sql
```

**Backup volume:**
```bash
docker run --rm -v remotecon_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## 📱 Mobile App Deployment

The mobile apps (Android/iOS) are **not** containerized. They need to be built locally:

```bash
cd app
npm install
ionic build --prod

# Android
npx cap sync android
npx cap open android

# iOS
npx cap sync ios
npx cap open ios
```

Update `environment.prod.ts` with your production backend URL before building.

## 🎯 Next Steps

1. Start with Docker: `docker-compose up -d`
2. Access web app: http://localhost:8080
3. Login as admin: `admin@remotecon.local` / `admin123`
4. Configure ESP32 with your host IP
5. Flash ESP32 firmware
6. Test complete system

## 📄 License

MIT
