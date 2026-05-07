# SmartDTC — Complete Feature Documentation
### For Evaluator Presentation | Capstone Project

> **Stack:** FastAPI (AI), Express.js (Backend), Next.js 15 (Frontend), Expo React Native (Mobile)
> **Database:** MongoDB + Redis | **Real-time:** Socket.IO | **ML:** TensorFlow/Keras, XGBoost, scikit-learn

---

## Table of Contents

1. [AI Service — Machine Learning Engine](#1-ai-service--machine-learning-engine)
2. [Backend — REST API & Real-Time Server](#2-backend--rest-api--real-time-server)
3. [Frontend — Admin Dashboard (Next.js)](#3-frontend--admin-dashboard-nextjs)
4. [Mobile App — Driver & Passenger (Expo)](#4-mobile-app--driver--passenger-expo)
5. [Cross-Cutting: Real-Time Architecture](#5-cross-cutting-real-time-architecture)
6. [Cross-Cutting: GPS Simulation Pipeline](#6-cross-cutting-gps-simulation-pipeline)
7. [Data Flow Diagrams](#7-data-flow-diagrams)

---

## 1. AI Service — Machine Learning Engine

**Tech:** Python 3.11, FastAPI 3.0.0, TensorFlow/Keras, XGBoost, LightGBM, CatBoost, scikit-learn
**Port:** `8000` | **Start:** `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

The AI service is a standalone FastAPI microservice. The backend calls it over HTTP. The frontend can also call it directly via `NEXT_PUBLIC_AI_URL`. It exposes **8 endpoint groups**.

---

### 1.1 Passenger Demand Prediction

**Endpoint:** `POST /predict/demand`  
**Also:** `POST /predict/demand/all-models`

**What it does:**  
Predicts how many passengers will board on a specific route at a specific hour on a specific date. Returns `predicted_count`, `crowd_level` (low/medium/high/critical), model name used, and confidence.

**How it works (step by step):**

1. **Input features:** `route_id`, `date`, `hour` (0–23), `is_weekend`, `is_holiday`, `weather` (clear/rain/fog/storm), `avg_temp_c`, `special_event`
2. **Feature engineering** (`predictors.py → _build_demand_features`):
   - Hour is converted to **cyclic encoding**: `sin(2π × hour/24)` and `cos(2π × hour/24)` — this prevents the model from thinking hour 23 and hour 0 are far apart
   - Weather is mapped to a multiplier: `clear=1.0`, `rain=0.85`, `fog=0.90`, `storm=0.75`
   - A `HOUR_BASE_DEMAND` lookup table encodes prior knowledge (e.g., hour 18 = 130 passengers base)
   - Final 23-element feature vector is built and scaled using the saved `StandardScaler`
3. **Model selection:** If `model=auto` (default), picks the best model by lowest MAPE from `model_loader.demand_best_model`. Otherwise uses the requested model key.
4. **Six models available:**
   - `lstm` — Long Short-Term Memory (Keras sequential, captures time-series patterns)
   - `gru` — Gated Recurrent Unit (lighter LSTM variant)
   - `transformer` — Attention-based model (best for non-linear temporal dependencies)
   - `xgboost` — Gradient Boosted Trees (fastest, most interpretable)
   - `lightgbm` — Leaf-wise tree boosting (high accuracy, lower memory)
   - `random_forest` — Ensemble of decision trees (robust, no scaling needed)
5. **Output:** `predicted_count` → mapped to crowd level: <30=low, 30–60=medium, 60–90=high, ≥90=critical

**Accuracy metrics (from training):**
- MAPE ≈ 8.3%, R² ≈ 0.99, MAE ≈ 1.4 passengers

**Evaluator questions to expect:**
- *Why cyclic encoding for hour?* — A linear encoding treats hour 23 and hour 0 as maximum distance apart, but they're actually 1 minute apart on the clock. Cyclic encoding preserves the circular nature of time.
- *Why 6 models?* — Each has strengths: LSTM captures sequential patterns, XGBoost is faster and interpretable, ensemble averages reduce variance. We auto-select the best.
- *How is demand data generated?* — `training/generate_dataset.py` creates synthetic data using Delhi ridership patterns (peak hours 8–10, 17–20) with weather and holiday factors applied.

---

### 1.2 Bus Delay Prediction

**Endpoint:** `POST /predict/delay`

**What it does:**  
Predicts how many minutes a bus will be delayed on a route, given time, weather, and route characteristics.

**Input features:** `route_id`, `hour`, `day_of_week`, `is_weekend`, `is_holiday`, `weather`, `avg_temp_c`, `passenger_load_pct`, `scheduled_duration_min`, `distance_km`, `total_stops`

**How it works:**

1. Feature vector is built from all inputs (11 features) and scaled with a `StandardScaler`
2. **Six delay models:**
   - `xgboost` — primary model (XGBRegressor)
   - `lightgbm` — LGBMRegressor
   - `catboost` — CatBoostRegressor (handles categoricals natively)
   - `svr` — Support Vector Regression (good for small patterns)
   - `mlp` — Multi-Layer Perceptron (neural net for delay)
   - `ensemble` — Weighted average of all 5 above (best overall RMSE)
3. Model auto-selects the best by lowest MAE
4. **Fallback heuristic:** If no model is loaded, uses rule-based logic: `base=5min`, +3 for rain, +2 for peak hour, +passenger_load/10, capped at 30min

**Accuracy metrics:** MAE ≈ 1.06 min, R² ≈ 0.95

**Where it's used in the system:**
- `demandPrediction.job.js` — hourly job passes `weather` to delay model
- `mobile.routes.js /ai/delay` — mobile app can query expected delay before boarding
- Admin dashboard delay trend charts

---

### 1.3 Anomaly Detection

**Endpoint:** `POST /detect/anomaly`

**What it does:**  
Given a bus's current `speed_kmh`, `delay_minutes`, and `passenger_load` (0–200%), determines if the bus is behaving abnormally — potential breakdown, accident, or route deviation.

**How it works (step by step):**

1. **3-feature vector:** `[speed_kmh, delay_minutes, passenger_load]`
2. Feature is scaled using the anomaly `StandardScaler`
3. **Six anomaly models:**
   - `isolation_forest` — Builds random trees; points that are isolated quickly are anomalies
   - `lof` (Local Outlier Factor) — Compares local density of point to its neighbours
   - `ocsvm` (One-Class SVM) — Learns a boundary around normal data
   - `autoencoder` — Neural network that reconstructs normal data; high reconstruction error = anomaly
   - `dbscan` — Density-based spatial clustering; unclustered points are anomalies
   - `ensemble` — Majority vote across all 5 models
4. Returns: `is_anomaly` (bool), `score` (0–1), `confidence`, `reason` (text explanation), `model` used

**Anomaly thresholds (example):**
- Speed > 90 km/h (bus speeding) OR speed = 0 for extended period (stuck)
- Delay > 20 min AND passenger_load > 90% (overcrowding + delay = critical)
- Speed sudden drop to 0 with high delay

**Where it's used:**
- `gpsSimulator.js` — every 5th GPS tick (every 25 seconds per bus), sends live telemetry to this endpoint
- If `is_anomaly=true`, a `breakdown` critical alert is created in MongoDB AND emitted via Socket.IO to admin dashboard

**Accuracy metrics:** Precision ≈ 0.59, Recall ≈ 0.99, F1 ≈ 0.74
(High recall is intentional — we prefer false alarms over missing a real breakdown)

---

### 1.4 ETA Prediction

**Endpoint:** `POST /predict/eta`

**What it does:**
Predicts how many minutes until a bus reaches the next stop, given remaining distance, time of day, weather, and current speed.

**Model:** Gradient Boosting Regressor (GBR) — trained on 5,000 synthetic trips
**Features:** `distance_km`, `hour`, `day_of_week`, `is_weekend`, `weather` (encoded 0–3), `avg_speed_kmh`, `passenger_load_pct`

**Training data logic:**
```
time_min = (distance / avg_speed) × 60 + weather_penalty + peak_penalty + noise
```
- Rain adds +6 min, storm adds +9 min per WMO code
- Peak hours (8–10, 17–20) add random 3–10 min penalty

**Response includes `breakdown`:** shows how much time weather + peak congestion contributed.

**Fallback:** If model fails, returns `(distance/speed) × 60` as haversine estimate.

---

### 1.5 Fare Calculation

**Endpoint:** `POST /predict/fare`

**What it does:**  
Calculates the bus fare in INR based on distance and bus type, using Delhi DTC slab-based fare structure.

**How it works:**
Uses a deterministic slab lookup (no ML needed — this is the official DTC fare table):

| Distance | Non-AC | AC | Electric |
|----------|--------|----|----------|
| 0–2 km   | ₹10    | ₹15| ₹10      |
| 2–5 km   | ₹15    | ₹20| ₹15      |
| 5–10 km  | ₹20    | ₹30| ₹20      |
| 10–15 km | ₹25    | ₹40| ₹25      |
| 15–20 km | ₹30    | ₹50| ₹30      |
| >40 km   | ₹60    | ₹100| ₹60     |

**Where it's used:**
- `mobile.routes.js POST /driver/trip/end` — after a driver ends a trip, total fare is calculated: `fare_per_person × passengerCount` and stored in `TripHistory.fare`
- This fare feeds into driver earnings screen in the mobile app

---

### 1.6 Headway Optimization (Genetic Algorithm)

**Endpoint:** `POST /optimize/headway`

**What it does:**  
Given a route, date, fleet size, and time window, finds the optimal bus dispatch schedule that **minimizes total passenger waiting time**.

**How it works — Genetic Algorithm (optimizer.py):**

1. **Demand curve:** For each hour 0–23, compute expected demand using Gaussian peaks at morning (hour 9) and evening (hour 18). Weekend/holiday factor reduces demand by 30%.
2. **Chromosome representation:** Each solution is a list of N dispatch times (minutes from midnight), one per bus in the fleet.
3. **Fitness function:** Total passenger wait time = Σ(demand_at_hour × headway/2) across all intervals. Lower is better.
4. **GA parameters:** Population = 60 chromosomes, Generations = 120, Tournament selection (size 3), Crossover = single-point at random index, Mutation = random perturbation ±60 min (5% probability per gene)
5. **Early stopping:** Stops when improvement < 0.1% over last 20 generations
6. **Output:** Sorted list of departure times with headway gaps and which time slots are peak vs off-peak

**Result interpretation:** If demand at 8am is 120 and 3 buses are available, the GA will cluster buses 8:00, 8:12, 8:24 instead of evenly spacing them — because peak demand justifies tighter headways.

**Where it's used:**
- `scheduleOptimize.job.js` — runs every night at 02:00, fetches tomorrow's schedules per route, sends to AI, updates `Schedule.departureTime` in MongoDB

---

### 1.7 Model Retraining Pipeline

**Endpoint:** `POST /admin/retrain`  
**Body:** `{ retrain_xgboost: true, retrain_lstm: false, retrain_anomaly: true }`

**What it does:**  
Triggers background retraining of selected models using the latest data in `data/delay_dataset.csv` and `data/demand_dataset.csv`.

**How it works:**
1. FastAPI's `BackgroundTasks` runs the pipeline asynchronously (doesn't block the HTTP response)
2. `retrain_pipeline.py → run_retrain_pipeline()` is called
3. For XGBoost delay model: loads CSV, re-fits `XGBRegressor`, saves to `models/saved/`
4. For anomaly model: loads CSV, re-trains `IsolationForest` with new contamination estimate
5. For LSTM: trains a new Keras LSTM model and serializes weights
6. After retraining, `model_loader.load_models()` is called again to hot-swap models in memory — no restart needed
7. Returns `{ status: "completed", models_retrained: [...], metrics: {...} }`

**Where it's triggered:**
- Admin Dashboard → "Retrain Models" button (with confirmation dialog and spinner)
- Also available from admin demand analytics page

---

### 1.8 Health & Stats Endpoints

- `GET /health` — lists all loaded models by name, count, best model key, scaler status
- `GET /stats` — rich metrics: MAPE, MAE, RMSE, R², F1, OTP improvement vs baseline ("78% vs 62%"), wait reduction ("47%"), fleet utilisation gain ("+18%")
- `GET /models/comparison` — full comparison table for all three tasks (demand/delay/anomaly) with per-model metrics

---

## 2. Backend — REST API & Real-Time Server

**Tech:** Node.js, Express 5.1.0, MongoDB/Mongoose, Redis, Socket.IO, node-cron
**Port:** `5000` | **Start:** `node server.js`

---

### 2.1 Authentication System

**Routes:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me`

**How it works:**
1. On register: password is hashed with `bcrypt` (10 rounds), user saved to MongoDB with role (`admin`/`driver`/`passenger`)
2. On login: password compared with `bcrypt.compare()`, two tokens issued:
   - **Access token** — JWT, expires in 15 minutes
   - **Refresh token** — JWT, expires in 7 days, stored in HTTP-only cookie (not accessible by JS, prevents XSS)
3. Every protected route passes through `auth.middleware.js` which verifies the JWT via `jsonwebtoken.verify()`
4. `authorize('admin', 'driver')` middleware checks `req.user.role` — role-based access control
5. Refresh flow: Client sends refresh token cookie → server issues new access token without re-login

**Security stack:**
- `helmet` — sets 15+ HTTP security headers (CSP, HSTS, etc.)
- `express-mongo-sanitize` — strips `$` and `.` from request bodies to prevent NoSQL injection
- `express-rate-limit` — 100 requests per 15 minutes per IP on auth routes
- CORS whitelist: localhost:3000, localhost:19006, Expo tunnel URLs

---

### 2.2 Bus & Route Management

**Routes:** `/api/v1/buses`, `/api/v1/routes`, `/api/v1/stages`

**How it works:**
- `Bus` model stores: `busNumber`, `type` (AC/Non-AC/Electric), `capacity`, `status` (active/maintenance/inactive), `lastPosition` (lat/lng/speed/timestamp), `currentRoute` reference
- `Route` model stores: `route_name`, `route_number`, `start_stage`, `end_stage`, `url_route_id` (DTC code), `distance_km`, `isActive`
- `Stage` model stores each bus stop: `stage_name`, `location` (GeoJSON Point `{type: "Point", coordinates: [lng, lat]}`), `seq` (stop order), `url_route_id`
- Stages are indexed with `2dsphere` MongoDB index for geospatial queries
- Routes are seeded from the real `routes.csv` and `stages.csv` files containing Delhi DTC network data

---

### 2.3 Live Bus Tracking API

**Route:** `GET /api/v1/tracking/live`

**How it works:**
1. Queries `BusPosition` collection for latest position per bus using MongoDB aggregation:
   ```javascript
   $sort: { timestamp: -1 }
   $group: { _id: "$bus", latest: { $first: "$$ROOT" } }
   ```
2. Each position is **normalized** to a flat object including: `busId`, `busNumber`, `lat`, `lng`, `speed`, `delay_minutes`, `passenger_load`, `nextStage`, `routeId`, `routeName`, `distanceToNextStop`, `isSimulated`
3. Response cached in Redis for 5 seconds (to handle multiple admin clients polling)

**BusPosition schema fields:**
- `location` — GeoJSON Point (for geospatial queries)
- `speed` — km/h
- `heading` — 0–360 degrees
- `nextStage` — reference to Stage model
- `etaNextStage` — Date object
- `delay_minutes` — current delay
- `passenger_load` — 0–100+ percentage
- `isSimulated` — boolean flag

---

### 2.4 Schedule Management

**Routes:** `/api/v1/schedules`

**How it works:**
- Admin creates schedules by assigning a `driver`, `bus`, `route`, `date`, `departureTime`, `estimatedArrivalTime`
- Status lifecycle: `scheduled → in-progress → completed` (or `cancelled`)
- When driver starts a trip via mobile app, `PATCH /driver/trip/start` sets `status: 'in-progress'`
- Nightly at 02:00, `scheduleOptimize.job.js` runs and may update `departureTime` fields based on AI headway optimization

---

### 2.5 Driver Management

**Routes:** `/api/v1/drivers`

**Driver model fields:**
- `userId` — linked User account
- `licenseNo`, `experience`, `rating` (1–5, auto-updated from trip ratings)
- `assignedBus` — reference to Bus
- `status` — on-duty/off-duty/on-leave

**Rating update mechanism:**  
When a passenger rates a trip (`POST /mobile/trips/:tripId/rating`), the backend:
1. Saves rating to `TripHistory.rating.driver`
2. Fetches ALL rated trips for that driver
3. Computes running average: `Σ(rating.driver) / count`
4. Updates `Driver.rating` with rounded average

---

### 2.6 Scan-to-Board Booking System

**The system uses a physical QR code on each bus gate.** Passengers scan it on-board with their phone to book a seat in real time — no pre-booking or counter needed.

---

#### Step 1 — Passenger scans bus QR
**Endpoint:** `GET /api/v1/public/bus-scan/:busQrId` (no auth required)

Each bus has a `busQrId` field in the `Bus` model. When the passenger scans the gate QR:
1. Backend finds the `Bus` by `busQrId` (populated with `currentRoute`)
2. Finds today's active or in-progress `Schedule` for that bus
3. Loads all `Stage` stops for the route (sorted by `seq`)
4. Fetches the latest `BusPosition` to determine the bus's **current stop** (`nextStage.stage_name`)
5. **Calculates fare per stop from the current position onward:**
   - `seqDiff = targetStop.seq − currentStop.seq`
   - `km = seqDiff × 1.5` (approx 1.5 km per stop)
   - Fare looked up from DTC slab table based on `bus.type` (AC/Non-AC/Electric)
6. Returns: `bus info`, `route`, `schedule`, `currentStop`, `stages[]` each with `fareFromHere` and `distanceKm`

---

#### Step 2 — Passenger selects drop stop + passenger count
The app shows all upcoming stops with per-stop fare. Passenger taps their drop stop and adjusts passenger count (1–6).

---

#### Step 3 — Confirm seat (mobile-book)
**Endpoint:** `POST /api/v1/public/scan-book/mobile-book` (auth required)

**Body:** `{ busQrId, scheduleId, dropStageId, dropStageName, fare, passengers }`

**Seat assignment algorithm (4-across W-A-A-W layout):**
1. Fetch all currently `confirmed + boarded` bookings for the schedule → collect their `seatNumbers`
2. Iterate rows 1 → `ceil(capacity/4)`, columns 0–3
3. Seat label = `${row}${W|A|A|W}` (e.g., `1W`, `1A`, `2A`, `2W`, `3W`…)
4. Skip any seat already in `bookedSeats` set
5. Assign the first N available seats — no preference needed (passenger is already on board)
6. `Booking.create()` with:
   - `status: 'confirmed'`
   - `paymentMode: 'cash'` (pay conductor on bus)
   - `expiresAt: now + 90 minutes` (ticket validity window)
   - `bookingRef` auto-generated as `DTC-XXXXXXXX`
7. Returns ticket: `bookingRef`, `seatNumbers[]`, `toStop`, `fare`, `expiresAt`, `busNumber`, `busType`

---

#### Step 4 — Passenger receives digital ticket with QR
The mobile app renders the ticket screen showing:
- A QR code generated from `{bookingRef, bus, toStop, seats[], expires}` via `api.qrserver.com`
- Seat badges (e.g., `2W`, `3A`)
- Fare, drop stop, validity countdown
- Hint: "Pay fare to conductor on boarding"

---

#### Step 5 — Driver scans passenger QR to verify
**Endpoint:** `POST /api/v1/mobile/driver/verify-qr` (driver auth)

- Finds booking by `bookingRef`
- If `cancelled` → rejects with red overlay
- If already `boarded/completed` → warns "already boarded"
- If `confirmed` → updates status to `boarded`, returns passenger name + seat numbers

---

**Payment flow (online Razorpay — production path):**
- `POST /api/v1/public/scan-book/create-order` → creates Razorpay order (amount in paise)
- Passenger completes UPI/card payment in app
- `POST /api/v1/public/scan-book/verify-payment` → verifies HMAC-SHA256 signature
  - `expected = HMAC(order_id|payment_id, RAZORPAY_KEY_SECRET)`
  - On match → creates booking with `paymentMode: 'online'`, `paymentId`

**Booking statuses:** `confirmed → boarded → completed` (or `cancelled`)

**Ticket validity:** 90 minutes from booking time — prevents misuse of old tickets

---

### 2.7 Alert System

**Routes:** `/api/v1/alerts`

**Alert types:** `delay`, `breakdown`, `sos`, `overcrowding`, `maintenance`
**Severities:** `info`, `warning`, `critical`

**Alert creation sources:**
1. **Auto-generated by GPS Simulator** — delay alerts when `delay_minutes > 10`, anomaly alerts from AI
2. **Passenger SOS** — `POST /api/v1/alerts/passenger-sos` from mobile app
3. **Manual** — Admin creates via dashboard

**How passenger SOS works:**
1. Passenger taps SOS button in app → sends `{type, message, latitude, longitude, busNumber, routeName}` to `/passenger-sos`
2. Alert saved to MongoDB
3. `socket.io` emits to **two rooms simultaneously:**
   - `admin-dashboard` → `admin:new_alert` (shown in dashboard alert feed)
   - `sos-alerts` → `sos:new` (dedicated SOS room with location details)
4. Push notifications sent to ALL registered admin Expo tokens via `notification.service.js`

---

### 2.8 Real-Time Weather Integration

**File:** `backend/src/services/weather.service.js`

**How it works:**
1. Calls **Open-Meteo API** (completely free, no API key): `https://api.open-meteo.com/v1/forecast`
2. Parameters: `latitude=28.6139` (Delhi), `longitude=77.2090`, `current=temperature_2m,weathercode,windspeed_10m`
3. WMO weather code mapped to SmartDTC string: `0=clear`, `1-3=cloudy`, `51-67=rain`, `45-48=fog`, `≥95=storm`
4. Result **cached in memory for 30 minutes** (avoids hammering the API every job run)
5. **Fallback:** If API fails, returns realistic Delhi defaults by month (e.g., month 8 = `rain`, 31°C)
6. Used by both `demandPrediction.job.js` and `scheduleOptimize.job.js`

---

### 2.9 Indian Holiday Calendar

**File:** `backend/src/utils/holidays.js`

**How it works:**
- A `Set` of date strings (`YYYY-MM-DD`) for all Indian public holidays 2025–2026
- Includes: Republic Day (Jan 26), Holi (Mar 17), Good Friday (Apr 18), Eid-ul-Fitr, Ambedkar Jayanti, Independence Day (Aug 15), Diwali (Oct 20), Christmas (Dec 25), and more
- `isHoliday(dateStr)` → returns `true` or `false`
- `getHolidayName(dateStr)` → returns holiday name for display
- Used in demand prediction jobs: holidays affect demand patterns (lower on Holi, higher on Independence Day)

---

### 2.10 Automated Cron Jobs

**File:** `backend/src/services/scheduler.service.js`

| Job | Schedule | What it does |
|-----|----------|--------------|
| Demand Prediction | Every hour | Calls AI `/predict/demand` for all active routes, stores in `PassengerDemand` collection |
| Schedule Optimization | Daily 02:00 AM | Calls AI `/optimize/headway` for tomorrow's schedules, updates departure times |
| GPS Simulator | Every 5 seconds | Ticks all active buses (when `ENABLE_GPS_SIMULATOR=true`) |

**Demand prediction job detailed flow:**
1. Fetch all active routes from DB
2. Get current hour, day of week, date
3. Fetch real Delhi weather (30-min cached)
4. Check if today is a public holiday
5. For each route, POST to AI with all context
6. Upsert `PassengerDemand` record (route + date + hour as composite key)
7. Log: `[DemandJob] Hour 8: 12/12 routes updated | weather=rain temp=28°C holiday=false`

---

### 2.11 AI Proxy Router

**Endpoint prefix:** `POST /api/v1/ai/{demand|delay|eta|fare|anomaly}`

**Why it exists:** Mobile app and frontend cannot call the Python AI service directly in production (different domain, CORS, security). All AI calls are proxied through the Node.js backend.

**How it works:**
1. Backend receives request at `/api/v1/ai/demand`
2. Forwards body to `http://localhost:8000/predict/demand` via `axios`
3. Returns AI response to client
4. **Fallback:** If AI service is down, returns safe defaults (`predicted_count: 50`, `crowd_level: medium`, etc.)

---

### 2.12 Audit Logging

**Middleware:** `audit.middleware.js`

All mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) create an `AuditLog` record:
- `user`, `action`, `resource`, `resourceId`, `method`, `path`, `ip`, `timestamp`, `changes` (diff)
- Queryable by admin for compliance review

---

### 2.13 Push Notifications

**File:** `services/notification.service.js`

**How it works:**
1. When driver/passenger app launches, calls `POST /api/v1/mobile/push-token` with their Expo push token
2. Token stored in `PushToken` collection linked to `User._id`
3. When SOS or critical alert triggers, backend fetches all admin tokens and calls Expo Push Notification API (`https://exp.host/--/api/v2/push/send`)
4. Also used for schedule change notifications

---

## 3. Frontend — Admin Dashboard (Next.js)

**Tech:** Next.js 15.3.0, React 19, TypeScript, Tailwind CSS, Recharts, Socket.IO client, Lucide Icons
**Port:** `3000` | **Start:** `npm run dev`

All pages are under `src/app/admin/` using the Next.js App Router. Every page is a Client Component (`'use client'`) that fetches from the backend REST API and subscribes to Socket.IO events.

---

### 3.1 Admin Dashboard (`/admin`)

**What it shows:**
- **Summary cards:** Total buses, active buses, total drivers, routes, buses on time, delayed, total trips today, SOS alerts
- **Live bus map:** Real-time positions of all simulated/real buses using leaflet-style rendering
- **Demand by hour chart:** Bar chart showing predicted passenger count per hour for today (from `PassengerDemand` collection)
- **Weekly OTP trend:** Line chart of on-time performance % over last 7 days
- **AI Model stats panel:** Live from `/stats` endpoint — shows MAPE, MAE, F1, best model names
- **Driver leaderboard:** Top 5 drivers by on-time performance, from `reports/driver-leaderboard`
- **Active alerts feed:** Last 5 unresolved alerts with severity badges, resolve button
- **System health panel:** DB status, Redis status, AI service status, socket connections, memory usage
- **Mobile app stats:** Total bookings, active tokens, SOS count (from `/admin/app-stats`)

**Real-time updates:**
- Socket.IO subscribes via `admin:subscribe_all` on mount
- Listens to `bus:location_update` → updates live bus list state
- Listens to `alert:new` → prepends to alert feed and shows toast
- Listens to `sos:new` → shows critical SOS toast with location details

**Generate Schedule button:**
- `POST /api/v1/schedules/generate` → AI service generates optimal schedule
- Shows spinner, then refreshes data

**Retrain Models button:**
- Opens confirmation dialog
- `POST /api/v1/admin/retrain` → proxied to AI service `/admin/retrain`
- Shows spinner while in progress

---

### 3.2 Tracking Page (`/admin/tracking`)

**What it shows:**
- All live buses on an interactive map
- Clicking a bus shows: bus number, route, speed, delay, passenger load %, next stop, ETA
- Bus list sidebar with color-coded delay status
- Route filter dropdown

**How it works:**
1. `GET /api/v1/tracking/live` fetches all latest BusPositions
2. Socket.IO `bus:location_update` updates positions in real-time (no polling)
3. `distanceToNextStop` shown using Haversine formula computed server-side

---

### 3.3 Demand Analytics Page (`/admin/demand`)

**What it shows:**
- Hourly demand prediction for selected route/date
- Multi-model comparison: all 6 demand models' predictions for the same input
- Crowd level gauge (low/medium/high/critical)
- Historical actual vs predicted chart
- Weather context banner (current Delhi weather)
- **Retrain Models button** with spinner

**How it works:**
1. User selects route + date
2. `POST /api/v1/ai/demand` called with form data → returns predictions
3. `POST /predict/demand/all-models` called separately to show model comparison table
4. Recharts `BarChart` renders demand by hour

---

### 3.4 Schedule Management Page (`/admin/schedule`)

**What it shows:**
- All schedules in a table with filtering by date/route/status
- Status badges: `scheduled` (blue), `in-progress` (green), `completed` (grey), `cancelled` (red)
- Add/Edit schedule modal
- Optimize button triggers AI schedule optimization

**How it works:**
- CRUD via `/api/v1/schedules`
- Status is type-cast correctly in TypeScript: `status as Schedule['status']`

---

### 3.5 Reports Page (`/admin/reports`)

**What it shows:**
- **On-Time Performance (OTP):** % of trips with delay ≤ 5 min
- **Demand heatmap:** Hour × Route matrix of predicted passenger counts
- **Driver performance summary:** Top drivers, avg rating, trip counts
- **Headway comparison:** Planned vs AI-optimized headway for each route
- **System KPIs:** Fleet utilization, revenue estimate, passenger satisfaction

**Headway comparison data** comes from `scheduleOptimize.job.js` results stored in DB.

---

### 3.6 Alert Management Page (`/admin/alerts`)

- All alerts with filter by type/severity/resolved status
- Bulk resolve, individual resolve
- SOS alerts highlighted in red with location coordinates
- Real-time new alerts via Socket.IO

---

### 3.7 Driver & Bus Management Pages (`/admin/drivers`, `/admin/buses`)

- Full CRUD for drivers and buses
- Driver page shows rating, assigned bus, status, trip history
- Bus page shows current status, last position timestamp, fuel/maintenance notes

---

### 3.8 User Management (`/admin/users`)

- All registered users (admin/driver/passenger roles)
- Role assignment, account enable/disable

---

## 4. Mobile App — Driver & Passenger (Expo)

**Tech:** Expo SDK 52, React Native, TypeScript, Expo Router, Zustand (state), Socket.IO client
**Build:** EAS Build → AAB (Android App Bundle) hosted on Expo cloud

The app uses **Expo Router file-based routing** with two role-based route groups:
- `app/(driver)/` — driver screens
- `app/(passenger)/` — passenger screens

Role is determined from JWT claims after login; the app renders the appropriate tab navigator.

---

### 4.1 Authentication Flow (`app/login.tsx`, `app/register.tsx`)

**How it works:**
1. User enters email + password → `POST /api/v1/auth/login`
2. Access token stored in `AsyncStorage` (encrypted)
3. User object (including `role`) stored in Zustand auth store
4. Expo Router redirects based on role: `driver` → `/(driver)`, `passenger` → `/(passenger)`
5. On app restart, token is read from AsyncStorage and validated with `GET /auth/me`
6. If token expired, refresh token in HTTP-only cookie is used transparently

---

### 4.2 Driver Dashboard (`(driver)/index.tsx`)

**What it shows:**
- Today's assigned trips (count)
- Completed trips count
- Current schedule status (next departure time)
- Assigned bus number
- Quick action buttons: Start Trip, View Schedule, Scan QR

**API calls:** `GET /api/v1/mobile/driver/dashboard`

---

### 4.3 Driver Schedule (`(driver)/schedule.tsx`)

**What it shows:**
- Today's schedules with route name, departure time, bus number, status
- Week view with date selector
- Current active trip highlighted
- "Start Trip" button for next scheduled trip

**How start trip works:**
1. `POST /api/v1/mobile/driver/trip/start` with `scheduleId`
2. Backend: updates `Schedule.status = 'in-progress'`, creates `TripHistory` record
3. Socket.IO emits `driver:trip_started` to admin dashboard
4. App navigates to `active-trip.tsx`

---

### 4.4 Active Trip Screen (`(driver)/active-trip.tsx`)

**What it shows:**
- Route name, current stop, next stop
- Real-time delay counter
- "Arrived at Stop" button (sends `driver:arrived_stop` via socket)
- GPS update: app sends `driver:gps_update` every 10 seconds via Socket.IO
- Incident report: driver can log incidents (breakdown/passenger issue)
- "End Trip" button

**How end trip works:**
1. Driver taps "End Trip" → inputs stops completed, distance, passenger count, delay minutes
2. `POST /api/v1/mobile/driver/trip/end` called
3. Backend:
   a. Queries AI `/predict/fare` with `distance_km` + `bus_type` → gets per-person fare
   b. Multiplies by `passengerCount` → `fareAmount`
   c. Updates `TripHistory` with `fareAmount`, `passengerCount`, `onTimeStatus`, `delayMinutes`
   d. Sets `Schedule.status = 'completed'`
4. App navigates back to dashboard

---

### 4.5 QR Scanner (`(driver)/scan-qr.tsx`)

**What it does:** Driver scans passenger's QR code to verify booking and mark them as boarded.

**How it works:**
1. Uses Expo Camera with QR code detection
2. Extracts `bookingRef` from QR data
3. `POST /api/v1/mobile/driver/verify-qr` with `{bookingRef}`
4. Backend:
   - Finds booking by `bookingRef`
   - If `cancelled` → returns error with red overlay
   - If `boarded/completed` → shows "already boarded" warning
   - If `confirmed` → updates to `boarded`, returns passenger details
5. Screen shows: passenger name, seat number, boarding stop, drop stop, status badge

---

### 4.6 Driver Earnings Screen (`(driver)/earnings.tsx`)

**What it shows:**
- Period tabs: Today / Week / Month
- Cards: trips, passengers, fare earned, avg delay, on-time %
- Rating bar (avg from passenger ratings)
- Rank badge: Bronze/Silver/Gold/Platinum (based on monthly completed trips: ≥40/80/120)
- **Gamification badges:** earned deterministically based on `completedTrips` count (every 5 trips = new badge)
- Recent trips list with actual passengers/fare/delay from DB (no random values)

**API call:** `GET /api/v1/mobile/driver/performance`
**Data source:** Aggregated from `TripHistory` records — real DB data, no synthetic values.

---

### 4.7 Passenger Map Screen (`(passenger)/map.tsx`)

**What it shows:**
- All active buses on a map with colored markers by crowd level
- Passenger load indicator per bus: green (<50%), yellow (50–80%), red (>80%)
- Tapping a bus shows: route name, next stop, delay, ETA, crowd level
- Bus list sorted by distance from user's location

**How crowd level works:**
- `passenger_load` comes from `BusPosition.passenger_load` in DB (real booking counts from `gpsSimulator.getPassengerLoad()`)
- Color-coded: `passenger_load < 50 = green`, `50–80 = yellow`, `>80 = red`
- No `Math.random()` fallback — real data from DB

**Real-time:** Socket.IO `passenger:track_bus` joins the bus room, receives `bus:location_update` events

---

### 4.8 Bus Search & Route Finder (`(passenger)/search.tsx`)

**What it shows:**
- Search by route number or destination
- List of matching routes with start/end stops
- Expected arrival time at user's stop

**API:** `GET /api/v1/public/routes/search?q=...`

---

### 4.9 Scan-to-Board Flow (`(passenger)/scan-board.tsx`)

**Concept:** No advance booking. Passenger physically gets on the bus, scans the QR code on the gate, picks destination stop, and instantly gets a digital ticket — all in under 30 seconds.

**Three-screen flow inside one file (`scan-board.tsx`):**

#### Screen 1 — Camera Scan (`screen = 'scan'`)
- Opens `expo-camera` `CameraView` with QR barcode scanner enabled
- `barcodeScannerSettings: { barcodeTypes: ['qr'] }`
- Torch toggle button for low-light bus interiors
- `scannedRef` (useRef) prevents double-scanning if camera triggers twice
- Supports both raw `busQrId` and full URL format (`new URL(data).pathname.split('/').last`)
- On scan → calls `GET /api/v1/public/bus-scan/:busQrId` → transitions to Screen 2
- Loading spinner overlay shown while fetching

#### Screen 2 — Bus Info + Stop Selector (`screen = 'info'`)
- Header: bus number, route name, bus type, **LIVE badge** if schedule is `in-progress`
- "Now near: {currentStop}" bar showing the bus's actual current GPS location
- **Scrollable stop list** — each row shows:
  - Stop name
  - `fareFromHere` (₹) — pre-calculated by backend per stop from current position
  - Highlighted orange when selected
- Passenger count stepper: 1–6 (min/max buttons)
- Sticky bottom bar: shows selected stop name + total fare + "Confirm Seat" button
- On confirm → `POST /api/v1/public/scan-book/mobile-book` → transitions to Screen 3

#### Screen 3 — Digital Ticket (`screen = 'ticket'`)
- Green header: "Ticket Confirmed! Seat reserved · Show QR to driver"
- **QR code** image generated via `https://api.qrserver.com/v1/create-qr-code/?data={JSON.stringify({bookingRef, bus, to, seats, expires})}`
- `bookingRef` displayed in monospace (e.g., `DTC-X7KF2A`)
- Details table: Bus, Drop Stop, Passengers, Fare, Valid For (countdown in minutes)
- **Seat badges** in blue (e.g., `1W`, `2A`) — auto-assigned by backend
- Yellow hint: "Pay fare to conductor on boarding"
- "Scan Another Bus" button resets to Screen 1

**Validity countdown:** `expiresAt` is 90 min from booking. If remaining < 15 min, countdown turns red.

**`book/[scheduleId].tsx`** — A secondary advance-booking screen (accessible from search/route pages) that lets passengers pre-book a specific scheduled trip with seat preference (window/aisle/any). Uses the same backend seat assignment but creates the booking before boarding.

---

### 4.10 Passenger Bookings History (`(passenger)/bookings.tsx`)

**What it shows:**
- All past bookings with status badges
- Booking details: route, date, seats, boarding/drop stop
- Cancel button for `confirmed` status bookings
- Rate Trip button for `completed` bookings

**Cancel flow:** `PATCH /api/v1/mobile/bookings/:id` with `{status: 'cancelled'}`

---

### 4.11 Trip Rating (`(passenger)/rate/`)

**What it shows:**
- Star rating (1–5) for overall trip
- Separate rating for driver
- Comfort rating
- Tag chips: "On Time", "Clean", "Friendly Driver", "Overcrowded", etc.
- Comment text box

**How it works:**
1. `POST /api/v1/mobile/trips/:tripId/rating`
2. Stored in `TripHistory.rating` subdocument
3. Backend recomputes driver's average rating from all their rated trips
4. Updates `Driver.rating` with running mean

---

### 4.12 Bus/Stop Tracking (`(passenger)/track/`)

**What it shows:**
- Live location of a specific bus on map
- ETA to each stop along the route
- Distance to next stop
- Delay status with color indicator

**How it works:**
1. `GET /api/v1/tracking/live` fetches all positions
2. Socket.IO `passenger:track_bus` subscribes to real-time updates for the specific bus
3. `distanceToNextStop` calculated server-side via Haversine formula
4. Socket cleanup on unmount: proper `useEffect` return with `socket.off()`

---

### 4.13 Passenger SOS (`(passenger)/sos.tsx`)

**What it shows:**
- SOS type selector: Personal Emergency, Fire, Medical, Vehicle Breakdown, Other
- Message input
- Current GPS coordinates (auto-filled)
- Bus number and route (pre-filled if tracking a trip)
- Big red "SEND SOS" button

**How it works:**
1. `POST /api/v1/alerts/passenger-sos` with all details
2. Backend persists to `Alert` collection
3. Socket.IO emits to `admin-dashboard` AND `sos-alerts` rooms simultaneously
4. Push notification sent to all admin devices immediately
5. App shows confirmation with alert ID and "Help is on the way" message

---

### 4.14 Favourites (`(passenger)/favourites.tsx`)

- Save/unsave routes and stops
- `POST /api/v1/mobile/passenger/favourites` with `{type, refId, label}`
- Listed on home screen for quick access

---

### 4.15 Notifications (`(passenger)/notifications.tsx`)

- In-app notification log (schedule changes, delay alerts, SOS confirmation)
- Push notifications via Expo Push Notification API
- Badge count on tab bar

---

### 4.16 Driver SOS (`(driver)/sos.tsx`)

- For driver emergencies: breakdown, accident, medical
- Sends `driver:sos` Socket.IO event → admin dashboard + sos-alerts room
- Also `POST /api/v1/alerts` to persist

---

## 5. Cross-Cutting: Real-Time Architecture

**Tech:** Socket.IO v4 on backend, `socket.io-client` on frontend/mobile

### Room Architecture

| Room Name | Who joins | Events received |
|-----------|-----------|-----------------|
| `admin-dashboard` | Admin browser tab | `bus:location_update`, `alert:new`, `driver:trip_started`, `bus:arrived`, `anomaly:detected` |
| `sos-alerts` | Admin browser + admin mobile | `sos:new` |
| `bus:{busId}` | Passenger tracking that bus | `bus:location_update` |
| `route:{routeId}` | Passengers watching a route | `bus:location_update`, `bus:arrived` |
| `stop:{stopId}` | Passengers watching a stop | `bus:arrived` |

### Event Flow Examples

**GPS Simulator → Admin Dashboard:**
```
gpsSimulator.tickBus()
  → BusPosition.create() [MongoDB]
  → io.to('admin-dashboard').emit('bus:location_update', payload)
  → io.to('route:{routeId}').emit('bus:location_update', payload)
  → io.to('bus:{busId}').emit('bus:location_update', payload)
```

**Passenger SOS flow:**
```
Passenger app → POST /alerts/passenger-sos
  → Alert.create() [MongoDB]
  → io.to('admin-dashboard').emit('admin:new_alert', alert)
  → io.to('sos-alerts').emit('sos:new', {lat, lng, type, ...})
  → Expo Push API → admin device notification
```

**Driver GPS update flow:**
```
Driver app → socket.emit('driver:gps_update', {lat, lng, speed, busId})
  → Backend socket handler
  → BusPosition.create() [async]
  → io.to('bus:{busId}').emit('bus:location_update')
  → io.to('admin-dashboard').emit('bus:location_update')
```

---

## 6. Cross-Cutting: GPS Simulation Pipeline

When `ENABLE_GPS_SIMULATOR=true`, 16 buses are simulated in real-time.

### Full tick cycle (every 5 seconds per bus):

```
1. Load stages from MongoDB (Stage collection, sorted by seq)
   └─ Falls back to 12 generated Delhi coords if no real stages

2. Interpolate position between current and next stage
   └─ t advances by 0.2 per tick (crosses a stage every 5 ticks = 25 seconds)

3. Compute speed
   └─ Peak hours (7-10, 17-20): 15–30 km/h
   └─ Off-peak: 30–50 km/h

4. Drift delay
   └─ 30% chance +1 min, 70% chance -0.5 min (bounded 0–25 min)

5. Get passenger load [cached 5 min per bus]
   └─ Query Schedule.findOne({bus, status:'in-progress'})
   └─ Count Booking.countDocuments({schedule, status: 'confirmed|boarded'})
   └─ load% = (confirmed+boarded) / bus.capacity × 100
   └─ Fallback: peak=55-90%, off-peak=15-55%

6. BusPosition.create() → saves to MongoDB
   └─ Fields: location(GeoJSON), speed, heading, nextStage, etaNextStage,
              delay_minutes, passenger_load, isSimulated, timestamp

7. Bus.findByIdAndUpdate() → updates lastPosition

8. Socket.IO emit to 3 rooms: bus:{id}, route:{id}, admin-dashboard
   └─ Payload includes passenger_load

9. Delay alert check
   └─ If delay > 10 min AND not already alerted → Alert.create({type:'delay'})
   └─ Emit alert:new to admin-dashboard

10. Anomaly detection (every 5th tick = every 25 seconds)
    └─ POST /detect/anomaly {speed_kmh, delay_minutes, passenger_load}
    └─ If is_anomaly AND not already alerted → Alert.create({type:'breakdown', severity:'critical'})
    └─ Emit alert:new AND anomaly:detected to admin-dashboard
```

---

## 7. Data Flow Diagrams

### Demand Prediction Flow

```
[Cron: every hour]
       ↓
demandPrediction.job.js
  ├─ getCurrentWeather() → Open-Meteo API (Delhi, cached 30min)
  ├─ isHoliday(today) → In-memory Set lookup
  ├─ Route.find({isActive: true})
  └─ For each route:
       └─ POST http://localhost:8000/predict/demand
            └─ predictors.py → best demand model
                 └─ Returns {predicted_count, crowd_level, model, confidence}
       └─ PassengerDemand.findOneAndUpdate(upsert)
              ↓
       [MongoDB: PassengerDemand collection]
              ↓
       GET /api/v1/reports/demand-by-hour
              ↓
       Admin Dashboard → Demand chart renders
```

### Real-Time Bus Position Flow

```
[GPS Simulator, 5s interval]
       ↓
tickBus(bus)
  ├─ getPassengerLoad(bus) → DB booking count (cached 5min)
  ├─ BusPosition.create({...passenger_load...})
  └─ io.emit('bus:location_update', payload)
         ↓
  [Admin Browser - Socket.IO]           [Passenger Mobile - Socket.IO]
  setLiveBuses(prev => update)          setPosition(payload)
  Map re-renders with new coords        Map marker moves
```

### Anomaly Detection Pipeline

```
tickBus() every 5th tick
       ↓
POST /detect/anomaly {speed, delay, passenger_load}
       ↓
anomaly_detector.py
  └─ 6 models vote → ensemble decision
       ↓
  is_anomaly = true?
       ├─ YES → Alert.create({type:'breakdown', severity:'critical'})
       │         io.emit('alert:new')
       │         io.emit('anomaly:detected')
       │         Admin dashboard shows red critical alert
       └─ NO  → reset alertedAnomaly flag (can trigger again next time)
```

---

## Key Numbers for Evaluator

| Metric | Value |
|--------|-------|
| Demand prediction MAPE | ~8.3% |
| Demand prediction R² | ~0.99 |
| Delay prediction MAE | ~1.06 min |
| Delay prediction R² | ~0.95 |
| Anomaly detection F1 | ~0.74 |
| Anomaly detection Recall | ~0.99 |
| OTP improvement vs baseline | 78% vs 62% |
| Average wait reduction | 47% |
| Fleet utilization gain | +18% |
| Demand models loaded | 6 (LSTM/GRU/Transformer/XGB/LGB/RF) |
| Delay models loaded | 6 (XGB/LGB/CatBoost/SVR/MLP/Ensemble) |
| Anomaly models loaded | 6 (IForest/LOF/OCSVM/Autoencoder/DBSCAN/Ensemble) |
| GPS tick interval | 5 seconds |
| Anomaly check interval | 25 seconds (every 5th tick) |
| Weather cache TTL | 30 minutes |
| Passenger load cache TTL | 5 minutes |
| Booking seat assignment | Window/Aisle/Any (4-across W-A-A-W layout) |
| Push notification provider | Expo Push Notification API |
| Auth token lifetime | Access: 15 min, Refresh: 7 days |
| Rate limit | 100 req / 15 min per IP (auth routes) |

---

## Common Evaluator Questions & Answers

**Q: Why use a microservice for AI instead of integrating ML into Node.js?**  
A: Python has a far richer ML ecosystem (TensorFlow, scikit-learn, XGBoost). Node.js ML options (tensorflow.js) are limited and slower. Microservice also allows independent scaling — if AI becomes the bottleneck, we scale it separately without touching the API server.

**Q: How does the genetic algorithm know it found the optimal schedule?**  
A: It doesn't guarantee global optimum — GA finds a near-optimal solution. We use early stopping: if improvement is <0.1% over 20 generations, we stop. In practice this produces schedules that reduce total wait time by 35–47% over uniform headways.

**Q: What happens if the AI service goes down?**  
A: Every AI proxy endpoint has a fallback response (`predicted_count: 50`, `delay: 3 min`, etc.). The system degrades gracefully — buses still track, schedules still display, only predictions become static estimates.

**Q: How is the passenger_load percentage actually computed in real operation?**  
A: When a bus's schedule is `in-progress`, the GPS simulator counts `confirmed + boarded` bookings from the `Booking` collection divided by `bus.capacity`. This is cached per bus for 5 minutes. If no active schedule is found, a peak/off-peak estimate is used.

**Q: Why cyclic encoding for time features?**  
A: Standard integer hour encoding (0–23) creates an artificial discontinuity: model treats hour 23 and hour 0 as 23 units apart, but they're actually adjacent. Encoding as `sin(2πh/24)` and `cos(2πh/24)` maps hours onto a unit circle, preserving temporal proximity.

**Q: How are seats assigned in the booking system?**  
A: When a passenger scans the bus QR, the backend reads all currently `confirmed + boarded` bookings for that schedule to build a `bookedSeats` set. It then iterates through rows (1 to `ceil(capacity/4)`) and 4 columns per row using the W-A-A-W layout. Seat labels are `${row}${W|A|A|W}` (e.g., `1W`, `1A`, `2A`, `2W`). The first N seats not in `bookedSeats` are assigned. Since the passenger is already on the bus, no preference is needed — adjacent seats are auto-clustered.

**Q: Why does the QR code expire after 90 minutes?**  
A: The `expiresAt = now + 90 minutes` prevents passengers from reusing old tickets on a later trip or sharing ticket screenshots with others. The driver's verify-QR endpoint can optionally check this expiry and reject expired tickets.

**Q: How does the fare know what to charge per stop?**  
A: When the passenger scans, the backend fetches the bus's latest `BusPosition` to find the current `nextStage.seq`. For each upcoming stop, it calculates `seqDiff = targetStop.seq − currentSeq`, then `km = seqDiff × 1.5` (approx 1.5 km per stop spacing on Delhi DTC routes). The km is looked up in the DTC slab table and the appropriate fare for the bus type (AC/Non-AC/Electric) is attached to each stop in the response.

**Q: How do you prevent duplicate or conflicting bookings?**  
A: Before assigning seats, the backend queries `Booking.find({schedule, status: 'confirmed|boarded'})` and collects all already-assigned `seatNumbers`. The new seats are only assigned from positions NOT in that set. If the bus is full (all seats taken), the assignment loop returns fewer seats than requested and the booking is rejected.

**Q: How is the driver's rating calculated?**  
A: When a passenger rates a trip, the backend fetches ALL `TripHistory` records for that driver that have a `rating.driver` field, computes the running mean, and updates `Driver.rating`. This is a true cumulative average, not just a session average.
