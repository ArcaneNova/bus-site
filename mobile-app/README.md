# SmartDTC — Mobile App

React Native (Expo) mobile application for the SmartDTC AI-Powered Bus Scheduling & Tracking System.  
Serves two user types with separate tab navigators:

- **Passenger app** — Route search, live bus tracking, favourites, trip rating  
- **Driver app** — Dashboard, schedule, active trip with live GPS, SOS, alerts

---

## Tech Stack

| Category         | Library / Version                                     |
|------------------|-------------------------------------------------------|
| Framework        | Expo SDK 50 + React Native 0.73                       |
| Navigation       | Expo Router 3 (file-based, tab + stack)               |
| Language         | TypeScript 5                                          |
| HTTP Client      | Axios 1.6 (JWT interceptors + auto-refresh)           |
| Real-time        | Socket.io-client 4.7                                  |
| Maps             | react-native-maps 1.10                                |
| Secure Storage   | expo-secure-store (token persistence)                 |
| Location         | expo-location (foreground + background GPS)           |
| Offline Cache    | @react-native-async-storage/async-storage + netinfo   |
| Push Notifs      | expo-notifications                                    |
| State            | Zustand 4.5                                           |
| Icons            | @expo/vector-icons (Ionicons)                         |
| Date Utils       | date-fns 3                                            |
| Toasts           | react-native-toast-message                            |

---

## Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **Expo CLI** — `npm install -g expo-cli`
- **EAS CLI** (for building) — `npm install -g eas-cli`
- **Expo Go** app on your phone — [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
- A running **SmartDTC backend** (see `backend/README.md`)

---

## Local Development Setup

### 1. Install dependencies

```bash
cd mobile-app
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` — set your computer's local IP address (the phone and PC must be on the same Wi-Fi):

```dotenv
# Find your IP with 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.100:5000
```

> **Important:** Use your machine's LAN IP, **not** `localhost` — the phone cannot reach `localhost` on your PC.  
> `EXPO_PUBLIC_API_URL` must be the server root only (no `/api/v1` suffix — the API client adds it).

### 3. Start the development server

```bash
npm start          # or: npx expo start
```

Scan the QR code in the terminal with **Expo Go** on your phone.

### 4. Run on emulator / simulator

```bash
npm run android    # requires Android Studio + emulator
npm run ios        # requires Xcode + iOS Simulator (macOS only)
```

---

## Environment Variables Reference

| Variable                    | Required | Description                                       |
|-----------------------------|----------|---------------------------------------------------|
| `EXPO_PUBLIC_API_URL`       | ✅       | Backend server base URL (no `/api/v1` suffix)     |
| `EXPO_PUBLIC_SOCKET_URL`    | ✅       | Socket.io server URL (same as backend)            |

Variables prefixed with `EXPO_PUBLIC_` are inlined into the JS bundle at build time.

---

## Project Structure

```
mobile-app/
├── app/                            # Expo Router file-based pages
│   ├── _layout.tsx                 # Root layout: auth load, push notifications, splash
│   ├── index.tsx                   # Entry: redirects to login, driver, or passenger
│   ├── login.tsx                   # Login screen (both roles)
│   ├── register.tsx                # Passenger self-registration
│   │
│   ├── (passenger)/                # Passenger tab group
│   │   ├── _layout.tsx             # Tabs: Home, Search, Favourites, Profile
│   │   ├── index.tsx               # Home: nearby stops + popular routes
│   │   ├── search.tsx              # Route search
│   │   ├── favourites.tsx          # Saved routes & stops
│   │   ├── profile.tsx             # Account info + stats + logout
│   │   ├── route/[id].tsx          # Route detail: stops list + live buses + favourite toggle
│   │   ├── track/[busId].tsx       # Live bus map: real-time GPS via Socket.io
│   │   └── rate/[tripId].tsx       # Trip rating: stars + tags + comment
│   │
│   └── (driver)/                   # Driver tab group
│       ├── _layout.tsx             # Tabs: Dashboard, Schedule, Alerts, Active Trip, SOS, Profile
│       ├── index.tsx               # Dashboard: status toggle, today's trips, current schedule
│       ├── schedule.tsx            # Upcoming & past schedules
│       ├── alerts.tsx              # Live alerts via Socket.io
│       ├── active-trip.tsx         # GPS tracking: emit location, mark stops, complete trip
│       ├── sos.tsx                 # Emergency SOS: socket + REST alert
│       └── profile.tsx             # Driver profile: rating, trips, assigned bus
│
├── src/
│   ├── lib/
│   │   ├── api.ts                  # Axios instance: JWT attach + auto-refresh on 401
│   │   ├── socket.ts               # Socket.io singleton: lazy connect + token auth
│   │   ├── backgroundGps.ts        # expo-task-manager background GPS task for drivers
│   │   └── offlineCache.ts         # AsyncStorage offline cache with netinfo detection
│   ├── store/
│   │   └── authStore.ts            # Zustand auth: login/logout/fetchMe via SecureStore
│   └── types/
│       └── index.ts                # Shared TypeScript interfaces
│
├── .env                            # Local environment (gitignored)
├── .env.example                    # Template with placeholder IP
├── app.json                        # Expo config: permissions, plugins, bundle IDs
├── eas.json                        # EAS Build profiles (development, preview, production)
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## App Flow

```
App Launch
    │
    ▼
_layout.tsx  →  loadToken() from SecureStore
    │
    ├── No token → /login
    │
    └── Token found → fetchMe()
            ├── role = 'driver'    → /(driver)
            └── role = 'passenger' → /(passenger)
```

---

## Authentication

Tokens are stored in **expo-secure-store** (encrypted native keychain):

```typescript
// Login
await login(email, password);        // POST /auth/login → saves accessToken
// Auto-refresh
// api.ts interceptor catches 401, calls POST /auth/refresh-token automatically
// Logout
await logout();                      // POST /auth/logout → deletes SecureStore token
```

---

## Real-time (Socket.io)

```typescript
import { connectSocket, getSocket } from '@/lib/socket';

// Connect with auth token (driver active trip)
const socket = connectSocket(accessToken);

// Passenger — track a bus
socket.emit('passenger:track_bus', { busId });
socket.on('bus:position', (data) => { /* update map */ });

// Driver — emit GPS location
socket.emit('driver:gps_update', { busId, routeId, latitude, longitude, speed, heading });

// Driver — SOS
socket.emit('driver:sos', { type, message, latitude, longitude });

// Alerts (driver app)
socket.on('alert:new',           (alert) => { /* show toast */ });
socket.on('admin:alert_resolved', ({ alertId }) => { /* remove */ });
```

---

## Background GPS (Drivers)

When a driver starts a trip, background GPS continues even if the app is minimised:

```typescript
import { registerBackgroundGpsTask, startBackgroundGps, stopBackgroundGps } from '@/lib/backgroundGps';

// Called once at app root (already done in active-trip.tsx)
registerBackgroundGpsTask();

// Start when trip begins
await startBackgroundGps(busId, routeId);  // requests background location permission

// Stop when trip ends
await stopBackgroundGps();
```

The background task emits `driver:gps_update` via Socket.io every 15 seconds or every 30 metres.

---

## Offline Cache

Use `cachedGet` instead of `api.get` for data that should work offline:

```typescript
import { cachedGet } from '@/lib/offlineCache';

// Fetch routes — serve from cache if offline (TTL: 10 minutes)
const { data, fromCache } = await cachedGet('/routes?limit=20', 600);
```

---

## Building for Distribution

### Development build (APK for Android testing)

```bash
eas build --profile development --platform android
```

### Preview build (shareable APK without Play Store)

```bash
eas build --profile preview --platform android
```

### Production build

```bash
# Android (AAB for Play Store)
eas build --profile production --platform android

# iOS (IPA for App Store)
eas build --profile production --platform ios
```

> You need an [Expo account](https://expo.dev) and a configured `eas.json` (already set up).  
> For iOS, you also need an Apple Developer account ($99/year).

---

## Deployment — Expo Go (Development Only)

During development, passengers and drivers can test using **Expo Go**:

1. Run `npm start`
2. Share the QR code or the `exp://` URL
3. All testers must be on the same Wi-Fi as your dev machine

---

## Deployment — EAS Build + OTA Updates (Recommended)

For production, use **Expo Application Services (EAS)**:

### Step 1 — Set up EAS

```bash
eas login        # log in to your Expo account
eas build:configure
```

### Step 2 — Set production environment variables

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-backend.onrender.com
eas secret:create --scope project --name EXPO_PUBLIC_SOCKET_URL --value https://your-backend.onrender.com
```

### Step 3 — Build

```bash
eas build --profile production --platform android
```

### Step 4 — Publish OTA updates (no app store submission needed for JS-only changes)

```bash
eas update --branch production --message "Fix bus tracker"
```

---

## Permissions

| Permission                  | Used For                                      |
|-----------------------------|-----------------------------------------------|
| `ACCESS_FINE_LOCATION`      | Passenger nearby stops; driver GPS tracking   |
| `ACCESS_BACKGROUND_LOCATION`| Driver background GPS while app is minimised  |
| `CAMERA`                    | Profile photo upload                          |
| `RECEIVE_BOOT_COMPLETED`    | Re-register push notification channels        |
| `VIBRATE`                   | Alert vibration                               |

---

## Common Issues

### App cannot connect to backend
- Make sure your phone and dev machine are on the **same Wi-Fi network**
- Use your machine's **LAN IP** (e.g. `192.168.1.100`), not `localhost`
- Check that `EXPO_PUBLIC_API_URL` has **no trailing slash** and **no `/api/v1`**
- Run `ipconfig` (Windows) or `ifconfig` (Mac) to find your IP

### Map not showing (react-native-maps)
- Android: requires Google Maps API key. Add to `app.json`:
  ```json
  "android": { "config": { "googleMaps": { "apiKey": "YOUR_KEY" } } }
  ```
- iOS: uses Apple Maps by default (no key needed). Switch to Google Maps by passing `provider={PROVIDER_GOOGLE}` and adding the API key to `infoPlist`.

### Background GPS not working
- Ensure the user granted **"Allow Always"** location permission (not just "While Using")
- Android: disable battery optimisation for the app in device settings
- Background GPS requires a physical device — it does **not** work in simulators

### Push notifications not received
- Must be tested on a **physical device** (Expo Go on simulator doesn't support push)
- Ensure `expo-notifications` plugin is listed in `app.json` plugins (already configured)

### `expo-secure-store` crash on Android emulator
- SecureStore requires a device with a secure enclave. Use a physical device or enable biometric authentication in the emulator.

---

## Scripts

| Command         | Description                                      |
|-----------------|--------------------------------------------------|
| `npm start`     | Start Expo dev server (scan QR with Expo Go)     |
| `npm run android` | Open on Android emulator                       |
| `npm run ios`   | Open on iOS simulator (macOS only)               |
| `npm run web`   | Open in browser (limited functionality)          |

---

## Related Services

| Service      | README                   | Default Port |
|--------------|--------------------------|--------------|
| Backend API  | `backend/README.md`      | 5000         |
| AI Service   | `ai-service/README.md`   | 8000         |
| Frontend     | `frontend/README.md`     | 3000         |
