# SmartDTC: AI-Driven Bus Scheduling System
## Complete System Architecture Documentation

*This document provides comprehensive technical specifications for generating system architecture diagrams and technical illustrations using AI tools like ChatGPT, Gemini, or Perplexity.*

---

## 1. HIGH-LEVEL SYSTEM OVERVIEW

### 1.1 Executive Architecture Diagram

**Use this description with ChatGPT/Gemini to generate the diagram:**

```
Create a system architecture diagram with the following components:

USERS (Left side):
- Passengers (Mobile App Users)
- Drivers (Mobile App Users)
- Admin Staff (Web Dashboard)
- Route Planners (Web Dashboard)

FRONTEND LAYER (Top middle):
- Mobile App (React Native / Expo)
  - Passenger Module (route search, booking, tracking)
  - Driver Module (schedule, GPS tracking, SOS)
  - Connected to Backend via REST API + WebSocket
  
- Web Admin Dashboard (Next.js/React)
  - Schedule management
  - Driver/Bus management
  - Analytics & Reports
  - Connected to Backend via REST API

BACKEND LAYER (Center):
- Express.js REST API Server (Port 5000)
  - Authentication (JWT)
  - Route/Bus/Driver Management
  - Real-time Tracking
  - Notification System
  - Socket.io for Live Updates
  - Rate Limiting & Security (Helmet, CORS, XSS)
  - MongoDB integration

CACHE LAYER:
- Redis Cache (optional)
- Schedule Cache
- Frequently used data cache

DATABASE LAYER:
- MongoDB Atlas (Cloud)
  - Users Collection
  - Buses Collection
  - Routes Collection
  - Schedules Collection
  - Driver Collection
  - Real-time Positions
  - Trip History
  - Alerts & Notifications
  - Analytics Data

AI/ML MICROSERVICE (Right side):
- FastAPI Python Service (Port 8000)
  - Demand Prediction Engine
  - Delay Prediction Engine
  - Anomaly Detection Engine
  - ETA Calculator
  - Schedule Optimizer (Genetic Algorithm)
  - Model Manager

ML MODELS:
- Demand Models (6 ensemble: LSTM, GRU, Transformer, XGBoost, LightGBM, RF)
- Delay Models (6 ensemble: XGBoost, LightGBM, CatBoost, SVR, MLP, Voting)
- Anomaly Models (6 ensemble: Isolation Forest, LOF, One-Class SVM, Autoencoder, DBSCAN)

DATA PIPELINE:
- Dataset Generation
- Feature Engineering
- Data Preprocessing
- Model Training
- Model Evaluation
- Model Versioning

CONNECTIONS:
- All clients → Backend REST API (HTTPS)
- Mobile apps ↔ Backend WebSocket (Socket.io)
- Backend → AI Service (HTTP/gRPC)
- Backend ↔ MongoDB
- Backend ↔ Redis
- AI Service ↔ Model Storage
```

---

## 2. DETAILED COMPONENT SPECIFICATIONS

### 2.1 Mobile Application Architecture

#### Technology Stack:
- **Framework:** React Native / Expo
- **State Management:** Redux Toolkit
- **UI Components:** React Native Paper
- **Navigation:** React Navigation
- **API Client:** Axios + WebSocket
- **Local Storage:** AsyncStorage
- **Offline Support:** Realm Database

#### Passenger Module Structure:
```
Screens:
├── Login/Register
├── Home (Dashboard)
│   ├── Search Routes
│   ├── View Nearby Buses
│   ├── Saved Favorites
│   └── Quick Stats
├── Route Search
│   ├── Source/Destination Input
│   ├── Filter (Time, Cost, Rating)
│   ├── Results Display
│   └── Route Details
├── Booking Flow
│   ├── Seat Selection
│   ├── Passenger Details
│   ├── Payment Gateway
│   └── Confirmation
├── Live Tracking
│   ├── Map View (Google Maps)
│   ├── Bus Position (Real-time)
│   ├── ETA Display
│   ├── Delay Notification
│   └── Alert System
├── My Trips
│   ├── Upcoming Bookings
│   ├── Trip History
│   └── Rating/Reviews
└── Profile
    ├── User Details
    ├── Payment Methods
    ├── Favorites
    └── Settings

API Endpoints Used:
- POST /api/v1/auth/login
- POST /api/v1/auth/register
- GET /api/v1/routes/search
- GET /api/v1/routes/:routeId
- GET /api/v1/buses/:busId/position
- POST /api/v1/bookings
- GET /api/v1/bookings/:bookingId
- WS /socket.io (Real-time tracking)
```

#### Driver Module Structure:
```
Screens:
├── Login/Register
├── Dashboard
│   ├── Today's Trips
│   ├── Current Location
│   ├── Performance Metrics
│   └── Alerts
├── Schedule View
│   ├── Daily Schedule
│   ├── Route Details
│   ├── Pickup/Dropoff Points
│   └── Passenger Count
├── Live Tracking (Passive)
│   ├── Current Route Map
│   ├── Next Stage
│   ├── Estimated Time
│   └── Navigation (Google Maps)
├── Passenger Management
│   ├── Passenger List
│   ├── Pickup Confirmation
│   ├── Dropoff Confirmation
│   └── Feedback
├── Incident Reporting
│   ├── Emergency SOS
│   ├── Route Delay Report
│   ├── Vehicle Issue Report
│   └── Photo/Video Upload
├── Performance
│   ├── Safety Rating
│   ├── Punctuality Score
│   ├── Passenger Feedback
│   └── Monthly Statistics
└── Profile
    ├── Personal Details
    ├── License/Documents
    └── Settings

API Endpoints Used:
- GET /api/v1/schedule/today
- GET /api/v1/schedule/:scheduleId
- GET /api/v1/buses/:busId/position
- POST /api/v1/tracking/update-position
- POST /api/v1/alerts
- PUT /api/v1/drivers/:driverId/rating
- WS /socket.io (Command receive)
```

#### Key Features:
- **Real-time GPS Tracking:** Updates every 10-15 seconds via WebSocket
- **Offline Mode:** Cached data available when offline
- **Push Notifications:** Alert for delays, route changes, bookings
- **Biometric Auth:** Fingerprint/Face recognition support
- **Voice Commands:** Basic voice search integration

---

### 2.2 Web Admin Dashboard Architecture

#### Technology Stack:
- **Framework:** Next.js 14 (React)
- **State Management:** Redux Toolkit
- **UI Library:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts / Chart.js
- **Tables:** TanStack React Table
- **Forms:** React Hook Form + Zod validation
- **API Client:** Axios with interceptors
- **Authentication:** NextAuth.js

#### Admin Modules:
```
Dashboard (Main):
├── KPI Cards
│   ├── Active Buses
│   ├── Total Passengers (Today)
│   ├── System Uptime
│   └── Revenue
├── Real-time Map
│   ├── All Bus Positions
│   ├── Route Status
│   ├── Delay Alerts
│   └── Heatmap (Dense areas)
├── Alert Panel
│   ├── Critical Alerts
│   ├── Delay Warnings
│   ├── System Alerts
│   └── Driver Notifications
└── Quick Actions
    ├── Trigger Optimization
    ├── Emergency Dispatch
    └── System Diagnostics

Bus Management:
├── Bus Inventory
│   ├── List All Buses
│   ├── Add/Edit Bus
│   ├── Status Management
│   └── Maintenance Schedule
├── Bus Details
│   ├── GPS Status
│   ├── Fuel Level
│   ├── Current Driver
│   ├── Assigned Route
│   └── Telemetry Data
└── Fleet Analytics
    ├── Fleet Utilization
    ├── Fuel Consumption
    ├── Maintenance Alerts
    └── Downtime Analysis

Route Management:
├── Route Master
│   ├── List All Routes
│   ├── Add New Route
│   ├── Edit Stages
│   ├── Distance Calculation
│   └── Route Validation
├── Stage Management
│   ├── Stage Details
│   ├── Stop Timing
│   ├── Passenger Capacity
│   └── Priority Levels
└── Route Analytics
    ├── Demand Forecast
    ├── Average Delay
    ├── Passenger Satisfaction
    └── Revenue by Route

Schedule Management:
├── Schedule Creation
│   ├── Create New Schedule
│   ├── Assign Buses/Drivers
│   ├── Time Slot Management
│   ├── Frequency Setting
│   └── AI Optimization (Genetic Algorithm)
├── Schedule View
│   ├── Day View
│   ├── Week View
│   ├── Route View
│   └── Driver View
├── Schedule Optimization
│   ├── Run GA Optimizer
│   ├── View Recommendations
│   ├── Compare Alternatives
│   └── Apply Changes
└── Schedule Conflicts
    ├── Identify Conflicts
    ├── Auto Resolution
    └── Manual Adjustment

Driver Management:
├── Driver Registry
│   ├── Add/Edit Driver
│   ├── Document Management
│   ├── License Verification
│   └── Background Check
├── Driver Performance
│   ├── Punctuality Score
│   ├── Safety Rating
│   ├── Passenger Feedback
│   └── Incident History
├── Attendance
│   ├── Check-in/Check-out
│   ├── Attendance Report
│   ├── Leave Management
│   └── Duty Assignment
└── Driver Development
    ├── Training Programs
    ├── Certification
    └── Performance Improvement Plan

Analytics & Reports:
├── Executive Reports
│   ├── System Overview
│   ├── KPI Dashboard
│   ├── Trend Analysis
│   └── Prediction Dashboard
├── Operational Reports
│   ├── Daily Operations
│   ├── Route Performance
│   ├── Driver Performance
│   └── Delay Analysis
├── Financial Reports
│   ├── Revenue Summary
│   ├── Expense Analysis
│   ├── Profit/Loss
│   └── Budget vs Actual
└── Custom Reports
    ├── Report Builder
    ├── Schedule Reports
    ├── Export (PDF/Excel)
    └── Email Distribution
```

#### Key Features:
- **Real-time Dashboard:** Live updates every 5 seconds
- **Role-based Access:** Admin, Manager, Analyst roles
- **Dark Mode:** Comfortable UI for 24/7 operations
- **Mobile Responsive:** Works on tablets during field work
- **Export Capabilities:** PDF, Excel, CSV
- **Audit Trail:** All actions logged

---

### 2.3 Backend API Architecture

#### Technology Stack:
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **Cache:** Redis (optional)
- **Real-time:** Socket.io
- **Authentication:** JWT + Passport.js
- **Task Scheduling:** node-cron
- **Logging:** Winston
- **Testing:** Jest

#### API Structure:
```
REST API Endpoints (v1):

AUTHENTICATION:
POST   /api/v1/auth/login                  (Credentials) → JWT
POST   /api/v1/auth/register               (User data) → New user
POST   /api/v1/auth/refresh                (Refresh token) → New access token
POST   /api/v1/auth/logout                 (Token) → Revoke
GET    /api/v1/auth/me                     () → Current user
PUT    /api/v1/auth/password               (Old, new) → Update

ROUTES:
GET    /api/v1/routes                      (Filter, paginate) → List
GET    /api/v1/routes/:routeId             () → Details
POST   /api/v1/routes                      (Data) → Create
PUT    /api/v1/routes/:routeId             (Data) → Update
DELETE /api/v1/routes/:routeId             () → Delete
GET    /api/v1/routes/:routeId/demand      (Date, hour) → Demand forecast

BUSES:
GET    /api/v1/buses                       (Status, route) → List
GET    /api/v1/buses/:busId                () → Details
POST   /api/v1/buses                       (Data) → Create
PUT    /api/v1/buses/:busId                (Data) → Update
DELETE /api/v1/buses/:busId                () → Delete
GET    /api/v1/buses/:busId/position       () → Current location
GET    /api/v1/buses/:busId/telemetry      (Date range) → Telemetry data
POST   /api/v1/buses/:busId/maintenance    (Data) → Schedule maintenance

DRIVERS:
GET    /api/v1/drivers                     (Status, route) → List
GET    /api/v1/drivers/:driverId           () → Details
POST   /api/v1/drivers                     (Data) → Create
PUT    /api/v1/drivers/:driverId           (Data) → Update
DELETE /api/v1/drivers/:driverId           () → Delete
GET    /api/v1/drivers/:driverId/rating    () → Performance rating
PUT    /api/v1/drivers/:driverId/rating    (Score) → Update rating

SCHEDULES:
GET    /api/v1/schedule                    (Route, date, time) → List
GET    /api/v1/schedule/:scheduleId        () → Details
POST   /api/v1/schedule                    (Data) → Create
PUT    /api/v1/schedule/:scheduleId        (Data) → Update
DELETE /api/v1/schedule/:scheduleId        () → Delete
POST   /api/v1/schedule/optimize           (Date, routes) → Run GA optimizer
GET    /api/v1/schedule/today              () → Today's schedules

TRACKING:
POST   /api/v1/tracking/update-position    (GPS data) → Update
GET    /api/v1/tracking/:busId/history     (Date range) → History
GET    /api/v1/tracking/live               (Route) → Real-time positions

DEMAND PREDICTIONS:
POST   /api/v1/demand/predict              (Route, date, hour) → Prediction
GET    /api/v1/demand/forecast/:routeId    (Days ahead) → 7-day forecast
POST   /api/v1/demand/compare              (Route, dates) → Compare periods

DELAY PREDICTIONS:
POST   /api/v1/delay/predict               (Route, conditions) → Prediction
GET    /api/v1/delay/trend/:routeId        (Date range) → Historical trend
POST   /api/v1/delay/alert                 (Threshold) → Set alert

ALERTS:
GET    /api/v1/alerts                      (Status, type) → List
GET    /api/v1/alerts/:alertId             () → Details
POST   /api/v1/alerts                      (Data) → Create
PUT    /api/v1/alerts/:alertId             (Status) → Update
DELETE /api/v1/alerts/:alertId             () → Delete

REPORTS:
GET    /api/v1/reports/daily               (Date) → Daily report
GET    /api/v1/reports/weekly              (Week) → Weekly report
GET    /api/v1/reports/monthly             (Month) → Monthly report
GET    /api/v1/reports/route/:routeId      (Date range) → Route report
GET    /api/v1/reports/driver/:driverId    (Date range) → Driver report
POST   /api/v1/reports/export              (Format, type) → Export

ANALYTICS:
GET    /api/v1/analytics/kpi               () → KPI metrics
GET    /api/v1/analytics/heatmap           (Date) → Demand heatmap
GET    /api/v1/analytics/trends            (Period) → Trends
GET    /api/v1/analytics/prediction-accuracy (Model) → Accuracy
```

#### Middleware Stack:
```
Request Flow:
↓
1. CORS Middleware (Allow origins)
   ↓
2. Security Middleware
   - Helmet (Security headers)
   - Rate Limiter (200 req/15min global, 20 for auth)
   - Sanitize (NoSQL injection, XSS, HPP)
   ↓
3. Parsing Middleware
   - JSON parser (10MB limit)
   - Cookie parser
   ↓
4. Logging Middleware (Morgan)
   ↓
5. Authentication Middleware (if protected route)
   - Extract JWT from header
   - Verify token
   - Attach user to request
   ↓
6. Authorization Middleware (Role-based)
   - Check user role
   - Check resource permissions
   ↓
7. Caching Middleware (if enabled)
   - Check Redis cache
   - Return if exists
   ↓
8. Route Handler
   ↓
9. Response Middleware
   - Format response
   - Cache if applicable
   ↓
10. Error Middleware
    - Catch errors
    - Format error response
    - Log errors
    ↓
Response
```

#### Database Schema:
```
Collections in MongoDB:

Users {
  _id: ObjectId,
  email: String (unique),
  passwordHash: String,
  name: String,
  phone: String,
  userType: String (enum: passenger, driver, admin, manager),
  profilePicture: URL,
  address: String,
  city: String,
  preferences: {
    notifications: Boolean,
    language: String,
    theme: String
  },
  createdAt: Date,
  updatedAt: Date
}

Routes {
  _id: ObjectId,
  url_route_id: Number (unique),
  route_name: String,
  start_stage: String,
  end_stage: String,
  distance_km: Number,
  total_stages: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  Index: route_name, start_stage, end_stage (text search)
}

Stages {
  _id: ObjectId,
  route_id: ObjectId (ref: Route),
  stage_name: String,
  sequence: Number,
  latitude: Number,
  longitude: Number,
  estimatedTime: Number (minutes from start),
  capacity: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

Buses {
  _id: ObjectId,
  busNumber: String (unique),
  registrationNo: String (unique),
  model: String,
  capacity: Number (default: 60),
  type: String (enum: AC, non-AC, electric),
  status: String (enum: active, idle, maintenance, retired),
  currentRoute: ObjectId (ref: Route),
  currentDriver: ObjectId (ref: Driver),
  lastPosition: {
    latitude: Number,
    longitude: Number,
    speed: Number,
    timestamp: Date
  },
  fuelLevel: Number (0-100),
  mileage: Number,
  lastService: Date,
  createdAt: Date,
  updatedAt: Date
}

Drivers {
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  licenseNo: String,
  licenseExpiry: Date,
  status: String (enum: active, on-leave, retired),
  currentRoute: ObjectId (ref: Route),
  currentBus: ObjectId (ref: Bus),
  rating: Number (0-5),
  safetyScore: Number,
  punctualityScore: Number,
  tripCount: Number,
  createdAt: Date,
  updatedAt: Date
}

Schedules {
  _id: ObjectId,
  route_id: ObjectId (ref: Route),
  bus_id: ObjectId (ref: Bus),
  driver_id: ObjectId (ref: Driver),
  departureTime: Date,
  estimatedArrival: Date,
  actualArrival: Date,
  status: String (enum: scheduled, in-progress, completed, cancelled),
  occupancy: Number,
  occupancyPercent: Number,
  createdAt: Date,
  updatedAt: Date
}

BusPositions (Time-series) {
  _id: ObjectId,
  bus_id: ObjectId (ref: Bus),
  route_id: ObjectId (ref: Route),
  latitude: Number,
  longitude: Number,
  speed: Number,
  heading: Number,
  timestamp: Date (index),
  createdAt: Date
}

Alerts {
  _id: ObjectId,
  type: String (enum: delay, anomaly, system, maintenance),
  severity: String (enum: low, medium, high, critical),
  title: String,
  description: String,
  related_entity: {
    entity_type: String (bus, route, driver, schedule),
    entity_id: ObjectId
  },
  status: String (enum: open, acknowledged, resolved),
  createdAt: Date,
  updatedAt: Date
}

TripHistory {
  _id: ObjectId,
  schedule_id: ObjectId (ref: Schedule),
  bus_id: ObjectId (ref: Bus),
  driver_id: ObjectId (ref: Driver),
  route_id: ObjectId (ref: Route),
  passenger_count: Number,
  passenger_ids: [ObjectId] (ref: User),
  departureTime: Date,
  arrivalTime: Date,
  delayMinutes: Number,
  anomaliesDetected: [String],
  revenue: Number,
  rating: Number,
  feedback: String,
  createdAt: Date,
  updatedAt: Date
}

Analytics {
  _id: ObjectId,
  metric_type: String (enum: daily, weekly, monthly),
  date: Date,
  route_id: ObjectId (ref: Route),
  total_trips: Number,
  total_passengers: Number,
  average_delay: Number,
  on_time_percentage: Number,
  revenue: Number,
  average_occupancy: Number,
  predictedDemand: Number,
  anomalyCount: Number,
  createdAt: Date
}

AuditLogs {
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  action: String,
  resource_type: String,
  resource_id: String,
  old_values: Object,
  new_values: Object,
  timestamp: Date,
  ip_address: String
}
```

#### Background Jobs (Cron):
```
1. Demand Prediction (Every 1 hour at :00)
   - Fetch schedules for next 24 hours
   - Call AI Service for demand predictions
   - Update schedule occupancy forecast
   - Store predictions in analytics

2. Schedule Optimization (Daily at 22:00)
   - Collect historical data for last 30 days
   - Call Genetic Algorithm optimizer
   - Generate next-day optimization recommendations
   - Store recommendations for review

3. Anomaly Detection (Every 5 minutes)
   - Fetch last batch of real-time positions
   - Call AI Service for anomaly detection
   - Create alerts for anomalies detected
   - Update alert dashboard

4. Analytics Aggregation (Daily at 01:00)
   - Aggregate previous day's metrics
   - Calculate KPIs (on-time %, occupancy, etc.)
   - Store in Analytics collection
   - Generate daily report

5. Delay Monitoring (Every 10 minutes)
   - Check in-progress schedules
   - Compare actual vs scheduled time
   - Predict final delay using AI Service
   - Alert if predicted delay > threshold

6. Data Cleanup (Weekly on Monday at 03:00)
   - Archive old BusPositions (> 90 days)
   - Compress TripHistory (> 1 year)
   - Clean up expired alerts
   - Optimize database indexes
```

#### Real-time Events (Socket.io):
```
Namespaces:

/tracking
├── Emitted by Backend:
│   ├── bus:position (bus_id, lat, lng, speed, timestamp)
│   ├── bus:alert (bus_id, alert_type, severity, message)
│   ├── schedule:update (schedule_id, status, eta, delay)
│   ├── demand:forecast (route_id, predicted_count)
│   └── delay:prediction (schedule_id, predicted_delay, confidence)
│
└── Listened by:
    ├── Mobile App (Passenger) - update map
    ├── Mobile App (Driver) - receive commands
    ├── Web Dashboard - update live board
    └── AI Service - acknowledge predictions

/notifications
├── Emitted by Backend:
│   ├── alert:new (user_id, alert_object)
│   ├── message:new (user_id, message_object)
│   ├── booking:confirmation (user_id, booking_details)
│   ├── trip:update (user_id, trip_status)
│   └── promotion:flash (user_id, promotion_details)
│
└── Listened by:
    ├── Mobile App (Passenger)
    ├── Mobile App (Driver)
    └── Web Dashboard

/admin
├── Emitted by Backend:
│   ├── system:alert (alert_object)
│   ├── system:health (cpu, memory, uptime)
│   ├── analytics:update (metrics_object)
│   └── optimization:result (recommendations)
│
└── Listened by:
    ├── Web Admin Dashboard
    └── Operations Center

/commands
├── Listened by Backend from Admin:
│   ├── schedule:optimize (route_ids, date)
│   ├── alert:dismiss (alert_id)
│   ├── bus:dispatch (bus_id, route_id)
│   └── system:restart
│
└── Emitted by Backend:
    ├── command:acknowledged (status)
    └── command:failed (error)
```

---

### 2.4 AI/ML Microservice Architecture

#### Technology Stack:
- **Framework:** FastAPI (Python)
- **ML Libraries:** TensorFlow/Keras, XGBoost, LightGBM, scikit-learn
- **Data Processing:** Pandas, NumPy, scikit-preprocessing
- **Async:** asyncio, concurrent.futures
- **Logging:** Python logging, Structlog
- **API Docs:** Swagger UI + ReDoc
- **Containerization:** Docker

#### Service Structure:
```
FastAPI Application (Port 8000):

Root Path: http://ai-service:8000

DEMAND PREDICTION ENDPOINTS:
POST   /predict/demand              (Input features) → Demand count + confidence
GET    /forecast/demand/:routeId    (Days ahead) → 7-day forecast
POST   /compare/models/demand       (Data) → All 6 model predictions + comparison

DELAY PREDICTION ENDPOINTS:
POST   /predict/delay               (Input features) → Delay minutes + confidence
GET    /trend/delay/:routeId        (Date range) → Historical delay trend
POST   /alert/delay                 (Threshold) → Set detection threshold

ANOMALY DETECTION ENDPOINTS:
POST   /detect/anomaly              (GPS, speed, load) → Anomaly score + flag
GET    /report/anomalies            (Date range) → Anomaly report
POST   /compare/models/anomaly      (Data) → All 6 model predictions

ETA PREDICTION ENDPOINTS:
POST   /predict/eta                 (Distance, conditions) → ETA minutes + confidence
GET    /breakdown/eta               () → Detailed ETA breakdown

SCHEDULE OPTIMIZATION ENDPOINTS:
POST   /optimize/schedule           (Routes, constraints) → GA recommendations
GET    /recommendations             (Date) → Pending recommendations
POST   /validate/schedule           (Schedule) → Validate feasibility

MODEL MANAGEMENT ENDPOINTS:
GET    /models                      () → List all models with versions
GET    /models/:modelType           () → Model details
POST   /models/:modelType/retrain   () → Trigger retraining
GET    /models/:modelType/metrics   () → Model performance metrics
POST   /models/:modelType/benchmark (Test data) → Benchmark models

HEALTH & MONITORING ENDPOINTS:
GET    /health                      () → Service health
GET    /metrics                     () → Performance metrics
GET    /logs                        (Tail lines) → Recent logs
```

#### Model Architecture:

**Demand Prediction Models:**
```
Input Features (21 total after encoding):
├── Temporal: hour, day_of_week, month, is_weekend, is_holiday
├── Route: route_type (one-hot), distance_km
├── Weather: weather_condition (one-hot), temperature, rainfall
├── Special: special_event, commercial_hub, crowd_level
└── Previous: lag_1, lag_7 (past demand values)

Model 1: LSTM (Keras)
├── Input: (batch, 1, 21)
├── LSTM(128, activation=relu) → BN → Dropout(0.2)
├── LSTM(64, activation=relu) → BN → Dropout(0.2)
├── Dense(32) → ReLU
├── Dense(1) → ReLU (output passengers, non-negative)
├── Loss: MAE
├── Optimizer: Adam(lr=0.001)
├── Epochs: 30, Batch: 32
└── Output: Passenger count

Model 2: GRU (Keras)
├── Architecture: Similar to LSTM
├── GRU(128) → GRU(64) → Dense layers
└── Output: Passenger count

Model 3: Transformer (Keras)
├── Multi-head attention layer
├── Feed-forward network
├── Position encoding
└── Output: Passenger count

Model 4: XGBoost
├── Parameters: max_depth=6, learning_rate=0.05, n_estimators=500
├── Tree method: hist (GPU-accelerated if available)
├── Loss: reg:squarederror
└── Output: Passenger count

Model 5: LightGBM
├── Parameters: max_depth=6, learning_rate=0.05, n_estimators=500
├── Objective: regression
├── Metric: mae
└── Output: Passenger count

Model 6: Random Forest (Ensemble)
├── n_estimators: 200
├── max_depth: 15
├── min_samples_split: 5
└── Output: Passenger count

Ensemble Strategy:
- Weighted Average: LSTM(0.2) + GRU(0.2) + Transformer(0.1) + XGBoost(0.2) + LightGBM(0.2) + RF(0.1)
- Final output: Rounded integer passenger count
- Confidence: Average R² score of top 3 models
```

**Delay Prediction Models:**
```
Input Features (16 total):
├── Temporal: hour, day_of_week, is_weekend, is_holiday
├── Route: route_distance_km, num_stops
├── Traffic: weather_condition, traffic_level, time_of_day
├── Bus: bus_age_years, capacity_utilization
├── Operator: driver_experience, day_number_in_month
└── Previous: lag_1_delay, lag_7_delay

Model 1: XGBoost
├── max_depth=6, learning_rate=0.05, n_estimators=500
├── Output: Delay in minutes
└── Can be negative (early) or positive (late)

Model 2: LightGBM
├── Parameters similar to XGBoost
└── Output: Delay minutes

Model 3: CatBoost
├── Handles categorical features natively
├── depth=6, iterations=500, learning_rate=0.05
└── Output: Delay minutes

Model 4: SVR (Support Vector Regression)
├── Kernel: rbf
├── C=1.0, epsilon=0.1
├── Normalized features
└── Output: Delay minutes

Model 5: MLP (Keras)
├── Input: (batch, 16)
├── Dense(128) → ReLU → Dropout(0.2)
├── Dense(64) → ReLU → Dropout(0.2)
├── Dense(32) → ReLU
├── Dense(1) → Output (can be negative)
├── Loss: MAE
└── Output: Delay minutes

Model 6: Ensemble Voting
├── Combines XGBoost, LightGBM, CatBoost, SVR, MLP
├── Average predictions
├── Confidence: Std dev of predictions (lower = higher confidence)
└── Output: Delay minutes + confidence interval
```

**Anomaly Detection Models:**
```
Input Features (10 total):
├── GPS: latitude, longitude, speed_kmh
├── Movement: heading, acceleration
├── Bus: passenger_load_pct, capacity_util
├── Context: hour, day_of_week, route_id
└── Previous: is_delayed, anomaly_flag_prev

Anomalies Detected:
- GPS spoofing (sudden large position jumps)
- Excessive speeding (> 100 km/h)
- Harsh acceleration/deceleration
- Route deviation (> 500m from planned route)
- Stalled vehicle (speed = 0 for > 5 min)
- Unusual passenger load changes

Model 1: Isolation Forest
├── n_estimators: 100
├── contamination: 0.05 (5% assumed anomalies)
├── random_state: 42
└── Anomaly score: -1 (anomaly) or 1 (normal)

Model 2: LOF (Local Outlier Factor)
├── n_neighbors: 20
├── contamination: 0.05
├── Anomaly detection based on local density
└── Score: Anomaly or Normal

Model 3: One-Class SVM
├── Kernel: rbf
├── gamma: auto
├── nu: 0.05 (expected outlier fraction)
└── Learns boundary of normal data

Model 4: Autoencoder (Keras)
├── Encoder: Dense(10)→5→3→2 (compress)
├── Decoder: Dense(2)→3→5→10 (reconstruct)
├── Loss: MSE
├── Threshold: Reconstruction error > 95th percentile
└── Anomaly score: Reconstruction error

Model 5: DBSCAN (Density-Based Clustering)
├── eps: 0.5
├── min_samples: 5
├── Clusters normal data
├── Points not in clusters are anomalies
└── Works on normalized features

Model 6: Ensemble Voting
├── Combines all 5 models
├── Anomaly if majority vote = anomaly
├── Score: Fraction of models detecting anomaly
└── Confidence: Consensus score
```

**Schedule Optimization (Genetic Algorithm):**
```
Problem: Assign N buses/drivers to M routes to minimize:
- Total passenger dissatisfaction (unmet demand)
- Total delay cost
- Schedule conflicts
- Driver/bus overutilization

Chromosome Representation:
├── Each gene: (route_id, bus_id, driver_id, departure_time)
├── Population size: 50 chromosomes
└── Total genes: M routes

Fitness Function:
├── Calculate expected demand (using demand model)
├── Calculate expected delay (using delay model)
├── Calculate occupancy violations
├── Calculate driver fatigue (hours worked)
├── Score: -(total_unmet_demand + delay_cost + violations + fatigue)
└── Maximize fitness (minimize cost)

Genetic Operators:
1. Selection: Tournament selection (tournament_size=3)
2. Crossover: Single-point crossover (crossing_probability=0.8)
3. Mutation: Random gene mutation (mutation_rate=0.1)
4. Elitism: Keep top 5% of population

Evolution:
├── Generations: 100
├── Convergence: Stop if no improvement for 20 generations
├── Output: Best schedule + recommendations
└── Confidence: Fitness score of best solution

Constraints:
├── Bus availability (not double-booked)
├── Driver working hours (≤ 10 hours/day)
├── Route feasibility (distance/time combinations)
├── Maintenance windows
└── Driver/bus assignments (same person/vehicle all day)
```

#### Data Pipeline:
```
Stage 1: Data Generation / Ingestion
├── Load raw data from MongoDB
├── CSV datasets for training
├── Real-time tracking data
└── API calls from Backend

Stage 2: Preprocessing
├── Handle missing values (forward fill, interpolation)
├── Remove outliers (IQR method)
├── Date standardization
└── Timezone handling

Stage 3: Feature Engineering
├── Temporal features: Extract hour, day, month, is_weekend
├── Lag features: Previous 1, 7 day values
├── One-hot encoding: Route type, weather, crowd level
├── Normalization: StandardScaler (fitted on training data)
├── Feature selection: Keep 16-21 most important features
└── Data type conversion: np.float32 for memory efficiency

Stage 4: Train/Test Split
├── Temporal split (no shuffle):
│   ├── 80% data for training
│   ├── 20% data for testing
│   └── Date range: Not random, sequential
├── Rationale: Preserve time-series integrity
└── Validation: 10% of training for validation

Stage 5: Model Training
├── Individual model training
├── Hyperparameter tuning (if enabled)
├── Cross-validation (5-fold)
├── Early stopping (if applicable)
└── Model versioning (save with timestamp)

Stage 6: Evaluation
├── Metrics:
│   ├── Demand: MAE, RMSE, MAPE (masked), R²
│   ├── Delay: MAE, RMSE, R²
│   └── Anomaly: Precision, Recall, F1, ROC-AUC
├── Comparison charts
├── Performance reports (JSON + PNG)
└── Best model selection

Stage 7: Model Persistence
├── Format: .keras for TensorFlow, .pkl for others
├── Location: /models/saved/{model_type}/{version}/
├── Scaler: Saved with model (for prediction normalization)
├── Metadata: Model info, training date, metrics
└── Versioning: By timestamp

Stage 8: Deployment
├── Load models into memory (on service startup)
├── Preprocess prediction inputs
├── Run inference
├── Post-process outputs
└── Return predictions via API
```

#### Key ML Features:
```
1. Multi-model Ensemble
   - Combines 6 demand models for robust predictions
   - Weighted averaging based on historical accuracy
   - Confidence scores from model agreement

2. Adaptive Learning
   - Periodic retraining (daily/weekly)
   - Feedback loop from actual vs predicted
   - Model performance tracking

3. Gradient Boosting
   - XGBoost/LightGBM for speed (tree-based)
   - Handles non-linear relationships
   - Feature importance tracking

4. Deep Learning
   - LSTM for temporal dependencies
   - Better captures demand patterns over time
   - Autoencoder for anomaly reconstruction

5. Rule-based Fallback
   - When ML confidence < threshold
   - Heuristic-based predictions
   - Ensures always providing output

6. Resource Optimization
   - Designed for free Google Colab
   - Monolithic training split into modular cells
   - Memory cleanup between trainings
   - Batch processing for efficiency
```

---

## 3. DATA FLOW ARCHITECTURE

### 3.1 Passenger Booking Flow

```
1. SEARCH PHASE:
   Passenger → Search(source, dest, date, time)
   → Backend.GET /api/v1/routes/search
   → Query MongoDB (Routes + Stages)
   → Return matching routes + schedules
   
2. DEMAND ENRICHMENT:
   Backend → AI Service.POST /predict/demand
   ← Return predicted passenger count
   → Show "Likely Crowded/Moderate/Empty" to passenger
   
3. DELAY PREDICTION:
   Backend → AI Service.POST /predict/delay
   ← Return predicted delay minutes
   → Show expected arrival time to passenger
   
4. BOOKING:
   Passenger → Booking(route, schedule, seats, payment)
   → Backend.POST /api/v1/bookings
   → Validate: seat availability, payment
   → Create booking record
   → Emit Socket.io event: booking:confirmation
   → Return booking confirmation
   
5. REAL-TIME TRACKING:
   Bus → Update GPS every 10s
   → Backend.POST /api/v1/tracking/update-position
   → Store in BusPositions (MongoDB)
   → Emit Socket.io: bus:position
   → Mobile App receives → Update map in real-time
   
6. ANOMALY CHECK:
   Backend (on GPS update)
   → AI Service.POST /detect/anomaly
   ← Return anomaly score
   → If anomaly detected: Create alert
   
7. DELAY MONITORING:
   Backend (every 10 min) → Compare actual vs scheduled time
   → AI Service.POST /predict/delay (updated conditions)
   ← Final predicted delay
   → If delay > threshold: Emit Socket.io: alert:new
   → Push notification to affected passengers
```

### 3.2 Admin Schedule Optimization Flow

```
1. TRIGGER OPTIMIZATION:
   Admin → Dashboard "Optimize Schedule" button
   → Backend.POST /api/v1/schedule/optimize
   
2. DATA COLLECTION:
   Backend → Query last 30 days of data from MongoDB
   ├── Routes, Buses, Drivers
   ├── Historical demand (TripHistory)
   ├── Historical delays (TripHistory)
   ├── Current capacity/availability
   └── Constraints (driver hours, maintenance)
   
3. AI OPTIMIZATION:
   Backend → AI Service.POST /optimize/schedule
   ├── Input: Routes, constraints, historical data
   ├── Runs: Genetic Algorithm (100 generations)
   ├── Output: Optimized schedule + recommendations
   ← Return recommendations
   
4. RECOMMENDATIONS DISPLAY:
   Backend → Store in MongoDB (Recommendations collection)
   → Emit Socket.io: optimization:result
   → Web Dashboard displays:
      ├── Cost savings vs current schedule
      ├── Expected delay reduction
      ├── Demand fulfillment improvement
      ├── Driver/bus utilization
      └── Change summary
   
5. ADMIN REVIEW:
   Admin → Compares current vs recommended schedule
   → Can drill into specific changes
   → Can customize recommendations
   → Or request another optimization with different constraints
   
6. APPLY CHANGES:
   Admin → "Apply Recommendations" button
   → Backend.PUT /api/v1/schedule (batch update)
   → Update all affected schedules
   → Update Bus, Driver assignments
   → Emit Socket.io: schedule:update to all clients
   → Mobile apps receive updated schedule
   → Confirmation to admin dashboard
```

### 3.3 Real-time Tracking Pipeline

```
Driver's Mobile App:
├── GPS location update (every 10 seconds)
├── Speed, heading
├── Timestamp
└── Bus ID

↓ Sends to Backend

Backend Receives:
├── Validate GPS coordinates (within city bounds)
├── Check for spoofing (previous position reasonable?)
├── Create BusPosition record
└── Update Bus.lastPosition

↓ Store in MongoDB

BusPositions Collection (Time-series):
├── bus_id, latitude, longitude, speed
├── timestamp (indexed for quick queries)
└── route_id (for filtering)

↓ Real-time Processing

Anomaly Detection (every update):
├── Backend → AI Service.POST /detect/anomaly
│  ├── Input: GPS, speed, acceleration, load
│  └── Output: anomaly_score, is_anomaly
├── If is_anomaly = True:
│  ├── Create Alert in MongoDB
│  ├── Emit Socket.io: bus:alert
│  ├── Notify admin dashboard
│  └── Alert driver (if critical)
└── Store anomaly in TripHistory

↓ Broadcast to Clients

Socket.io Namespace: /tracking
├── Event: bus:position
├── Data: {bus_id, lat, lng, speed, timestamp}
├── Listeners:
│  ├── Mobile App (Passenger) → Update map
│  ├── Mobile App (Driver) → Receive command if needed
│  └── Web Dashboard (Admin) → Live fleet view

↓ Caching

Redis Cache (if enabled):
├── Key: bus:{bus_id}:position
├── Value: {lat, lng, speed, timestamp}
├── TTL: 1 minute (auto-expire)
└── Used for: Instant retrieval on dashboard load

↓ Analytics

Every hour:
├── Aggregate positions for each bus
├── Calculate: average speed, total distance, stops
├── Store in Analytics collection
└── Update dashboard metrics
```

### 3.4 Demand/Delay Prediction Pipeline

```
Scheduled Job (every hour at :00):
├── Query routes for next 24 hours (schedules)
└── For each schedule:
    ├── Extract features:
    │  ├── Route features (distance, stages)
    │  ├── Temporal features (hour, day, is_holiday)
    │  ├── Weather forecast (from API or static)
    │  ├── Historical data (lag features, trends)
    │  └── Special events (if any)
    │
    ├── Normalize features (using saved scaler)
    │
    ├── Demand Prediction:
    │  ├── Backend → AI Service.POST /predict/demand
    │  ├── Models ensemble:
    │  │  ├── LSTM: Neural network time-series
    │  │  ├── XGBoost: Tree-based
    │  │  ├── LightGBM: Fast gradient boosting
    │  │  ├── Random Forest: Stable ensemble
    │  │  └── Weighted average of all
    │  ├── Output: predicted_passenger_count, confidence
    │  └── Update Schedule.occupancyForecast
    │
    ├── Delay Prediction:
    │  ├── Backend → AI Service.POST /predict/delay
    │  ├── Models ensemble:
    │  │  ├── XGBoost: Main predictor
    │  │  ├── LightGBM: Fast alternative
    │  │  ├── CatBoost: Categorical handler
    │  │  └── MLP: Neural backup
    │  ├── Output: predicted_delay_minutes, confidence
    │  └── Update Schedule.predictedDelay
    │
    ├── Store Predictions:
    │  ├── MongoDB: Analytics.demand_forecast
    │  ├── MongoDB: Analytics.delay_forecast
    │  └── Redis Cache (TTL: 24 hours)
    │
    ├── Emit Updates:
    │  ├── Socket.io: demand:forecast
    │  ├── Socket.io: delay:prediction
    │  └── Dashboard: Refresh prediction widgets
    │
    └── Passenger Notifications:
       ├── If predicted delay > 15 min AND passenger booked:
       │  ├── Push notification: "Your bus may be delayed by X min"
       │  ├── Mobile app: Show updated ETA
       │  └── Suggest alternative routes (if available)
       └── If demand > 120% capacity:
          ├── Push notification: "Bus likely to be crowded"
          └── Suggest adjacent time slot

Fallback Logic:
├── If AI service unavailable:
│  ├── Use previous predictions (cached)
│  ├── Or use rule-based heuristics
│  └── Log error for monitoring
└── If prediction confidence < 0.5:
   ├── Use ensemble of all 6 models
   ├── Or fall back to rule-based
   └── Alert admin for model retraining
```

---

## 4. SYSTEM INTEGRATION FLOWS

### 4.1 End-to-End Passenger Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PASSENGER JOURNEY MAP                               │
└─────────────────────────────────────────────────────────────────────────────┘

STAGE 1: DISCOVERY
├─ Passenger opens mobile app
├─ Backend: GET /api/v1/auth/me (verify token)
├─ Backend: GET /api/v1/routes (all available)
├─ AI Service: /predict/demand for each route
├─ App displays: Routes with occupancy forecast
└─ Passenger satisfaction: Easy to find routes

STAGE 2: SEARCH & COMPARE
├─ Passenger: Enter source, destination, date, time
├─ Backend: GET /api/v1/routes/search (MongoDB query)
├─ Backend: GET /api/v1/schedule (filter by time)
├─ AI Service: /predict/demand, /predict/delay for each option
├─ App displays: 3-5 best routes with:
│  ├─ Journey time
│  ├─ Predicted passengers (crowd level)
│  ├─ Predicted delay
│  ├─ Cost
│  └─ Rating
└─ Passenger decision: Choose preferred route

STAGE 3: BOOKING
├─ Passenger selects route/time
├─ Backend: GET /api/v1/buses/:busId/position (current status)
├─ Backend: GET /api/v1/schedule/:scheduleId (seats available)
├─ App displays: Seat map with availability
├─ Passenger: Select seats, enter details
├─ Backend: POST /api/v1/bookings (create booking)
├─ Payment gateway: Process payment
├─ Backend: Update Schedule.occupancy
├─ Backend: POST notification (booking confirmation)
└─ Passenger receives: Booking confirmation + ticket number

STAGE 4: PRE-JOURNEY
├─ Day before departure:
│  ├─ Backend Cron: Demand prediction job runs
│  ├─ AI Service: Predicts next day demand
│  └─ Backend: Sends reminder notification
├─ 2 hours before departure:
│  ├─ Backend Cron: Delay prediction job runs
│  ├─ AI Service: Predicts delays
│  ├─ If delay > 15 min: Sends alert
│  └─ App updates: Expected arrival time
└─ 30 min before: Reminder notification sent

STAGE 5: JOURNEY
├─ Passenger opens app
├─ Backend: GET /api/v1/buses/:busId/position (real-time)
├─ Socket.io: /tracking → Real-time bus position
├─ App displays: Live map with bus approaching
├─ AI Service: Continuous anomaly detection on GPS
│  ├─ If anomaly detected: Sends safety alert
│  └─ Unusual speed/behavior flagged
├─ Passenger: See live ETA, tracking, alerts
└─ Passenger experience: Full visibility of journey

STAGE 6: IN-BUS
├─ Driver: Board passengers at stage
├─ Backend: GPS update every 10 seconds
├─ App: Live tracking continues
├─ If delay: Notification sent "Delayed by X minutes"
├─ Passenger: Can message driver/support
└─ Driver: View passenger count, next stops

STAGE 7: COMPLETION
├─ Bus arrives at destination stage
├─ Driver: Mark passenger as dropped-off
├─ Backend: PUT /api/v1/bookings (mark completed)
├─ Backend: Create TripHistory record
├─ Backend: Store analytics (delay actual, demand actual)
├─ AI Service: Receives actual data (for feedback loop)
├─ Passenger: Rating/review screen appears
├─ Passenger: Provide feedback (optional)
└─ Backend: Store rating in TripHistory

STAGE 8: POST-JOURNEY
├─ Backend: Email receipt + invoice
├─ Backend: Update driver rating from passenger feedback
├─ AI: Use actual data to improve future predictions
├─ Analytics: Aggregate trip data
├─ If issue reported: Create support ticket
└─ Passenger journey complete ✓
```

### 4.2 AI Model Prediction Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI SERVICE PREDICTION PIPELINE                            │
└─────────────────────────────────────────────────────────────────────────────┘

INPUT REQUEST (from Backend):
```json
{
  "prediction_type": "demand",
  "route_id": "route_123",
  "date": "2026-04-20",
  "hour": 8,
  "is_weekend": false,
  "is_holiday": false,
  "weather": "rain",
  "temperature": 32,
  "special_event": false
}
```

↓

FEATURE PREPARATION:
├─ Raw features extracted from request
├─ Temporal features calculated:
│  ├─ hour = 8
│  ├─ day_of_week = 0 (Monday)
│  ├─ month = 4
│  └─ is_weekend = 0 (boolean encoded)
├─ Categorical encoding:
│  ├─ weather = "rain" → [0, 1, 0, 0] (one-hot)
│  └─ route_type → One-hot encoded
├─ Feature normalization:
│  ├─ Using saved scaler (fitted on training data)
│  ├─ temperature = (32 - mean) / std
│  └─ Convert to np.float32
└─ Final feature vector: [8, 0, 4, 0, [0,1,0,0], -0.52, ...]

↓

ENSEMBLE PREDICTION:
├─ LSTM Model (TensorFlow):
│  ├─ Load from: /models/saved/demand_lstm/model.keras
│  ├─ Reshape input: (1, 1, 21)
│  ├─ Forward pass: LSTM → Dense layers
│  ├─ Output: 45.3 passengers
│  └─ Time: 50ms
├─ GRU Model:
│  ├─ Load from: /models/saved/demand_gru/model.keras
│  ├─ Output: 43.8 passengers
│  └─ Time: 40ms
├─ XGBoost Model:
│  ├─ Load from: /models/saved/demand_xgboost/model.pkl
│  ├─ Predict: 44.1 passengers
│  └─ Time: 5ms
├─ LightGBM Model:
│  ├─ Load from: /models/saved/demand_lightgbm/model.pkl
│  ├─ Predict: 44.5 passengers
│  └─ Time: 3ms
├─ Random Forest Model:
│  ├─ Load from: /models/saved/demand_rf/model.pkl
│  ├─ Predict: 42.9 passengers
│  └─ Time: 10ms
└─ Weighted Ensemble:
   ├─ LSTM(0.2) × 45.3 = 9.06
   ├─ GRU(0.2) × 43.8 = 8.76
   ├─ Transformer(0.1) × 44.5 = 4.45
   ├─ XGBoost(0.2) × 44.1 = 8.82
   ├─ LightGBM(0.2) × 44.5 = 8.90
   ├─ RF(0.1) × 42.9 = 4.29
   └─ Total = 44.3 passengers

↓

POST-PROCESSING:
├─ Round to integer: 44 passengers
├─ Clamp to valid range: [0, bus_capacity]
├─ Calculate confidence:
│  ├─ Standard deviation of 6 predictions: 1.2
│  ├─ Confidence = 1 - (std / mean) = 1 - (1.2/44.3) = 0.97 (97%)
│  └─ If confidence > 0.8: HIGH, else MEDIUM/LOW
├─ Generate crowd level:
│  ├─ < 30 passengers = "Low"
│  ├─ 30-60 passengers = "Medium"
│  ├─ 60-90 passengers = "High"
│  └─ > 90 passengers = "Critical"
└─ Create breakdown:
   ```json
   {
     "lstm_pred": 45.3,
     "gru_pred": 43.8,
     "xgb_pred": 44.1,
     "lgb_pred": 44.5,
     "rf_pred": 42.9,
     "ensemble_pred": 44.3
   }
   ```

↓

OUTPUT RESPONSE:
```json
{
  "route_id": "route_123",
  "date": "2026-04-20",
  "hour": 8,
  "predicted_count": 44,
  "crowd_level": "Medium",
  "confidence": 0.97,
  "confidence_level": "HIGH",
  "breakdown": {
    "lstm": 45.3,
    "gru": 43.8,
    "xgboost": 44.1,
    "lightgbm": 44.5,
    "random_forest": 42.9
  },
  "occupancy_percent": 73,
  "seats_available": 16,
  "recommendations": "Seats available. Medium crowd expected.",
  "model_used": "Ensemble (6 models)",
  "processing_time_ms": 120
}
```

↓

BACKEND RECEIVES & STORES:
├─ Update Schedule.occupancyForecast = 44
├─ Update Schedule.occupancyPercent = 73
├─ Cache in Redis (TTL: 24 hours)
├─ Store in MongoDB.Analytics
└─ Broadcast to Dashboard via Socket.io

↓

PASSENGER APP DISPLAYS:
```
Route: A → B (8:00 AM)
🚌 Bus Occupancy: ████████░░ 73%
👥 Predicted Passengers: 44
Crowd Level: 🟡 MEDIUM (comfortable)
Available Seats: 16
Confidence: 97% (HIGH)
```
```

---

## 5. DEPLOYMENT & INFRASTRUCTURE

### 5.1 Docker Deployment Architecture

```dockerfile
# docker-compose.yml structure:

services:
  ├─ mongodb
  │  ├─ Image: mongo:7.0
  │  ├─ Port: 27017
  │  ├─ Data Volume: /data/db
  │  └─ Network: internal
  │
  ├─ redis
  │  ├─ Image: redis:7-alpine
  │  ├─ Port: 6379
  │  ├─ Volume: /data
  │  └─ Network: internal
  │
  ├─ backend
  │  ├─ Build: ./backend/Dockerfile
  │  ├─ Port: 5000
  │  ├─ Environment: NODE_ENV=production, DB_URL, REDIS_URL
  │  ├─ Depends: mongodb, redis
  │  ├─ Volume: ./logs (persistent)
  │  ├─ Networks: internal, external
  │  └─ Health check: GET /health
  │
  ├─ ai-service
  │  ├─ Build: ./ai-service/Dockerfile
  │  ├─ Port: 8000
  │  ├─ Environment: ML_MODEL_PATH, WORKERS=4
  │  ├─ Volume: ./models (shared)
  │  ├─ Networks: internal
  │  ├─ GPU: (if available)
  │  └─ Health check: GET /health
  │
  ├─ frontend
  │  ├─ Build: ./frontend/Dockerfile
  │  ├─ Port: 3000
  │  ├─ Build args: NEXT_PUBLIC_API_URL=http://backend:5000
  │  ├─ Networks: external
  │  └─ Nginx reverse proxy
  │
  └─ mobile
     └─ Deployed separately (Expo/Firebase)

Networks:
├─ internal: Backend, AI, MongoDB, Redis (not exposed)
└─ external: Frontend, Backend (exposed to public)

Volumes:
├─ mongo_data: MongoDB persistence
├─ redis_data: Redis persistence
├─ ai_models: Shared model storage
└─ logs: Backend logging
```

### 5.2 Cloud Deployment Options

**Option 1: Google Cloud Run (Recommended for Startup)**
```
├─ Backend: Cloud Run service
│  ├─ Auto-scaling (0-100 instances)
│  ├─ Pay-per-request pricing
│  ├─ Connects to Cloud SQL (PostgreSQL/MySQL)
│  └─ Cost: $0.00002 per request
│
├─ AI Service: Cloud Run service
│  ├─ GPU support available (for inference)
│  ├─ Allocated CPU: 4 cores
│  └─ Memory: 8GB
│
├─ Frontend: Firebase Hosting
│  ├─ Static hosting for Next.js
│  ├─ CDN included
│  └─ Free tier available
│
├─ Database: Cloud SQL
│  ├─ MongoDB Atlas or Cloud SQL with MongoDB
│  ├─ Auto backup
│  └─ Cost: $0.1/hour (min)
│
├─ Cache: Cloud Memorystore
│  ├─ Redis managed service
│  └─ Cost: $0.12/GB/hour
│
└─ Storage: Cloud Storage
   ├─ Model files
   ├─ Backup data
   └─ Cost: $0.02/GB/month
```

**Option 2: AWS (Scalable Production)**
```
├─ Backend: ECS/Fargate or Lambda
├─ AI Service: SageMaker (managed ML inference)
├─ Frontend: CloudFront + S3
├─ Database: DynamoDB or RDS (MongoDB Atlas)
├─ Cache: ElastiCache (Redis)
├─ Storage: S3
└─ Monitoring: CloudWatch
```

**Option 3: Render/Railway (Simple Startup)**
```
├─ Backend: Render Web Service
├─ AI Service: Render Web Service
├─ Frontend: Render Static Site
├─ Database: Render PostgreSQL / MongoDB Atlas
├─ Cost: $7-15/month per service
└─ Easy deployment from GitHub
```

---

## 6. TECHNICAL SPECIFICATIONS FOR DIAGRAM GENERATION

### 6.1 Using ChatGPT/Gemini to Generate Diagrams

**Prompt Template 1: System Architecture Diagram**
```
Create a detailed system architecture diagram for SmartDTC bus management system with:

COMPONENTS:
1. Client Layer:
   - Mobile app for passengers
   - Mobile app for drivers
   - Web admin dashboard
   
2. API Gateway & Backend:
   - Express.js REST API
   - Socket.io for real-time
   - JWT authentication
   
3. Microservices:
   - AI/ML FastAPI service
   - Demand prediction
   - Delay prediction
   - Anomaly detection
   - Schedule optimization (GA)
   
4. Data Layer:
   - MongoDB (users, routes, schedules)
   - Redis cache
   - Time-series data store
   
5. External Services:
   - Google Maps API
   - Payment gateway
   - Push notification service
   
6. Infrastructure:
   - Docker containers
   - Kubernetes orchestration
   - CDN for frontend
   - Cloud storage

CONNECTIONS:
- Show data flow between components
- Show API calls (REST/WebSocket)
- Show database connections
- Show caching layer
- Color code: Blue=API, Green=DB, Orange=ML, Purple=Frontend

DIAGRAM STYLE:
- Professional tech stack diagram
- Include icons for each technology
- Show synchronous and asynchronous flows
- Add labels for all connections
```

**Prompt Template 2: Data Pipeline Diagram**
```
Create a data pipeline architecture diagram showing:

STAGES:
1. Data Ingestion:
   - Real-time GPS tracking
   - User bookings
   - Schedule data
   - Weather API

2. Data Preprocessing:
   - Validation & cleaning
   - Feature engineering
   - Temporal aggregation
   - Anomaly removal

3. Feature Store:
   - Normalized data
   - Encoded features
   - Scaled inputs
   - Lagged features

4. ML Training:
   - 6 demand models training in parallel
   - 6 delay models training in parallel
   - 6 anomaly models training in parallel

5. Model Evaluation:
   - Cross-validation
   - Performance metrics
   - Model comparison
   - Ensemble selection

6. Model Deployment:
   - Model registry
   - Version control
   - A/B testing
   - Production serving

7. Inference:
   - Real-time predictions
   - Batch predictions
   - Caching predictions
   - Feedback loop

SHOW:
- Parallel processing paths
- Data transformations
- Model training loops
- Feedback mechanisms
- Caching points
```

**Prompt Template 3: User Journey Diagram**
```
Create a detailed user journey map with swimlanes for:

PASSENGERS:
1. Search route
2. View demand/delay predictions
3. Book seat
4. Pay
5. Real-time tracking
6. Complete trip
7. Rate/review

DRIVERS:
1. Login
2. View today's schedule
3. Start trip
4. GPS tracking (continuous)
5. Passenger management
6. Report incidents
7. End trip

ADMIN:
1. Dashboard view
2. Trigger optimization
3. Review recommendations
4. Approve changes
5. Monitor alerts
6. Generate reports

BACKEND (Hidden Layer):
- API calls for each step
- Database updates
- AI predictions
- Real-time broadcasts

SHOW:
- Timeline for each user
- Parallel processes
- Decision points
- System interactions
- Wait times
- Success/failure paths
```

### 6.2 Using Perplexity for Deep Technical Diagrams

```
"Generate a technical deep-dive diagram showing the machine learning ensemble architecture for demand prediction:

LEFT SIDE - INPUT FEATURES:
├─ Temporal (hour, day_of_week, is_holiday)
├─ Route (type, distance, stages)
├─ Weather (condition, temperature, rainfall)
├─ Special (events, commercial_hub, crowd_level)
└─ Historical (lag_1, lag_7 demand values)

CENTER - 6 PARALLEL MODELS:
├─ LSTM Network (TensorFlow)
│  ├─ Input layer (21 features)
│  ├─ LSTM(128) + Dropout
│  ├─ LSTM(64) + Dropout
│  └─ Output: float prediction
│
├─ GRU Network (Similar to LSTM)
├─ Transformer Network (Self-attention)
├─ XGBoost (500 trees, depth=6)
├─ LightGBM (500 trees, depth=6)
└─ Random Forest (200 trees, depth=15)

RIGHT SIDE - ENSEMBLE MECHANISM:
├─ Model outputs: 6 predictions
├─ Weighted average: LSTM(0.2) + GRU(0.2) + Transformer(0.1) + XGBoost(0.2) + LightGBM(0.2) + RF(0.1)
├─ Post-processing: Round, clamp, confidence
└─ Final output: Passenger count + confidence score

SHOW:
- Each model's internal architecture
- Feature transformations
- Parallel execution
- Ensemble voting
- Confidence calculation
- Output formatting
"
```

---

## 7. KEY METRICS & MONITORING

### 7.1 System Performance KPIs

```
DEMAND PREDICTION:
├─ Accuracy Metrics:
│  ├─ MAE (Mean Absolute Error): < 5 passengers
│  ├─ RMSE (Root Mean Squared Error): < 8
│  ├─ MAPE (Mean Absolute Percentage Error): < 15%
│  └─ R² Score: > 0.85
├─ Model Performance Tracking:
│  ├─ 7-day average accuracy trend
│  ├─ Worst-case error
│  ├─ Seasonal accuracy variations
│  └─ Model-wise comparison
└─ System Health:
   ├─ Prediction latency: < 200ms
   ├─ Availability: > 99.5%
   └─ False negative rate: < 5%

DELAY PREDICTION:
├─ Accuracy: MAE < 3 minutes, R² > 0.80
├─ Timeliness: Predictions 30+ min before scheduled
├─ Coverage: Applies to 95% of trips
└─ Alert precision: True positive rate > 85%

ANOMALY DETECTION:
├─ Precision: > 0.90 (few false alarms)
├─ Recall: > 0.80 (catch most anomalies)
├─ F1 Score: > 0.85
├─ Response time: < 100ms
└─ Alert handling: 95% within 5 min

SYSTEM UPTIME:
├─ Backend API: 99.9% uptime SLA
├─ AI Service: 99.5% uptime SLA
├─ Database: 99.99% uptime SLA
├─ Mobile app: 99% crash-free rate
└─ Real-time tracking: 99% GPS accuracy > 10m
```

### 7.2 Business KPIs

```
OPERATIONAL:
├─ On-time percentage: Target 95%
├─ Average delay: Target < 5 minutes
├─ Fleet utilization: Target > 75%
├─ Cost per km: Trend down 10% YoY
└─ Fuel efficiency: Improve 15% with optimization

REVENUE:
├─ Booking completion rate: > 80%
├─ Average booking value: Track monthly
├─ Repeat passenger rate: Target > 60%
├─ Revenue per bus per day: Track trend
└─ Cost per prediction: < $0.0001

QUALITY:
├─ Passenger satisfaction: Target 4.5/5 stars
├─ Driver performance: Average 4.3/5 stars
├─ Safety incidents: Target < 2 per 10,000 km
├─ Customer support response: < 2 hour
└─ Resolution rate: > 95%

GROWTH:
├─ New routes added: Track quarterly
├─ Fleet size growth: Plan 20% YoY
├─ Daily active users: Track growth
├─ Market share in city: Target 25% YoY
└─ Prediction accuracy improvement: 2% QoQ
```

---

## 8. SECURITY & COMPLIANCE

### 8.1 Data Security

```
ENCRYPTION:
├─ In Transit: HTTPS/TLS 1.3 for all API calls
├─ In Transit: WSS (WebSocket Secure) for real-time
├─ At Rest: MongoDB encryption (AES-256)
├─ At Rest: PII encrypted with rotating keys
└─ Passwords: bcrypt with salt rounds 10+

AUTHENTICATION:
├─ Mobile App:
│  ├─ JWT access token (15 minutes)
│  ├─ Refresh token in HttpOnly cookie (7 days)
│  ├─ Biometric option (fingerprint/face)
│  └─ Email OTP verification
│
├─ Web Admin:
│  ├─ JWT + session management
│  ├─ 2FA via authenticator app
│  ├─ IP whitelisting (optional)
│  └─ Audit logging of all actions

AUTHORIZATION:
├─ Role-Based Access Control (RBAC):
│  ├─ Passenger: Read own bookings, tracking
│  ├─ Driver: Update position, trip status
│  ├─ Manager: Manage routes, schedules
│  ├─ Admin: Full system access
│  └─ Analyst: Read-only reports
├─ Resource-Level Permissions:
│  ├─ User can only access own data
│  ├─ Driver sees only assigned bus/route
│  └─ Manager sees assigned district

COMPLIANCE:
├─ GDPR: Data privacy, right to be forgotten
├─ CCPA: Consumer privacy rights
├─ Local Regulations: As per country
├─ Audit Trails: All actions logged
└─ Data Retention: Comply with laws
```

### 8.2 API Security

```
RATE LIMITING:
├─ Global: 200 requests/15 minutes
├─ Auth endpoints: 20 attempts/15 min
├─ Export endpoints: 10/5 minutes
├─ Real-time: Unlimited (Socket.io)
└─ Bypass: Premium users (optional)

INPUT VALIDATION:
├─ All inputs sanitized (XSS prevention)
├─ SQL injection prevention (Mongoose)
├─ NoSQL injection prevention (mongo-sanitize)
├─ File upload validation
└─ Payload size limits (10MB)

MONITORING:
├─ Rate limit violations logged
├─ Unusual access patterns detected
├─ Failed authentication attempts tracked
├─ Large data exports audited
└─ Alerts for security incidents
```

---

## 9. QUICK REFERENCE ARCHITECTURE MATRIX

Create this table for easy reference:

```
┌─────────────┬──────────────┬─────────────────┬──────────────────┬────────────────┐
│ Component   │ Technology   │ Port            │ Purpose          │ Key Metrics    │
├─────────────┼──────────────┼─────────────────┼──────────────────┼────────────────┤
│ Frontend    │ Next.js/React│ 3000            │ Admin dashboard  │ < 2s load time │
│ Mobile      │ React Native │ App store       │ Passenger/Driver │ < 100ms API    │
│ Backend API │ Express.js   │ 5000            │ REST endpoints   │ 99.9% uptime   │
│ Real-time   │ Socket.io    │ 5000/ws         │ Live tracking    │ < 100ms latency│
│ AI Service  │ FastAPI      │ 8000            │ ML predictions   │ < 200ms response│
│ Database    │ MongoDB      │ 27017           │ Data persistence │ < 100ms query  │
│ Cache       │ Redis        │ 6379            │ Session/data     │ < 10ms access  │
│ Auth        │ JWT          │ Stateless       │ Security         │ 15min token    │
└─────────────┴──────────────┴─────────────────┴──────────────────┴────────────────┘
```

---

## 10. PROMPT FORMULATION FOR AI DIAGRAM GENERATION

**Use this exact prompt with ChatGPT/Gemini to generate final diagrams:**

```
I'm building SmartDTC, an AI-driven bus scheduling system. Please generate [DIAGRAM TYPE] 
showing all components, data flows, and interactions:

SYSTEM CONTEXT:
- Passengers book bus tickets via mobile app
- Drivers operate buses with real-time GPS tracking
- Admin staff manage routes, schedules, fleet
- AI service predicts demand, delays, detects anomalies
- 6-model ensemble for each prediction task
- Real-time Socket.io updates for live tracking

DIAGRAM REQUIREMENTS:
[INSERT COMPONENT LIST FROM SECTION 6.1-6.3 ABOVE]

VISUAL STYLE:
- Professional tech architecture
- Color-coded by function
- Include data formats and flows
- Add response times
- Show error paths
- Include scaling information

OUTPUT FORMAT:
- High-resolution (suitable for paper/presentation)
- Vector format preferred (SVG)
- Include legend and annotations
- Add key metrics and SLAs
```

---

## CONCLUSION

This comprehensive document provides:

✅ **Complete System Overview** - All components and their interactions
✅ **Detailed Architecture** - Each module's internal structure
✅ **Data Flows** - End-to-end journey for passengers, admins, AI models
✅ **Integration Points** - How services communicate
✅ **Deployment Architecture** - Docker, cloud options
✅ **Security & Compliance** - Data protection measures
✅ **Monitoring & KPIs** - Performance tracking
✅ **Diagram Prompts** - Ready-to-use for AI diagram generation

**For Paper/Presentation:**
Use the prompts in Section 6 and Section 10 with ChatGPT/Gemini to generate:
1. **System Architecture Diagram** (overview of all components)
2. **Data Pipeline Diagram** (ML model training flow)
3. **User Journey Diagram** (passenger experience)
4. **API Architecture Diagram** (REST endpoints)
5. **Ensemble Model Diagram** (ML model ensemble)
6. **Deployment Diagram** (cloud infrastructure)

Each diagram can be customized and exported for your research paper/thesis presentation.

---

**Document Version:** 1.0
**Last Updated:** April 14, 2026
**For:** SmartDTC Capstone Project
**Author:** AI Architecture Documentation System
