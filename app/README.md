# Remote Elevator Control - Mobile & Web App

Cross-platform mobile and web application built with Angular, Ionic, and Capacitor.

## Features

- 📱 Single codebase for Web, Android, and iOS
- 🔐 JWT authentication with auto-refresh
- 🎛️ Manual switch control
- 📍 GPS-based auto-unlock (mobile only)
- 📡 WiFi-based auto-unlock (mobile only)
- 🔔 Persistent notifications when switch is active
- 👥 Admin dashboard for user approval
- 🔧 Device management and monitoring

## Prerequisites

- Node.js 18+ and npm
- For Android: Android Studio and Android SDK
- For iOS: macOS with Xcode

## Installation

1. **Navigate to app directory**
   ```bash
   cd app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Edit `src/environments/environment.ts` and set your API URL:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000/api', // Your backend URL
   };
   ```

## Running the App

### Web/Browser (Development)

```bash
npm start
# or
ionic serve
```

App will be available at `http://localhost:8100`

**Note**: GPS and WiFi auto-unlock features are not available in browser mode. Only manual switch control and admin functions will work.

### Android

1. **Build the web app**
   ```bash
   ionic build
   ```

2. **Sync with Capacitor**
   ```bash
   npx cap sync android
   ```

3. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

4. **Run on device/emulator**
   - Click "Run" in Android Studio
   - Or use: `npx cap run android`

### iOS

1. **Build the web app**
   ```bash
   ionic build
   ```

2. **Sync with Capacitor**
   ```bash
   npx cap sync ios
   ```

3. **Open in Xcode**
   ```bash
   npx cap open ios
   ```

4. **Configure signing**
   - Select your development team in Xcode
   - Configure bundle identifier

5. **Run on device/simulator**
   - Click "Run" in Xcode

## Building for Production

### Web

```bash
npm run build
```

Output will be in `www/` directory. Deploy to any static hosting service.

### Android APK

1. **Build web app**
   ```bash
   ionic build --prod
   npx cap sync android
   ```

2. **Open Android Studio**
   ```bash
   npx cap open android
   ```

3. **Build APK/AAB**
   - Build → Build Bundle(s) / APK(s) → Build APK
   - Or for Play Store: Build → Build Bundle(s) / APK(s) → Build Bundle

### iOS App Store

1. **Build web app**
   ```bash
   ionic build --prod
   npx cap sync ios
   ```

2. **Open Xcode**
   ```bash
   npx cap open ios
   ```

3. **Archive and upload**
   - Product → Archive
   - Follow Xcode distribution wizard

## Platform-Specific Notes

### Android

**Permissions required** (already configured in `AndroidManifest.xml`):
- `ACCESS_FINE_LOCATION` - For geofencing
- `ACCESS_COARSE_LOCATION` - For WiFi SSID detection
- `ACCESS_NETWORK_STATE` - For network monitoring
- `POST_NOTIFICATIONS` - For persistent notifications (Android 13+)

**Background location**:
- Android 10+ restricts background location access
- App should be in foreground when geofencing triggers

### iOS

**Permissions required** (already configured in `Info.plist`):
- `NSLocationWhenInUseUsageDescription` - For geofencing
- `NSLocationAlwaysUsageDescription` - For background geofencing
- `NSLocationAlwaysAndWhenInUseUsageDescription` - For both

**WiFi SSID Detection**:
- Requires location permission on iOS 13+
- Only works when actively using location services

### Web/Browser

- **Limited functionality**: GPS and WiFi auto-unlock NOT available
- Manual controls and admin functions work normally
- Use for testing or as admin dashboard

## Environment Configuration

### Development
- Edit `src/environments/environment.ts`
- Set `apiUrl` to your local backend (e.g., `http://localhost:3000/api`)

### Production
- Edit `src/environments/environment.prod.ts`
- Set `apiUrl` to your production API URL
- Enable HTTPS

## Project Structure

```
app/
├── src/
│   ├── app/
│   │   ├── guards/          # Auth and admin route guards
│   │   ├── services/        # Services (auth, API, switch, etc.)
│   │   ├── pages/           # Page components
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── home/        # Main switch control
│   │   │   ├── settings/
│   │   │   └── admin/       # Admin pages
│   │   ├── app-routing.module.ts
│   │   └── app.module.ts
│   ├── environments/        # Environment configs
│   └── theme/               # Ionic theming
├── android/                 # Android platform
├── ios/                     # iOS platform
├── capacitor.config.ts      # Capacitor configuration
└── package.json
```

## Features by Platform

| Feature | Web | Android | iOS |
|---------|-----|---------|-----|
| Login/Register | ✅ | ✅ | ✅ |
| Manual Switch Control | ✅ | ✅ | ✅ |
| GPS Auto-Unlock | ❌ | ✅ | ✅ |
| WiFi Auto-Unlock | ❌ | ✅ | ⚠️ Limited |
| Notifications | ❌ | ✅ | ✅ |
| Admin Dashboard | ✅ | ✅ | ✅ |

## Troubleshooting

### Network errors
- Verify backend is running and accessible
- Check `apiUrl` in environment files
- For mobile: Ensure device can reach backend IP:port

### Capacitor sync fails
```bash
npm install
npx cap sync
```

### Android build errors
- Update Android Studio and SDK tools
- Clean project: Build → Clean Project
- Invalidate caches: File → Invalidate Caches / Restart

### iOS build errors
- Update Xcode to latest version
- Clean build folder: Product → Clean Build Folder
- Update CocoaPods: `cd ios/App && pod install`

### Geolocation not working
- Check platform permissions are granted
- Verify GPS is enabled on device
- For iOS: Check Info.plist has location usage descriptions

## License

MIT
