# Remote Elevator Control - Backend API

Production-ready NestJS backend for the Remote Elevator Control System.

## Features

- 🔐 JWT authentication with access + refresh tokens
- 👥 Role-based authorization (USER, ADMIN)
- 🔒 Bcrypt password hashing
- 🚦 Rate limiting on sensitive endpoints
- 📊 PostgreSQL database with Prisma ORM
- 🔌 ESP32 device authentication
- ⏱️ Switch state management with expiration
- 📝 Input validation with class-validator

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_ACCESS_SECRET` - Secret for access tokens (use strong random string)
   - `JWT_REFRESH_SECRET` - Secret for refresh tokens (use different random string)
   - `PORT` - Server port (default: 3000)
   - `CORS_ORIGIN` - Allowed origins for CORS

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run migrations
   npm run migrate

   # Seed database with admin user and test device
   npm run seed
   ```

   **Default credentials after seeding:**
   - Admin email: `admin@remotecon.local`
   - Admin password: `admin123`
   - Test device key: `test-device-key-12345`

## Running the Server

### Development
```bash
npm run start:dev
```

Server will start on `http://localhost:3000` with API at `http://localhost:3000/api`

### Production
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (unapproved by default)
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users/me` - Get current user profile (AUTH)
- `PATCH /api/users/me/settings` - Update user settings (AUTH)

### Admin - Users
- `GET /api/admin/users` - List all users (ADMIN)
- `PATCH /api/admin/users/:id/approve` - Approve user (ADMIN)
- `PATCH /api/admin/users/:id/reject` - Reject/deactivate user (ADMIN)

### Devices
- `GET /api/devices` - List all devices (AUTH)
- `GET /api/devices/:id/state` - Get current switch state (AUTH)
- `POST /api/devices/:id/state/manual` - Set manual switch control (AUTH)
- `POST /api/devices/:id/state/auto` - Set auto switch with duration (AUTH)
- `POST /api/devices/:id/poll` - ESP32 polling endpoint (requires deviceKey)

### Admin - Devices
- `GET /api/admin/devices` - List devices with state details (ADMIN)

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## Database Management

```bash
# Open Prisma Studio (database GUI)
npm run prisma:studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (DANGER: deletes all data)
npx prisma migrate reset
```

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding
├── src/
│   ├── auth/               # Authentication module
│   │   ├── dto/            # Data transfer objects
│   │   ├── guards/         # Auth & role guards
│   │   ├── strategies/     # Passport strategies
│   │   └── decorators/     # Custom decorators
│   ├── users/              # Users management
│   ├── devices/            # Devices & switch control
│   ├── prisma/             # Prisma service
│   ├── app.module.ts       # Root module
│   └── main.ts             # Entry point
├── test/                   # E2E tests
└── package.json
```

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**

1. Change all JWT secrets in `.env` to strong random strings
2. Use a secure PostgreSQL password
3. Enable HTTPS (use reverse proxy like Nginx)
4. Set `NODE_ENV=production`
5. Review and adjust rate limiting settings
6. Use environment-specific `.env` files
7. Never commit `.env` files to version control
8. Rotate device keys periodically

## Switch State Logic

### Modes
- `OFF` - Switch is off
- `PULSE` - Switch pulses at intervals (relay control)
- `CONTINUOUS` - Switch stays on (not used in current implementation)

### Expiration
- States can have a `validUntil` timestamp
- If `validUntil` is null, state never expires
- If current time > `validUntil`, state is treated as OFF
- ESP32 polls every second and receives current active state

### Auto-unlock
- **GPS trigger**: Sets PULSE mode for 20 minutes
- **WiFi trigger**: Sets PULSE mode for 10 minutes
- Manual control can set any duration or no expiration

## Troubleshooting

### Database connection issues
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure database exists: `createdb remotecon`

### JWT errors
- Verify JWT secrets are set in `.env`
- Check token expiration times

### Migration errors
```bash
# Reset and re-run migrations
npx prisma migrate reset
npm run migrate
npm run seed
```

## License

MIT
