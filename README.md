# Remote Elevator Control System

Production-ready system for remotely controlling an elevator unlock relay through an ESP32 device. The system includes a backend API, cross-platform mobile/web applications, and ESP32 firmware.

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Mobile App    │◄───────►│   Backend API   │
│ (Android/iOS)   │  HTTPS  │    (NestJS)     │
└─────────────────┘         └────────┬────────┘
                                     │
┌─────────────────┐                  │
│    Web App      │◄─────────────────┤
│   (Browser)     │       HTTPS      │
└─────────────────┘                  │
                                     │ HTTPS
                            ┌────────▼────────┐
                            │   ESP32 Device  │
                            │   (Firmware)    │
                            └────────┬────────┘
                                     │
                              ┌──────▼──────┐
                              │ LED/Relay   │
                              │  (Control)  │
                              └─────────────┘
```

## 📦 Components

### Backend (`backend/`)
- **Tech**: NestJS + TypeScript + PostgreSQL + Prisma
- **Features**: JWT auth, role-based access, device management, switch control API
- **Port**: 3000 (default)

### Frontend (`app/`)
- **Tech**: Angular + Ionic +  Capacitor
- **Platforms**: Web, Android, iOS (single codebase)
- **Features**: Manual control, GPS/WiFi auto-unlock, admin dashboard

### ESP32 Firmware (`esp32/`)
- **Tech**: Arduino framework + PlatformIO
- **Features**: Server polling, PULSE mode,  LED/relay control

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run prisma:generate
npm run migrate
npm run seed
npm run start:dev
```

Default admin: `admin@remotecon.local` / `admin123`

### 2. Frontend Setup

**Web version:**
```bash
cd app
npm install
npm start
# Open http://localhost:8100
```

**Android/iOS:**
```bash
npm install
ionic build
npx cap sync android  # or ios
npx cap open android  # or ios
```

### 3. ESP32 Setup

```bash
cd esp32
# Edit src/config.h with WiFi and server details
pio run --target upload
pio device monitor
```

## ⚙️ Configuration

### Backend Environment Variables
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/remotecon"
JWT_ACCESS_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3000
```

### Frontend Environment
Edit `app/src/environments/environment.ts`:
```typescript
apiUrl: 'http://localhost:3000/api'  // Your backend URL
```

### ESP32 Configuration
Edit `esp32/src/config.h`:
```cpp
#define WIFI_SSID "YourWiFi"
#define WIFI_PASSWORD "password"
#define SERVER_URL "http://192.168.1.100:3000/api"
#define DEVICE_KEY "test-device-key-12345"
```

## 🔒 Security Features

- ✅ JWT access + refresh tokens (15min / 7day)
- ✅ Bcrypt password hashing
- ✅ Rate limiting on auth endpoints (5 req/min)
- ✅ Role-based authorization (USER, ADMIN)
- ✅ Device authentication via deviceKey
- ✅ User approval workflow (admin must approve new registrations)

## 📱 Features

### User Features
- Register and login (requires admin approval)
- Manual switch enable/disable
- GPS auto-unlock (20 min when arriving home)
- WiFi auto-unlock (10 min when connecting to home WiFi)
- Persistent notification with "Turn Off" button
- Configure home location and WiFi networks

### Admin Features
- Approve/reject user registrations
- View all devices and their status
- Monitor last ESP32 poll time
- View current switch state per device

### Switch Modes
- **OFF**: Switch/LED off
- **PULSE**: Toggle at intervals (e.g., 500ms ON every 10s)
- **CONTINUOUS**: Stay on (not currently used)

## 🧪 Testing

**Backend:**
```bash
cd backend
npm test
npm run test:cov
```

**Frontend:**
```bash
cd app
npm test
```

**Integration:**
1. Start backend
2. Start frontend (web or mobile)
3. Register user → Admin approves → Login
4. Enable switch → ESP32 LED lights up
5. Verify pulse timing matches settings

## 📁 Project Structure

```
remotecon/
├── backend/               # NestJS backend
│   ├── prisma/           # Database schema & migrations
│   ├── src/
│   │   ├── auth/         # Authentication module
│   │   ├── users/        # User management
│   │   ├── devices/      # Device & switch control
│   │   └── prisma/       # Prisma service
│   └── README.md
├── app/                   # Angular + Ionic frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/ # API, auth, switch services
│   │   │   ├── guards/   # Route guards
│   │   │   └── pages/    # UI pages/components
│   │   └── environments/
│   ├── android/          # Android platform
│   ├── ios/              # iOS platform
│   └── README.md
├── esp32/                 # ESP32 firmware
│   ├── src/
│   │   ├── main.cpp      # Main firmware code
│   │   └── config.h      # Configuration
│   ├── platformio.ini    # PlatformIO config
│   └── README.md
└── README.md              # This file
```

## 🔧 Development Workflow

1. **Backend first**: Set up database, run migrations, seed data
2. **Test API**: Use Postman/curl to test endpoints
3. **Frontend**: Connect to backend, test auth flow
4. **ESP32**: Configure device credentials, test polling
5. **Integration**: Complete end-to-end flow

## 📋 Platform Support

| Feature | Web | Android | iOS |
|---------|-----|---------|-----|
| Auth & Manual Control | ✅ | ✅ | ✅ |
| GPS Auto-Unlock | ❌ | ✅ | ✅ |
| WiFi Auto-Unlock | ❌ | ✅ | ⚠️ Limited |
| Notifications | ❌ | ✅ | ✅ |
| Admin Dashboard | ✅ | ✅ | ✅ |

## 🐛 Troubleshooting

**Backend won't start:**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run migrations: `npm run migrate`

**Frontend can't connect:**
- Check apiUrl in environment files
- Ensure backend is running
- Verify CORS settings in backend

**ESP32 not polling:**
- Check WiFi credentials
- Verify SERVER_URL is reachable from ESP32 network
- Check device_key matches database
- View serial monitor for errors

**GPS/WiFi not working:**
- Mobile only feature (won't work on web)
- Check platform permissions granted
- iOS requires special entitlements for WiFi SSID

## 🚢 Production Deployment

### Backend
- Deploy to cloud (Heroku, AWS, DigitalOcean)
- Use managed PostgreSQL
- Enable HTTPS
- Set strong JWT secrets
- Configure CORS for frontend URL

### Frontend
- **Web**: Build and deploy to static hosting (Netlify, Vercel)
- **Android**: Build APK/AAB, upload to Play Store
- **iOS**: Archive in Xcode, upload to App Store

### ESP32
- Use production server URL (HTTPS recommended)
- Store device credentials securely
- Add watchdog timer
- Use reliable power supply
- Replace LED with actual relay for elevator control

## 📄 License

MIT

## 🤝 Support

For issues or questions:
1. Check component-specific READMEs (backend/, app/, esp32/)
2. Review troubleshooting sections
3. Check serial monitor output (ESP32)
4. Verify network connectivity between components
