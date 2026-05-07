# SmartDTC Mobile App - Evaluation Q&A

## React Native (Expo) Driver & Passenger Apps

---

## Section 1: Architecture

### Q1: Why React Native + Expo for mobile? How does it work?

**Answer:**

**Tech Stack:**

```
Framework:      React Native (JavaScript for mobile)
Managed Build:  Expo (~52.0.46)
Navigation:     Expo Router (file-based, like Next.js)
State:          Zustand (lightweight)
HTTP Client:    Axios
Real-Time:      Socket.io-client
Storage:        Expo SecureStore (native) + AsyncStorage (fallback)
Maps:           react-native-maps (native)
Notifications:  Expo Notifications (FCM/APNs bridge)
Location:       Expo Location (GPS)
```

**Why React Native + Expo?**

| Aspect | Choice | Why |
|--------|--------|-----|
| **Single codebase** | React Native | ✓ Write once, run Android + iOS |
| **Build pipeline** | Expo | ✓ No need for Xcode/Android Studio ✓ OTA updates ✓ Cloud build |
| **Development** | Expo Go | ✓ Test on device instantly (no compiling) |
| **Production** | EAS Build | ✓ Cloud-based builds ✓ App Store/Play Store deployment |

**How It Works:**

```
React Native Code (JavaScript)
        │
        ├─ Compiles to → Android (Java/Kotlin bridge)
        └─ Compiles to → iOS (Objective-C bridge)
        
Expo handles:
  ✓ Build orchestration
  ✓ Native module management
  ✓ OTA updates (no app store re-submission)
  ✓ Push notifications (FCM + APNs)
```

**Alternative Considered:**

```
Option A: Native Swift + Kotlin
  Pros:  Best performance, full platform features
  Cons:  Separate codebases, 2x development time

Option B: Flutter
  Pros:  Single codebase, great performance
  Cons:  Less mature ecosystem, team unfamiliar

Option C: React Native (Bare)
  Pros:  More control, no Expo limitations
  Cons:  Complex setup, build issues, slow iteration

Decision: Expo = Best for MVP/demo. Easy to showcase, fast updates.
```

---

### Q2: Explain the app structure and navigation

**Answer:**

**File-Based Routing (Expo Router):**

```
app/
├── _layout.tsx                 ← Root layout, auth gate
├── (auth)/
│   ├── login.tsx              ← Email/password login
│   └── register.tsx           ← Passenger signup
├── (driver)/
│   ├── _layout.tsx            ← Tab navigator (5 tabs)
│   │                          ← Wraps all driver screens
│   ├── index.tsx              ← Dashboard
│   ├── schedule.tsx           ← Today's trips
│   ├── active-trip.tsx        ← Live GPS tracking
│   ├── sos.tsx                ← Emergency SOS
│   ├── alerts.tsx             ← Notifications
│   └── profile.tsx            ← Settings
└── (passenger)/
    ├── _layout.tsx            ← Tab navigator (4 tabs)
    ├── index.tsx              ← Home (nearby stops)
    ├── search.tsx             ← Route search
    ├── favourites.tsx         ← Saved routes
    ├── profile.tsx            ← Account
    ├── route/[id].tsx         ← Route detail (modal)
    └── track/[busId].tsx      ← Live bus tracker (modal)
```

**Navigation Flow:**

```
App Launch
    │
    ├─ Check token in storage
    │
    ├─ If invalid → (auth) stack
    │  ├─ LoginScreen
    │  └─ RegisterScreen
    │
    └─ If valid → Check role
       ├─ role: 'driver' → (driver) tabs
       │  ├─ [Dashboard]  (currently selected)
       │  ├─ Schedule
       │  ├─ SOS
       │  ├─ Alerts
       │  └─ Profile
       │
       └─ role: 'passenger' → (passenger) tabs
          ├─ [Home]  (currently selected)
          ├─ Search
          ├─ Favourites
          └─ Profile
```

**Tab Navigator (Driver):**

```
┌─────────────────────────────────────────────────────┐
│ Dashboard │ Schedule │ SOS │ Alerts │ Profile       │
└─────────────────────────────────────────────────────┘
     (Currently: Dashboard)
     
     [Content Area]
     
     Current trip info
     Quick actions
     Notifications
```

---

## Section 2: Driver App Features

### Q3: Walk through the driver app. What features are available?

**Answer:**

**Driver Dashboard Screen:**

```
┌─────────────────────────────────────────────────┐
│ SmartDTC Driver                    [Profile ⚙️]  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ HERO CARD                                       │
│ Good Morning, Raj! 👋                           │
│                                                 │
│ Today's Stats:                                  │
│ Trips: 5  │  Completed: 2  │  Rating: 4.8⭐   │
│                                                 │
│ Assigned Bus: DTC-045                           │
│ Status: ✓ Active  │  Capacity: 60 seats        │
│ Passengers: 32 booked                           │
│                                                 │
│ Current Schedule:                               │
│ Route: 5A (Connaught Place → Dwarka)            │
│ Departure: 08:45  │  Next Stop: India Gate     │
│ ETA Next: 3 minutes                             │
└─────────────────────────────────────────────────┘

┌─ QUICK ACTIONS ─────────────────────────────────┐
│ [Active Trip]  [Passengers]  [Schedule]        │
│   (navigate)                                   │
│ [SOS]         [Alerts]       [Profile]        │
└─────────────────────────────────────────────────┘

┌─ CURRENT TRIP CARD ─────────────────────────────┐
│ Route: 5A                                       │
│ Status: In Progress                             │
│ Distance: 18.3 km  │  Time: 42 min remaining  │
│ Current Speed: 28 km/h                          │
│ [View Map] [Mark Stop Arrived] [End Trip]      │
└─────────────────────────────────────────────────┘
```

**Driver Features by Screen:**

**1. Dashboard (Home)**
- Today's trip summary
- Assigned bus status
- Quick action buttons
- Current trip info (if active)
- Passenger count
- Rating (last 30 days)

**2. Schedule Tab**
- List of assigned trips
- Status badges (scheduled, in-progress, completed)
- Route name, timing, passenger count
- Tap to see route details

**3. Active Trip (Detailed)**
```
Map View:
  ├─ Route polyline
  ├─ Current bus position (blue dot)
  ├─ All stops (numbered markers)
  ├─ Highlighted: next stop
  └─ [Zoom in/out] [Center on bus]

Stop Progress:
  ├─ ✓ Connaught Place (completed 08:47)
  ├─ ⏳ India Gate (current, ETA 08:53)
  ├─ ⭕ Rajpath (upcoming, ETA 09:10)
  └─ ⭕ Parliament (upcoming, ETA 09:25)

Actions:
  ├─ [Mark Stop Arrived] → Increment progress
  ├─ [Take Alternate Route] → Suggest detour
  └─ [End Trip] → Complete trip (with details)
```

**4. SOS Tab (Emergency)**

```
┌─────────────────────────────────────────────────┐
│ SOS - Emergency Alert                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Select Emergency Type:                          │
│                                                 │
│ 🔧 Bus Breakdown                               │
│    Engine failure, tire puncture, etc.         │
│                                                 │
│ 🚗 Accident                                     │
│    Collision with vehicle                      │
│                                                 │
│ 🏥 Medical Emergency                            │
│    Driver or passenger health issue            │
│                                                 │
│ ⚠️  Other Emergency                             │
│    Describe below                               │
│                                                 │
│ [Or enter custom message]                       │
│ ┌─────────────────────────────────┐            │
│ │ Explain the situation...         │            │
│ └─────────────────────────────────┘            │
│                                                 │
│ [Cancel] [🚨 Send SOS]                          │
│          (animated pulse)                       │
└─────────────────────────────────────────────────┘
```

**5. Alerts Tab**
- Real-time alerts from admin
- Route changes
- Traffic updates
- Schedule modifications
- Alert history

**6. Profile Tab**
- Driver info (name, license, experience)
- Rating breakdown (communication, driving, cleanliness)
- Total trips completed
- Monthly stats
- Logout button

---

### Q4: How does GPS tracking work for drivers?

**Answer:**

**GPS Tracking Flow:**

```
Driver Starts Active Trip
        │
        ├─ Request location permission
        │  (first time)
        │
        ├─ Start watching GPS
        │  expo-location.watchPositionAsync()
        │  Updates every 5-10 meters OR 5 seconds
        │
        ├─ Emit via Socket.io
        │  socket.emit('driver:gps_update', {
        │      busId, routeId,
        │      latitude, longitude,
        │      speed, heading,
        │      timestamp
        │  })
        │
        ├─ Store in MongoDB
        │  BusPosition collection
        │
        ├─ Broadcast to clients
        │  Admin sees map update
        │  Passengers see bus approaching
        │
        └─ Driver Completes Trip
           └─ Stop watching GPS
```

**Implementation:**

```typescript
// File: app/(driver)/active-trip.tsx

import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

export default function ActiveTripScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [tracking, setTracking] = useState(false);

  const startGPSTracking = async () => {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied');
        return;
      }

      const socket = getSocket();
      setTracking(true);

      // Watch position (updates automatically)
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,  // Update every 5 seconds
          distanceInterval: 10,  // OR every 10 meters
        },
        async (location) => {
          const { latitude, longitude, speed, heading } = location.coords;

          setLocation(location);

          // Emit to server
          socket.emit('driver:gps_update', {
            busId: currentBus._id,
            routeId: currentTrip.route._id,
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0,
            timestamp: new Date(),
          });

          console.log(`📍 GPS: (${latitude}, ${longitude}) @ ${speed} km/h`);
        }
      );

      // Store subscription to clean up later
      setTrackingSubscription(subscription);

    } catch (error) {
      console.error('GPS error:', error);
      Alert.alert('GPS error', error.message);
    }
  };

  const stopGPSTracking = () => {
    trackingSubscription?.remove();
    setTracking(false);
    console.log('⏹️  GPS tracking stopped');
  };

  // Start when trip begins
  useEffect(() => {
    if (tripActive) {
      startGPSTracking();
    }
    return () => stopGPSTracking();
  }, [tripActive]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location?.coords.latitude || 28.6139,
          longitude: location?.coords.longitude || 77.2090,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Bus marker (current position) */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="You are here"
          />
        )}

        {/* Route stops */}
        {stops.map((stop, idx) => (
          <Marker
            key={stop._id}
            coordinate={{ latitude: stop.lat, longitude: stop.lng }}
            pinColor={idx === currentStopIdx ? 'blue' : 'gray'}
            title={stop.stage_name}
          />
        ))}

        {/* Route polyline */}
        <Polyline
          coordinates={stops.map(s => ({
            latitude: s.lat,
            longitude: s.lng,
          }))}
          strokeColor="#4f46e5"
          strokeWidth={3}
        />
      </MapView>

      {/* Stop progress */}
      <View style={styles.progress}>
        {stops.map((stop, idx) => (
          <View key={stop._id} style={styles.stopItem}>
            <Text style={[
              styles.stopName,
              idx < currentStopIdx && styles.completed,
              idx === currentStopIdx && styles.current,
            ]}>
              {idx < currentStopIdx ? '✓' : idx === currentStopIdx ? '⏳' : '⭕'} {stop.stage_name}
            </Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => markStopArrived(currentStopIdx)}
        >
          <Text style={styles.buttonText}>Mark Stop Arrived</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.endButton]}
          onPress={() => endTrip()}
        >
          <Text style={styles.buttonText}>End Trip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

**Background GPS (Advanced):**

For true background tracking (when app is minimized):

```typescript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const LOCATION_TASK_NAME = 'background-location-task';

// Define background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    // Emit to server even in background
    const socket = getSocket();
    socket.emit('driver:gps_update', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      speed: location.coords.speed,
    });
  }
});

// Start background task
async function startBackgroundLocationTracking() {
  try {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
    });
  } catch (error) {
    console.error('Background tracking error:', error);
  }
}
```

---

## Section 3: Passenger App Features

### Q5: Walk through passenger app. What can passengers do?

**Answer:**

**Passenger Screens:**

**1. Home Tab (Nearby Stops)**

```
┌─────────────────────────────────────────────────┐
│ SmartDTC Passenger                 [Profile ⚙️] │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📍 Nearby Stops                                 │
│ (within 1 km)                                   │
│                                                 │
│ • Rajendra Place (320 m away)                   │
│   Routes: 5A, 12, 19                            │
│   Next bus: Route 5A in 4 min                   │
│                                                 │
│ • Connaught Place (520 m away)                  │
│   Routes: 3, 7, 15A                             │
│   Next bus: Route 3 in 8 min                    │
│                                                 │
│ • India Gate (680 m away)                       │
│   Routes: 5A, 22, 31                            │
│   Next bus: Route 22 in 12 min                  │
│                                                 │
├─────────────────────────────────────────────────┤
│ 🔥 Popular Routes                               │
│                                                 │
│ • Route 5A: Connaught Place → Dwarka            │
│   Passengers: 42 online  [Track →]              │
│                                                 │
│ • Route 12: Rajendra Place → Noida              │
│   Passengers: 38 online  [Track →]              │
│                                                 │
│ • Route 19: Kasturba Nagar → Daryaganj          │
│   Passengers: 25 online  [Track →]              │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ [🔍 Search] [📍 Live Map] [❤️  Favorites]       │
│                                                 │
└─────────────────────────────────────────────────┘
```

**2. Search Tab**

```
┌─────────────────────────────────────────────────┐
│ Search Routes                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ From: ┌─────────────────────────────────────┐  │
│       │ Rajendra Place                  [✕] │  │
│       └─────────────────────────────────────┘  │
│                                                 │
│ To:   ┌─────────────────────────────────────┐  │
│       │ Dwarka Sector 5                 [✕] │  │
│       └─────────────────────────────────────┘  │
│                                                 │
│ [Search Routes]                                │
│                                                 │
├─────────────────────────────────────────────────┤
│ RESULTS                                        │
│                                                 │
│ ✓ Route 5A (Direct)                            │
│   Rajendra Place → Dwarka Sector 5              │
│   Distance: 18.3 km  │  Time: 45 min            │
│   Next buses: 08:30, 08:45, 09:00               │
│   [View Details] [Track Live Bus] [❤️ Save]     │
│                                                 │
│ ✓ Route 3 → Route 12 (Transfer)                │
│   Distance: 19.5 km  │  Time: 52 min (w/ wait) │
│   [View Details]                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**3. Route Detail Screen**

```
┌─────────────────────────────────────────────────┐
│ Route 5A: Connaught Place → Dwarka    [❤️ Save] │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📍 STOPS (13 total)                             │
│                                                 │
│ 1. Rajendra Place                               │
│ 2. ⏳ Connaught Place (bus arriving in 3 min)   │
│ 3. India Gate                                   │
│ 4. Rajpath                                      │
│ 5. Parliament                                   │
│ ... (showing currently operating bus)           │
│                                                 │
├─────────────────────────────────────────────────┤
│ 🚌 LIVE BUSES ON THIS ROUTE                     │
│                                                 │
│ Bus DTC-045                                     │
│ Current Stop: Connaught Place (stop 2)          │
│ Delay: On time ✓                                │
│ Passengers: 32/60 (53%)                         │
│ [Track This Bus →]                              │
│                                                 │
│ Bus DTC-102                                     │
│ Current Stop: Rajpath (stop 4)                  │
│ Delay: +2 min                                   │
│ Passengers: 58/65 (89%)                         │
│ [Track This Bus →]                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**4. Live Bus Tracker**

```
┌─────────────────────────────────────────────────┐
│ Live Tracking: Bus DTC-045            [✕ Close] │
├─────────────────────────────────────────────────┤
│                                                 │
│ [       LEAFLET MAP DISPLAY       ]             │
│ Route polyline (blue)                          │
│ Stops (numbered markers)                        │
│ Current bus (red dot)                          │
│                                                 │
├─────────────────────────────────────────────────┤
│ BUS INFO                                        │
│ Route: 5A                                       │
│ Next Stop: India Gate (3 min away)              │
│ Delay: ✓ On time                                │
│ Speed: 32 km/h                                  │
│ Passengers: 32/60 (53%)                         │
│ Last Updated: 12 seconds ago                    │
│                                                 │
│ Status: 🟢 Live                                 │
│ (Updates every 5-10 seconds)                    │
│                                                 │
│ [Set Alert: Notify when bus approaches stop]   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**5. Favorites Tab**

```
┌─────────────────────────────────────────────────┐
│ Saved Routes (4)                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ ❤️ Route 5A                                     │
│   Connaught Place → Dwarka                      │
│   Saved 3 weeks ago                             │
│   [View] [❌ Remove]                             │
│                                                 │
│ ❤️ Route 12                                     │
│   Rajendra Place → Noida                        │
│   [View] [❌ Remove]                             │
│                                                 │
│ ❤️ Route 19                                     │
│   Kasturba Nagar → Daryaganj                    │
│   [View] [❌ Remove]                             │
│                                                 │
│ ❤️ Route 31                                     │
│   Saket → Chandni Chowk                         │
│   [View] [❌ Remove]                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Passenger Features Summary:**

| Feature | Purpose |
|---------|---------|
| **Nearby Stops** | Discover buses within walking distance |
| **Route Search** | Find routes between any two stops |
| **Live Tracking** | See bus location + ETA in real-time |
| **Favorites** | Save frequently used routes |
| **Alerts** | Get notified when bus approaching |
| **Trip Rating** | Rate driver + bus after trip |

---

### Q6: How does real-time push notification work?

**Answer:**

**Push Notification Flow:**

```
1. App Startup
   ├─ Request notification permission
   ├─ Get Expo push token
   ├─ Register token with backend
   │  POST /mobile/push-token
   │  { token, platform: 'ios'|'android', user }

2. Backend Stores Token
   ├─ Save in PushToken collection
   ├─ Each device gets unique token
   ├─ Multiple devices per user supported

3. Event Occurs (Bus Approaching Stop)
   ├─ Passenger set alert: "Notify me 5 min before bus arrives"
   ├─ Bus arrives at stop 6 min away
   ├─ Backend triggers push

4. Send Push Notification
   ├─ Get passenger's push tokens
   ├─ Call Expo Push API
   │  POST https://exp.host/--/api/v2/push/send
   │  {
   │      to: 'ExponentPushToken[...]',
   │      title: '🚌 Bus Arriving Soon',
   │      body: 'Route 5A arriving at Connaught Place in 5 min',
   │      sound: 'default',
   │      data: { busId, stopId, action: 'open_tracker' }
   │  }

5. Device Receives Notification
   ├─ iOS: FCM → APNs → Notification Center
   ├─ Android: FCM → Notification Center

6. User Taps Notification
   ├─ App opens
   ├─ Navigate to bus tracker screen
   ├─ Data: { busId } → Open that bus's live tracker
```

**Backend Implementation:**

```javascript
// File: backend/src/services/pushNotification.service.js

const Expo = require('expo-server-sdk').default;
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

async function sendBusApproachingNotification(passengerId, busId, stopName, etaMinutes) {
    try {
        // Get all push tokens for this passenger
        const tokens = await PushToken.find({ user: passengerId, isActive: true });
        
        if (tokens.length === 0) {
            console.log('No active tokens for passenger');
            return;
        }

        const messages = tokens.map(t => ({
            to: t.token,
            sound: 'default',
            title: '🚌 Bus Arriving Soon',
            body: `Route arriving at ${stopName} in ${etaMinutes} min`,
            badge: 1,
            priority: 'high',
            data: {
                busId,
                stopId,
                action: 'open_tracker'  // Deep link
            },
        }));

        // Send batch
        const ticketChunk = await expo.sendPushNotificationsAsync(messages);
        console.log(`✓ Sent ${ticketChunk.length} notifications`);

        return ticketChunk;
        
    } catch (error) {
        console.error('Push notification error:', error);
    }
}

// Called when bus is 5 minutes from stop
async function checkBusApproachingStops() {
    try {
        const buses = await BusPosition.find({ status: 'in_transit' });
        
        for (const busPos of buses) {
            const route = await Route.findById(busPos.route);
            const nextStage = route.stages[busPos.nextStageIndex];
            
            // Calculate distance to next stop
            const distanceToNext = calculateDistance(busPos.location, nextStage.location);
            const etaSeconds = (distanceToNext / busPos.speed) * 3600;
            const etaMinutes = Math.round(etaSeconds / 60);
            
            if (etaMinutes === 5) {  // Send when 5 min away
                // Get passengers watching this stop
                const watchers = await StopWatcher.find({
                    stop: nextStage._id,
                    alertThreshold: { $lte: 5 }
                });
                
                for (const watcher of watchers) {
                    await sendBusApproachingNotification(
                        watcher.user,
                        busPos.bus,
                        nextStage.stage_name,
                        etaMinutes
                    );
                }
            }
        }
    } catch (error) {
        console.error('Check approaching error:', error);
    }
}
```

**Mobile App Side:**

```typescript
// File: mobile-app/src/lib/notifications.ts

import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

// Request permission
export async function registerForPushNotifications() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('Push notification permission denied');
      return null;
    }

    // Get device token
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('Push token:', token.data);
    
    // Register with backend
    await api.post('/mobile/push-token', {
      token: token.data,
      platform: Platform.OS,
    });

    return token.data;
    
  } catch (error) {
    console.error('Push registration error:', error);
  }
}

// Handle notification in foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Show banner even when app is open
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

// Handle notification tap
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const { data } = response.notification.request.content;
      const { busId, action } = data;

      if (action === 'open_tracker') {
        // Deep link to bus tracker
        router.push(`/(passenger)/track/${busId}`);
      }
    }
  );

  return () => subscription.remove();
}, []);
```

---

## Key Takeaways for Evaluators

✅ **Cross-Platform:** Single React Native codebase for iOS + Android  
✅ **Real-Time:** Socket.io + Expo notifications  
✅ **Offline-Aware:** Graceful handling of network issues  
✅ **GPS Tracking:** Accurate location updates for drivers  
✅ **Push Notifications:** Deep linking to relevant screens  
✅ **Secure Storage:** Platform-specific token management  

---

**Document Version:** 1.0  
**Last Updated:** 2 days before evaluation
