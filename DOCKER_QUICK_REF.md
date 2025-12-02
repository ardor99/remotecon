# 🐳 Docker Quick Reference

## Start Everything
```bash
docker-compose up -d
```

## Access Points
- **Web App**: http://localhost:8080
- **Backend API**: http://localhost:3000/api
- **Database**: localhost:5432
- **Login**: admin@remotecon.local / admin123

## Common Commands

### View Logs
```bash
docker-compose logs -f              # All services
docker-compose logs -f backend      # Backend only
docker-compose logs -f frontend     # Frontend only
```

### Stop/Start
```bash
docker-compose stop                 # Stop all
docker-compose start                # Start all
docker-compose restart backend      # Restart backend
```

### Rebuild After Changes
```bash
docker-compose up -d --build        # Rebuild all
docker-compose up -d --build backend  # Rebuild backend only
```

### Database
```bash
# Access database shell
docker exec -it remotecon-db psql -U remotecon -d remotecon

# Run migrations
docker exec remotecon-backend npx prisma migrate deploy

# Backup database
docker exec remotecon-db pg_dump -U remotecon remotecon > backup.sql
```

### Clean Up
```bash
docker-compose down                 # Stop and remove containers
docker-compose down -v              # Also remove volumes (⚠️ deletes DB)
```

## ESP32 Configuration

ESP32 needs your **host machine IP** (not localhost):

```cpp
// esp32/src/config.h
#define SERVER_URL "http://192.168.1.100:3000/api"  // Your IP here
```

Find your IP:
- **Windows**: `ipconfig`
- **Linux/Mac**: `ip addr` or `ifconfig`

## Troubleshooting

**Backend won't start:**
```bash
docker-compose logs backend
```

**Frontend shows errors:**
- Check backend is running: `docker-compose ps`
- Check CORS settings in docker-compose.yml

**Database issues:**
```bash
docker-compose down -v  # Reset database
docker-compose up -d    # Start fresh
```

## Production Updates

Edit `docker-compose.yml`:
- Change `POSTGRES_PASSWORD`
- Change `JWT_ACCESS_SECRET`
- Change `JWT_REFRESH_SECRET`
- Update `CORS_ORIGIN` to your domain

See `DOCKER.md` for complete documentation.
