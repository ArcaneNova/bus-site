# SmartDTC Frontend - Evaluation Q&A

## React.js Next.js Web Application

---

## Section 1: Frontend Architecture

### Q1: What tech stack did you choose for the frontend? Why React + Next.js?

**Answer:**

**Frontend Stack:**

```
Framework:     Next.js 14 (React framework)
Language:      TypeScript + JavaScript
Styling:       Tailwind CSS
Components:    Shadcn/ui + Custom
State:         Zustand (lightweight)
API:           Axios + TanStack React Query
Real-Time:     Socket.io-client
Maps:          Leaflet + React-Leaflet
Charts:        Recharts
Forms:         React Hook Form + Zod validation
Auth:          JWT (manual implementation)
Deployment:    Vercel (optimized for Next.js)
```

**Why React?**
- ✓ Industry standard for admin dashboards
- ✓ Excellent component-based architecture
- ✓ Large ecosystem (libraries, tools)
- ✓ Familiar to most teams
- ✓ Strong TypeScript support

**Why Next.js?**
- ✓ File-based routing (automatic route structure)
- ✓ Server-side rendering (SSR) for performance
- ✓ API routes for backend proxy
- ✓ Image optimization (next/image)
- ✓ Deployment to Vercel (5-minute setup)
- ✓ Built-in development experience (hot reload)

**Why Tailwind CSS?**
- ✓ Utility-first (faster development)
- ✓ Small bundle size (purges unused styles)
- ✓ Responsive design out of the box
- ✓ Dark mode support
- ✓ Consistent design system

**Why Not?**
```
Angular:       Too heavy, overkill for this project
Vue.js:        Good but smaller ecosystem
Svelte:        Excellent but less common in industry
Flutter Web:   Mobile-first, not ideal for web admin
```

---

### Q2: Describe the page structure and navigation flow

**Answer:**

**URL Routes:**

```
/ (Landing)
  ├─ /login → Authentication
  ├─ /register → Passenger signup
  ├─ /passenger → Passenger portal
  │  ├─ /search → Route search
  │  ├─ /routes/:id → Route detail
  │  ├─ /track/:busId → Live bus tracker
  │  └─ /favorites → Saved routes
  ├─ /driver → Driver portal
  │  ├─ /dashboard → Today's trips
  │  └─ /route/:id → Route detail
  ├─ /track → Public live bus map
  └─ /admin → Admin dashboard (protected)
     ├─ /routes → Route management
     ├─ /buses → Fleet management
     ├─ /drivers → Driver management
     ├─ /schedule → Schedule creation
     ├─ /tracking → Live tracking map
     ├─ /demand → Demand predictions
     ├─ /alerts → Alert management
     ├─ /reports → Analytics reports
     ├─ /bookings → Passenger bookings
     ├─ /users → User management
     └─ /settings → Configuration
```

**Navigation Components:**

```
┌─ Public Header ──────────────────────────────────────┐
│ Logo | Home | Features | Live Map | [Login | Register]│
└──────────────────────────────────────────────────────┘

┌─ After Login ─────────────────────────────────────────┐
│ Logo | Profile dropdown | Logout                     │
└──────────────────────────────────────────────────────┘

┌─ Admin Sidebar (Left) ────────────────────────────────┐
│ • Dashboard (KPIs)                                   │
│ • Routes (management)                                │
│ • Buses (fleet)                                      │
│ • Drivers (personnel)                                │
│ • Schedule (planning)                                │
│ • Tracking (live map)                                │
│ • Demand (ML predictions)                            │
│ • Alerts (incidents)                                 │
│ • Reports (analytics)                                │
│ • Users (admin users)                                │
│ • Settings (config)                                  │
│ • Theme toggle (light/dark)                          │
│ • Logout                                             │
└──────────────────────────────────────────────────────┘
```

---

## Section 2: Key Pages & Features

### Q3: Walk through the Admin Dashboard. What KPIs are displayed?

**Answer:**

**Dashboard Structure:**

```
┌─ Header ──────────────────────────────────────────────────┐
│ "DTC Control Centre" | Last refresh: XX:XX:XX | [Refresh]│
└───────────────────────────────────────────────────────────┘

┌─ Quick Navigation Grid ───────────────────────────────────┐
│ [Routes] [Buses] [Drivers] [Schedule] [Demand] [Alerts]  │
│ [Reports] [Tracking] [Bookings] [Broadcast] [Settings]   │
└───────────────────────────────────────────────────────────┘

┌─ KPI Cards (Row 1) ───────────────────────────────────────┐
│
│  Total Buses    │  Active Buses    │  Total Drivers  │ Today's Trips
│  ────────────   │  ──────────────  │  ─────────────  │ ───────────
│      247        │        42        │       89        │     312
│   ↑ +2 today   │   ↑ +1 from 06:00│ Active this mo │ ↑ +42 vs yesterday
│
└───────────────────────────────────────────────────────────┘

┌─ System Health ───────────────────────────────────────────┐
│ Status: ✓ OK          Uptime: 45 days 3 hours 12 min   │
│ DB: Connected ✓  |  AI Service: Connected ✓  |  Cache: N/A
│ Routes: 569  |  Buses: 247  |  Drivers: 89  |  Users: 1,245
└───────────────────────────────────────────────────────────┘

┌─ Charts & Analytics ──────────────────────────────────────┐
│
│ [BarChart] Scheduled vs Completed Trips (Today)
│   Hour:  00 01 02 03 04 05 06 07 08 09 10 11 12 ...
│   Sched: [  ] [ ] [  ] [  ] [  ] [  ] [  ] [##] [###] ...
│   Comp:  [  ] [ ] [  ] [  ] [  ] [  ] [  ] [##] [##] ...
│
│ [Fleet Utilization] 42/247 (17%)
│   ════════════════════════════════════════
│
│ [OnTimePerf] 87.3% on-time (target: 90%)
│
└───────────────────────────────────────────────────────────┘

┌─ Real-Time Alerts ────────────────────────────────────────┐
│ Title: "Real-Time Alerts (5 open)"
│
│  🚨 SOS from Bus DTC-045 at Connaught Place  [2 min ago]
│  ⚠️  Delay > 15min: Route 15A, 5 buses affected  [5 min ago]
│  ℹ️  Schedule generated for tomorrow  [10 min ago]
│
│ [View All →]
└───────────────────────────────────────────────────────────┘

┌─ Driver Leaderboard ──────────────────────────────────────┐
│ (Last 30 days)
│ 🥇 Raj Kumar    │ 142 trips  │ 4.8 ⭐ │ 94% on-time
│ 🥈 Priya Singh  │ 138 trips  │ 4.7 ⭐ │ 92% on-time
│ 🥉 Arjun Patel  │ 135 trips  │ 4.6 ⭐ │ 91% on-time
│
│ [View All Drivers →]
└───────────────────────────────────────────────────────────┘

┌─ Live Buses (Table) ──────────────────────────────────────┐
│ Bus # │ Route    │ Status   │ Delay  │ Passengers
│────────────────────────────────────────────────────────
│ 045   │ Route 5A │ ✓ On-time│ 0 min  │ 32/60 (53%)
│ 102   │ Route 12 │ ⚠ Late  │ +3 min │ 58/65 (89%)
│ 203   │ Route 7  │ ✓ On-time│ 0 min  │ 18/50 (36%)
│ ... [+16 more]
│
│ [Open Map →]
└───────────────────────────────────────────────────────────┘

┌─ Mobile App Analytics ────────────────────────────────────┐
│ Title: "Mobile App — Booking Analytics"
│
│ Today's Bookings: 432  |  Cancelled: 8  |  Completed: 398
│ Most Booked: Route 5A (87), Route 12 (65), Route 19 (54)
│
│ [Manage All →]
└───────────────────────────────────────────────────────────┘
```

**KPIs Tracked:**

| KPI | How It's Calculated | Business Value |
|-----|---------------------|---|
| **Active Buses** | COUNT(BusPosition in last 5 min) | Fleet utilization |
| **On-Time %** | (On-time trips) / (Total trips) | Service quality |
| **Avg Delay** | AVG(delay_minutes) | Performance metric |
| **Passengers Today** | SUM(passengers) | Revenue indicator |
| **Alerts Open** | COUNT(Alert where status='open') | Operational issues |
| **Driver Rating Avg** | AVG(driver.rating) | Service quality |

**Real-Time Updates:**
```javascript
// Auto-refresh every 30 seconds
useEffect(() => {
    const interval = setInterval(() => {
        fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
}, []);

// Also connect Socket.io for live bus updates
useEffect(() => {
    const socket = connectSocket();
    
    socket.emit('admin:subscribe_all');
    socket.on('bus:position', (data) => {
        setLiveBuses(prev => [
            ...prev.filter(b => b._id !== data._id),
            data  // Updated position
        ]);
    });
    
    return () => socket.disconnect();
}, []);
```

---

### Q4: How do you implement real-time map tracking?

**Answer:**

**Live Tracking Map Stack:**

```
Frontend:
  - React-Leaflet (Leaflet wrapper)
  - OpenStreetMap tiles (free, no API key)
  - Socket.io for live bus positions
  - Custom bus marker component

Backend:
  - Socket.io broadcasts bus:position
  - BusPosition collection (MongoDB)
  - GPS update from driver app or simulator

User Flow:
  1. Admin opens /admin/tracking
  2. Map renders with all active routes
  3. Bus markers placed at last known position
  4. Socket.io subscribes to real-time updates
  5. Every 5-10 sec: bus position updates
  6. Map animates marker movement smoothly
```

**Implementation:**

```typescript
// File: frontend/src/components/maps/BusMap.tsx

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { connectSocket } from '@/lib/socket';

export default function BusMap() {
  const [buses, setBuses] = useState<BusPosition[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    // Connect WebSocket
    const socket = connectSocket();
    socket.emit('admin:subscribe_all');

    socket.on('bus:position', (data) => {
      setBuses(prev => [
        ...prev.filter(b => b._id !== data._id),
        { ...data, lat: data.latitude, lng: data.longitude }
      ]);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <MapContainer
      center={[28.6139, 77.2090]}  // Delhi
      zoom={12}
      style={{ height: '600px', width: '100%' }}
    >
      {/* Tile layer (OpenStreetMap) */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap'
      />

      {/* Route polylines */}
      {routes.map(route => (
        <Polyline
          key={route._id}
          positions={route.stages.map(s => [s.lat, s.lng])}
          color="blue"
          weight={2}
          opacity={0.5}
        />
      ))}

      {/* Bus markers */}
      {buses.map(bus => (
        <Marker
          key={bus._id}
          position={[bus.lat, bus.lng]}
          icon={getBusIcon(bus)}
        >
          <Popup>
            <BusPopupContent bus={bus} />
          </Popup>
        </Marker>
      ))}

      {/* Stop markers */}
      {routes.map(route =>
        route.stages.map(stage => (
          <Marker
            key={stage._id}
            position={[stage.lat, stage.lng]}
            icon={getStopIcon()}
          >
            <Popup>{stage.stage_name}</Popup>
          </Marker>
        ))
      )}
    </MapContainer>
  );
}

// Custom bus icon (color by status)
function getBusIcon(bus: BusPosition) {
  const color = bus.delay_minutes > 5 ? 'red' : 'green';
  return L.icon({
    iconUrl: `/icons/bus-${color}.png`,
    iconSize: [32, 32],
  });
}

// Popup card for bus
function BusPopupContent({ bus }: { bus: BusPosition }) {
  return (
    <div className="p-3 text-sm">
      <p className="font-bold">{bus.busNumber}</p>
      <p>Route: {bus.routeName}</p>
      <p>Speed: {bus.speed} km/h</p>
      <p className={bus.delay_minutes > 5 ? 'text-red-600' : 'text-green-600'}>
        Delay: {bus.delay_minutes > 0 ? `+${bus.delay_minutes}m` : '✓ On-time'}
      </p>
      <p>Next Stop: {bus.nextStage}</p>
      <p>Passengers: {bus.passengers_current}/{bus.capacity}</p>
    </div>
  );
}
```

**Heatmap Overlay (Optional):**

```typescript
// Demand heatmap showing hot spots
function addHeatmapLayer() {
  const demandData = demand_predictions.map(d => [
    d.stage.lat,
    d.stage.lng,
    d.predicted_demand  // Intensity
  ]);

  L.heatLayer(demandData, {
    max: 100,
    radius: 25,
    blur: 15,
    gradient: {
      0.0: 'blue',
      0.5: 'yellow',
      1.0: 'red'
    }
  }).addTo(map);
}
```

---

## Section 3: Advanced Features

### Q5: How do you handle authentication on the frontend?

**Answer:**

**Auth State Management (Zustand):**

```typescript
// File: src/store/authStore.ts

import { create } from 'zustand';
import api from '@/lib/api';
import * as SecureStore from 'expo-secure-store';  // Mobile
import { Platform } from 'react-native';  // Mobile

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  loadToken: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data;

      // Store token (platform-aware)
      if (Platform.OS === 'web') {
        localStorage.setItem('accessToken', accessToken);
      } else {
        await SecureStore.setItemAsync('accessToken', accessToken);
      }

      // Update state
      set({ accessToken, user, loading: false });

      // Set auth header for future requests
      api.defaults.headers['Authorization'] = `Bearer ${accessToken}`;

      console.log(`✓ Logged in as ${user.email}`);
    } catch (error) {
      console.error('Login failed:', error);
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Revoke token on backend
      await api.post('/auth/logout');

      // Clear local storage
      if (Platform.OS === 'web') {
        localStorage.removeItem('accessToken');
      } else {
        await SecureStore.deleteItemAsync('accessToken');
      }

      set({ accessToken: null, user: null });
      delete api.defaults.headers['Authorization'];

      console.log('✓ Logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  loadToken: async () => {
    try {
      let token;
      if (Platform.OS === 'web') {
        token = localStorage.getItem('accessToken');
      } else {
        token = await SecureStore.getItemAsync('accessToken');
      }

      if (token) {
        set({ accessToken: token });
        api.defaults.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Token load error:', error);
    }
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user });
    } catch (error) {
      console.error('Fetch user error:', error);
      set({ user: null, accessToken: null });
    }
  },

  setUser: (user: User) => set({ user }),
}));
```

**Protected Routes:**

```typescript
// File: src/app/layout.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout({ children }) {
  const { user, loading, loadToken, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // On app load: restore token and user
    const init = async () => {
      await loadToken();
      await fetchMe();
    };
    init();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}

// Protected page example
// File: src/app/admin/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not admin
    if (!user) {
      router.push('/login');
    } else if (!['admin', 'dispatcher'].includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [user]);

  if (!user || !['admin', 'dispatcher'].includes(user.role)) {
    return <div>Checking permissions...</div>;
  }

  return <AdminDashboard />;
}
```

---

### Q6: How do you handle form validation and submission?

**Answer:**

**Form Stack:**

```
React Hook Form (handles state, validation)
  ↓
Zod (schema validation, type-safe)
  ↓
Axios (API submission)
  ↓
React Hot Toast (user feedback)
```

**Example: Create Schedule Form**

```typescript
// File: src/app/admin/schedule/CreateScheduleModal.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Define schema (validation rules)
const scheduleSchema = z.object({
  route: z.string().min(1, 'Route required'),
  bus: z.string().min(1, 'Bus required'),
  driver: z.string().min(1, 'Driver required'),
  date: z.date().min(new Date(), 'Date must be in future'),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

export default function CreateScheduleModal({ onClose, onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
  });

  const onSubmit = async (data: ScheduleForm) => {
    try {
      const res = await api.post('/schedule', {
        route: data.route,
        bus: data.bus,
        driver: data.driver,
        date: data.date.toISOString().split('T')[0],
        departureTime: data.departureTime,
        arrivalTime: data.arrivalTime,
      });

      toast.success('✓ Schedule created');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(`✗ Error: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h2 className="text-lg font-bold mb-4">Create Schedule</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Route Select */}
          <div>
            <label className="block text-sm font-medium mb-1">Route</label>
            <select
              {...register('route')}
              className="w-full p-2 border rounded"
            >
              <option value="">Select route...</option>
              <option value="route-1">Route 5A</option>
              <option value="route-2">Route 12</option>
            </select>
            {errors.route && (
              <p className="text-red-500 text-sm">{errors.route.message}</p>
            )}
          </div>

          {/* Bus Select */}
          <div>
            <label className="block text-sm font-medium mb-1">Bus</label>
            <select
              {...register('bus')}
              className="w-full p-2 border rounded"
            >
              <option value="">Select bus...</option>
              <option value="bus-1">DTC-045</option>
              <option value="bus-2">DTC-102</option>
            </select>
            {errors.bus && (
              <p className="text-red-500 text-sm">{errors.bus.message}</p>
            )}
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              {...register('date', {
                valueAsDate: true,
              })}
              className="w-full p-2 border rounded"
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date.message}</p>
            )}
          </div>

          {/* Departure Time */}
          <div>
            <label className="block text-sm font-medium mb-1">Departure (HH:MM)</label>
            <input
              type="text"
              placeholder="09:00"
              {...register('departureTime')}
              className="w-full p-2 border rounded"
            />
            {errors.departureTime && (
              <p className="text-red-500 text-sm">{errors.departureTime.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## Key Takeaways for Evaluators

✅ **Modern Stack:** Next.js 14, React, TypeScript  
✅ **Real-Time:** WebSocket integration with Socket.io  
✅ **Responsive:** Works on desktop, tablet, mobile  
✅ **Accessible:** WCAG-compliant components  
✅ **Performance:** Image optimization, code splitting, lazy loading  
✅ **User Experience:** Form validation, real-time feedback, beautiful UI  

---

**Document Version:** 1.0  
**Last Updated:** 2 days before evaluation
