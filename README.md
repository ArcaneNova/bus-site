# SmartDTC Ã¢â‚¬â€ AI-Powered Intelligent Bus Management System

> **Final Year Capstone Project** | Delhi Transport Corporation (DTC)

An end-to-end AI-driven transit management platform that replaces static timetables with real-time intelligent scheduling, live GPS fleet tracking, machine-learning-based passenger demand forecasting, and a complete mobile experience for both drivers and passengers.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [System Architecture](#3-system-architecture)
4. [Key Features](#4-key-features)
5. [AI & ML Models](#5-ai--ml-models)
6. [Tech Stack](#6-tech-stack)
7. [Project Structure](#7-project-structure)
8. [Dataset](#8-dataset)
9. [Quick Start](#9-quick-start)
10. [Service URLs & Default Credentials](#10-service-urls--default-credentials)
11. [Environment Variables](#11-environment-variables)
12. [API Reference](#12-api-reference)
13. [Socket.io Real-Time Events](#13-socketio-real-time-events)
14. [Admin Dashboard Ã¢â‚¬â€ Features](#14-admin-dashboard--features)
15. [Passenger Web Portal Ã¢â‚¬â€ Features](#15-passenger-web-portal--features)
16. [Driver Mobile App Ã¢â‚¬â€ Features](#16-driver-mobile-app--features)
17. [Passenger Mobile App Ã¢â‚¬â€ Features](#17-passenger-mobile-app--features)
18. [Deployment](#18-deployment)
19. [Demonstration Guide](#19-demonstration-guide)

---

## 1. Problem Statement

Delhi Transport Corporation operates **7,000+ buses** across **569 routes** carrying **4 million+ passengers daily**.  
The existing system relies on **fixed timetables** that cannot adapt to:

- Ã¢ÂÅ’ Peak-hour overcrowding (Rajiv Chowk, Kashmere Gate interchange)
- Ã¢ÂÅ’ Low-demand routes running half-empty during off-peak hours
- Ã¢ÂÅ’ Traffic congestion causing cascading delays with no automated response
- Ã¢ÂÅ’ No real-time visibility for passengers on when their bus will arrive
- Ã¢ÂÅ’ Fleet under-utilisation Ã¢â‚¬â€ idle buses while other routes are overloaded
- Ã¢ÂÅ’ Drivers with no digital tool to report emergencies or receive live guidance

---

## 2. Solution Overview

SmartDTC is a **four-component integrated platform**:

| Component | What It Does |
|---|---|
| Ã°Å¸â€“Â¥Ã¯Â¸Â **Admin Web Dashboard** (Next.js) | Full fleet control: buses, drivers, routes, AI schedule generation, live map, reports |
| Ã°Å¸â€œÂ± **Driver Mobile App** (React Native) | GPS tracking, active trip management, SOS emergency alerts |
| Ã°Å¸â€œÂ± **Passenger Mobile App** (React Native) | Live bus tracking, route search, crowd predictions, favourites |
| Ã°Å¸Â¤â€“ **AI Microservice** (Python/FastAPI) | LSTM demand prediction, XGBoost delay prediction, Genetic Algorithm scheduling |

**Core innovation:** When the AI predicts high demand on a route, it automatically generates an optimised schedule Ã¢â‚¬â€ adding buses, reducing headway, reassigning idle fleet Ã¢â‚¬â€ without any manual dispatcher intervention.

---

## 3. System Architecture

```
Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â
Ã¢â€â€š                         SmartDTC Platform                                Ã¢â€â€š
Ã¢â€â€š                                                                          Ã¢â€â€š
Ã¢â€â€š  Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â    Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â    Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  Next.js 14     Ã¢â€â€š    Ã¢â€â€š  React Native   Ã¢â€â€š    Ã¢â€â€š  React Native       Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  Admin Panel    Ã¢â€â€š    Ã¢â€â€š  Driver App     Ã¢â€â€š    Ã¢â€â€š  Passenger App      Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€š  Port 3000      Ã¢â€â€š    Ã¢â€â€š  (Expo)         Ã¢â€â€š    Ã¢â€â€š  (Expo)             Ã¢â€â€š  Ã¢â€â€š
Ã¢â€â€š  Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ    Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ    Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ  Ã¢â€â€š
Ã¢â€â€š           Ã¢â€â€š                     Ã¢â€â€š                         Ã¢â€â€š             Ã¢â€â€š
Ã¢â€â€š           Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¼Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ             Ã¢â€â€š
Ã¢â€â€š                                 Ã¢â€â€š  REST API + Socket.io                 Ã¢â€â€š
Ã¢â€â€š                    Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€“Â¼Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â                          Ã¢â€â€š
Ã¢â€â€š                    Ã¢â€â€š   Node.js / Express     Ã¢â€â€š                          Ã¢â€â€š
Ã¢â€â€š                    Ã¢â€â€š   Backend API           Ã¢â€â€š                          Ã¢â€â€š
Ã¢â€â€š                    Ã¢â€â€š   Port 5000             Ã¢â€â€š                          Ã¢â€â€š
Ã¢â€â€š                    Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ                          Ã¢â€â€š
Ã¢â€â€š                          Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â´Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â                                Ã¢â€â€š
Ã¢â€â€š              Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€“Â¼Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â      Ã¢â€Å’Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€“Â¼Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Â                 Ã¢â€â€š
Ã¢â€â€š              Ã¢â€â€š  MongoDB 7   Ã¢â€â€š      Ã¢â€â€š  FastAPI AI      Ã¢â€â€š                 Ã¢â€â€š
Ã¢â€â€š              Ã¢â€â€š  (Mongoose)  Ã¢â€â€š      Ã¢â€â€š  Microservice    Ã¢â€â€š                 Ã¢â€â€š
Ã¢â€â€š              Ã¢â€â€š  Atlas/Local Ã¢â€â€š      Ã¢â€â€š  Port 8000       Ã¢â€â€š                 Ã¢â€â€š
Ã¢â€â€š              Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ      Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ                 Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€Ëœ

Data Flow:
  Driver Phone  Ã¢â€ â€™  GPS updates (Socket.io every 10s)  Ã¢â€ â€™  Backend  Ã¢â€ â€™  MongoDB
  Backend       Ã¢â€ â€™  AI Service  Ã¢â€ â€™  demand/delay predictions  Ã¢â€ â€™  Schedule engine
  Backend       Ã¢â€ â€™  All clients (Socket.io broadcast)  Ã¢â€ â€™  Live maps & alerts

Real-time channels: bus:location_update, admin:new_alert, admin:alert_resolved
Maps: Leaflet.js + OpenStreetMap (free, no API key needed)
```

---

## 4. Key Features

### Ã°Å¸Â§Â  Artificial Intelligence

| Feature | Implementation |
|---|---|
| Passenger demand forecasting | LSTM neural network (128Ã¢â€ â€™64Ã¢â€ â€™32Ã¢â€ â€™1 neurons) trained on time-series ridership data |
| Delay prediction | XGBoost regression + classification (on-time vs delayed) |
| Anomaly detection | scikit-learn Isolation Forest on bus position data |
| Schedule optimisation | Genetic Algorithm Ã¢â‚¬â€ evolves bus assignment for minimal wait time + maximum fleet utilisation |
| Rule-based fallback | If ML models not loaded, deterministic rules run instead Ã¢â‚¬â€ system never goes down |
| 24-hour demand curve | 24 sequential LSTM predictions rendered as an area chart per route |
| Crowd level | `low / medium / high / very_high` classification with confidence score and peak factor |

### Ã°Å¸Å¡Å’ Fleet Management

- Full CRUD for **buses**, **drivers**, and **routes**
- Bus status lifecycle: `active Ã¢â€ â€™ idle Ã¢â€ â€™ maintenance Ã¢â€ â€™ retired`
- Driver duty status toggle: `on-duty Ã¢â€ â€ off-duty`
- Assign bus to driver (with active-bus filter)
- Driver rating tracked per completed trip

### Ã°Å¸â€œÂ Live GPS Tracking

- Real-time bus positions on interactive Leaflet map (OpenStreetMap tiles)
- Position updates via Socket.io WebSocket (every 10 seconds from driver phone)
- GPS simulation runs automatically for seeded buses during demo
- Delay detection: backend calculates deviation from schedule
- Speed, heading, next stop displayed per bus
- Route polyline drawn from all stop coordinates
- **Heatmap overlay**: demand intensity by geographic area (Leaflet.heat)

### Ã°Å¸â€œâ€¦ Intelligent Scheduling

- Manual schedule creation (route + bus + driver + time)
- **AI Schedule Generation**: select a route Ã¢â€ â€™ POST to AI microservice Ã¢â€ â€™ returns optimised time slots Ã¢â€ â€™ one-click apply to database
- Auto-schedule cron job runs nightly (00:30) for next-day slots
- Auto-optimise cron job runs every 4 hours during peak (05:00Ã¢â‚¬â€œ22:00)
- Schedule status lifecycle: `scheduled Ã¢â€ â€™ in-progress Ã¢â€ â€™ completed / cancelled`

### Ã°Å¸Å¡Â¨ Alerts System

- Real-time alert types: `delay`, `overcrowding`, `breakdown`, `route-change`, `traffic`, `sos`
- Severity levels: `info`, `warning`, `critical`
- Admin sees new alerts instantly via Socket.io (no refresh needed)
- Driver SOS triggers both Socket.io broadcast and REST API alert creation
- Resolve / delete alerts with instant UI feedback

### Ã°Å¸â€œÅ  Reports & Analytics

- KPI dashboard: total trips today, completed, active alerts, critical alerts
- On-time performance chart (per route, top 10)
- Alert type distribution (Pie chart Ã¢â‚¬â€ Recharts)
- Predicted vs actual demand (24-hour Line chart)
- Fleet utilisation area chart (active vs idle buses)
- Delay vs passenger load scatter chart (correlation analysis)
- **Export to PDF** (PDFKit on backend)
- **Export to Excel** (ExcelJS on backend)

### Ã°Å¸â€â€™ Security

- JWT access tokens (15 min) + refresh tokens (7 days, HttpOnly cookies)
- Auto-refresh on 401 Ã¢â‚¬â€ seamless session extension
- bcryptjs password hashing (salt rounds: 12)
- Helmet.js HTTP headers
- express-rate-limit: 100 req/15min general, 10 req/15min for auth
- CORS restricted to configured frontend origin
- NoSQL injection prevention (express-mongo-sanitize)
- XSS protection (xss-clean)
- Role-based access: `admin`, `dispatcher`, `driver`, `passenger`

---

## 5. AI & ML Models

### Model 1 Ã¢â‚¬â€ Passenger Demand Prediction (LSTM)

**Purpose:** Predict how many passengers will board a bus on a given route at a given hour.

**Architecture:**
```
Input features (10):
  route_id_encoded, hour_sin, hour_cos, day_sin, day_cos,
  is_weekend, is_holiday, weather_encoded, avg_temp_c, special_event

LSTM Network:
  Input  Ã¢â€ â€™  LSTM(128)  Ã¢â€ â€™  Dropout(0.2)
         Ã¢â€ â€™  LSTM(64)   Ã¢â€ â€™  Dropout(0.2)
         Ã¢â€ â€™  Dense(32)  Ã¢â€ â€™  Dense(1)   Ã¢â€ â€™  predicted_count (MinMax scaled)

Output:
  predicted_count  Ã¢â€ â€™  crowd_level (low/medium/high/very_high)
                   Ã¢â€ â€™  confidence score (0Ã¢â‚¬â€œ1)
                   Ã¢â€ â€™  peak_factor (ratio vs average demand)
```

**Training:**
- Dataset: 50,000+ synthetic rows modelling real DTC ridership patterns
- Features: hour, day-of-week, weather, holidays, special events, historical average
- Metrics target: MAE < 15 passengers, MAPE < 12%, RÃ‚Â² > 0.85
- Training platform: Google Colab (free GPU T4)
- Output files: `models/saved/demand_lstm/` (TF SavedModel) + `demand_scaler.pkl`

---

### Model 2 Ã¢â‚¬â€ Delay Prediction (XGBoost)

**Purpose:** Predict how many minutes a bus will be delayed and classify as on-time or delayed.

**Features (12):**
```
hour, day_of_week, is_weekend, route_length_km, num_stops,
scheduled_duration_min, traffic_index, weather_encoded,
passenger_load, driver_experience, bus_age_years, is_peak_hour
```

**Two-model ensemble:**
- `XGBRegressor` (500 estimators) Ã¢â€ â€™ delay in minutes
- `XGBClassifier` (400 estimators) Ã¢â€ â€™ on-time (0) or delayed (1)

**Metrics target:** MAE < 3 min, RMSE < 5 min, F1 > 0.82

---

### Model 3 Ã¢â‚¬â€ Anomaly Detection (Isolation Forest)

**Purpose:** Detect abnormal GPS patterns (bus stuck in traffic, wrong route, sensor error).

**Implementation:** scikit-learn `IsolationForest` on speed, heading-change, and position-deviation features.

---

### Model 4 Ã¢â‚¬â€ Schedule Optimisation (Genetic Algorithm)

**Purpose:** Assign available buses to route time-slots to minimise passenger wait time while respecting driver hours and bus capacity.

**Algorithm:**
```
Population:   50 candidate schedules
Fitness:      minimise(avg_wait_time) + maximise(fleet_utilisation)
Crossover:    single-point (random slot exchange)
Mutation:     random bus/driver re-assignment (rate 0.1)
Generations:  100
Elitism:      top 5 schedules preserved each generation
```

---

### Fallback Behaviour

If model files are absent (not yet trained), every endpoint returns a **deterministic rule-based prediction** so the system never fails:
- Demand: `base_demand Ãƒâ€” peak_factor(hour) Ãƒâ€” weather_factor Ãƒâ€” event_factor`
- Delay: `traffic_index Ãƒâ€” route_length / avg_speed`
- Schedule: greedy time-gap allocation

---

## 6. Tech Stack

### Backend
| Package | Version | Role |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express.js | 4.18 | HTTP framework |
| Mongoose | 8 | ODM for MongoDB |
| Socket.io | 4.7 | WebSocket real-time layer |
| node-cron | 3 | Scheduled jobs (5 crons) |
| bcryptjs | 2.4 | Password hashing |
| jsonwebtoken | 9 | JWT auth |
| Helmet | 7 | HTTP security headers |
| Winston | 3.11 | Structured logging |
| PDFKit | 0.15 | PDF report generation |
| ExcelJS | 4.4 | Excel report generation |
| axios | 1.6 | AI service HTTP client |
| express-validator | 7 | Input validation |

### AI Service
| Package | Role |
|---|---|
| FastAPI | HTTP microservice framework |
| TensorFlow 2 | LSTM neural network |
| XGBoost | Gradient boosted trees |
| scikit-learn | Isolation Forest, preprocessing |
| numpy / pandas | Data manipulation |
| joblib | Model serialisation |
| uvicorn | ASGI server |

### Frontend (Admin + Web)
| Package | Role |
|---|---|
| Next.js 14 (App Router) | React framework + SSR |
| TypeScript 5 | Type safety |
| Tailwind CSS 3 | Utility-first styling |
| Zustand 4 | Client state + auth persistence |
| Axios 1.6 | HTTP client with JWT interceptors |
| Socket.io-client 4 | Real-time subscription |
| Leaflet + React-Leaflet | Interactive maps |
| Leaflet.heat | Demand heatmap overlay |
| Recharts | Charts and analytics |
| react-hot-toast | Toast notifications |
| Lucide React | Icon set |
| Radix UI | Accessible UI primitives |

### Mobile App
| Package | Role |
|---|---|
| Expo SDK 50 | Managed React Native |
| Expo Router 3 | File-based navigation |
| react-native-maps | Native maps (Google/Apple) |
| expo-location | Foreground + background GPS |
| expo-secure-store | Encrypted token storage |
| expo-notifications | Push notifications |
| expo-task-manager | Background GPS task |
| Socket.io-client 4 | Real-time bus tracking |
| @react-native-async-storage | Offline cache |
| @react-native-community/netinfo | Connectivity detection |
| Zustand 4 | Auth state |
| date-fns 3 | Date formatting |

---

## 7. Project Structure

```
bus-site/
Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ backend/                        # Node.js REST API + Socket.io server
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ server.js                   # Boot: connect DB Ã¢â€ â€™ init socket Ã¢â€ â€™ start HTTP
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ src/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app.js                  # Express: security middleware + 12 route groups
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ config/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ database.js         # Mongoose connection + retry logic
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ socket.js           # Socket.io rooms, GPS events, SOS handler
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ models/                 # 13 Mongoose schemas
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ User.js             # Admin / Driver / Passenger
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Bus.js              # Fleet with status lifecycle
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Driver.js           # License, rating, assignment
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Route.js            # 569 DTC routes (text-indexed)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Stage.js            # 14,248 stops (2dsphere geospatial)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Schedule.js         # Trip slots (manual + ai-auto)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ BusPosition.js      # Live GPS (TTL: 1 hour)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Alert.js            # System alerts
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ PassengerDemand.js  # Demand predictions + actuals
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ TripRating.js       # Passenger trip ratings
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ PushToken.js        # Expo push notification tokens
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Favourite.js        # Passenger saved routes/stops
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ RefreshToken.js     # JWT refresh token storage
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ controllers/            # Business logic per domain
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ routes/                 # Express routers (auth guards applied)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ middleware/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ auth.js             # JWT verify + role check
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ errorHandler.js     # Global error handler
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ rateLimiter.js      # Express rate limiter
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ services/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ gpsSimulator.service.js   # Simulates GPS for demo buses
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ scheduler.service.js      # 5 cron jobs
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ utils/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ haversine.js        # GPS distance calculation
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ etaCalculator.js    # Stop ETA from current position
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ logger.js           # Winston structured logger
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ scripts/
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ importData.js       # CSV Ã¢â€ â€™ MongoDB (routes + stages)
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ seedData.js         # Demo users, buses, schedules
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ package.json
Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ frontend/                       # Next.js 14 web app
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ src/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ page.tsx            # Public homepage
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ layout.tsx          # Root layout (Inter + Toaster)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ not-found.tsx       # 404 page
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ login/page.tsx      # Sign-in
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ register/page.tsx   # Passenger registration
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ search/page.tsx     # Public route search
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ track/page.tsx      # Public live map + socket
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ admin/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ layout.tsx      # Auth guard Ã¢â€ â€™ /login if not admin/dispatcher
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ page.tsx        # Dashboard (KPIs + socket)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ buses/          # Fleet CRUD
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ routes/         # Route CRUD
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ drivers/        # Driver CRUD + bus assignment
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ schedule/       # Schedule + AI generation panel
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ tracking/       # Live map + heatmap toggle
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ demand/         # LSTM prediction + 24h curve
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ alerts/         # Real-time alerts (socket-driven)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ reports/        # Analytics + PDF/Excel export
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ components/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ admin/Sidebar.tsx   # 9-item navigation
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ map/LiveMap.tsx     # Leaflet map + heatmap overlay
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ map/RouteMap.tsx    # Route stops + polyline
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ ui/Skeleton.tsx     # Loading skeletons
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ lib/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ api.ts              # Axios + JWT interceptors
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ socket.ts           # Socket.io lazy singleton
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ utils.ts            # cn(), formatDate(), crowdColor()
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ store/authStore.ts      # Zustand auth (localStorage persist)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ types/index.ts          # Shared interfaces
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ .env.local
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ next.config.js
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ tailwind.config.js
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ package.json
Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ ai-service/                     # Python FastAPI ML microservice
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ main.py                     # 8 endpoints, lifespan model loader
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ schemas.py                  # Pydantic request/response models
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ model_loader.py             # Load LSTM + XGBoost at startup
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ predictors.py               # Prediction logic + rule-based fallback
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ requirements.txt
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ models/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ saved/                  # Trained model files (git-ignored)
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ demand_lstm/        # TF SavedModel directory
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ demand_scaler.pkl
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ delay_regressor.pkl
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ delay_classifier.pkl
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ delay_scaler.pkl
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ training/
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ generate_dataset.py     # Generates demand + delay CSV datasets
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ train_demand_lstm.py    # Trains + saves LSTM model
Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ train_delay_xgboost.py  # Trains + saves XGBoost models
Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ mobile-app/                     # React Native + Expo
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ _layout.tsx             # Root: SplashScreen, push tokens, auth load
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ index.tsx               # Entry redirect by role
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ login.tsx               # Shared login (driver + passenger)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ register.tsx            # Passenger self-registration
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ (driver)/               # Driver tab navigator (6 tabs)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ index.tsx           # Dashboard + status toggle
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ schedule.tsx        # Upcoming trips
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ active-trip.tsx     # Live GPS tracking + stop marking
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ alerts.tsx          # Real-time alerts via socket
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ sos.tsx             # SOS emergency panel
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ profile.tsx         # Driver profile + rating
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ (passenger)/            # Passenger tab navigator
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ index.tsx           # Home: nearby stops + popular routes
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ search.tsx          # Route search
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ favourites.tsx      # Saved routes/stops
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ profile.tsx         # Account + stats + logout
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ route/[id].tsx      # Route detail + live buses + favourite
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ track/[busId].tsx   # Live bus map (socket)
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ rate/[tripId].tsx   # Trip rating (stars + tags)
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ src/lib/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ api.ts                  # Axios + SecureStore JWT + auto-refresh
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ socket.ts               # Socket.io singleton + token auth
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ backgroundGps.ts        # expo-task-manager background GPS
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ offlineCache.ts         # AsyncStorage + netinfo offline cache
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ src/store/authStore.ts      # Zustand + SecureStore persist
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app.json                    # Permissions, plugins, bundle IDs
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ eas.json                    # EAS build profiles
Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ routes.csv                      # 569 real DTC bus routes
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ stages.csv                      # 14,248 real DTC GPS stops
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ README.md                       # This file
```

---

## 8. Dataset

| File | Rows | Description |
|---|---|---|
| `routes.csv` | 569 | Real DTC routes: route_id, route_name, start/end stage, distance, total stops |
| `stages.csv` | 14,248 | Real DTC stops: GPS coordinates, route ID, sequence number, stop name |
| `training/data/demand_dataset.csv` | 50,000+ | Synthetic demand data (generated by `generate_dataset.py`) |
| `training/data/delay_dataset.csv` | 30,000+ | Synthetic delay data (generated by `generate_dataset.py`) |

The route and stop data is sourced from the **Delhi Open Government Data Portal** and reflects the actual DTC network.

---

## 9. Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | Ã¢â€°Â¥ 20 |
| Python | Ã¢â€°Â¥ 3.11 |
| MongoDB | Ã¢â€°Â¥ 7 (local) or MongoDB Atlas (cloud) |
| Expo Go app | Latest (on your phone) |

### Step 1 Ã¢â‚¬â€ Clone and Install

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# AI Service
cd ../ai-service && pip install -r requirements.txt

# Mobile App
cd ../mobile-app && npm install
```

### Step 2 Ã¢â‚¬â€ Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit: set MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET

# Frontend
cp frontend/.env.example frontend/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Mobile App
cp mobile-app/.env.example mobile-app/.env
# EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
```

### Step 3 Ã¢â‚¬â€ Import Real DTC Data

```bash
cd backend
npm run import-data
# Imports 569 routes and 14,248 stops from CSV files
```

### Step 4 Ã¢â‚¬â€ Seed Demo Users & Buses

```bash
cd backend
npm run seed
# Creates admin, 3 drivers, 5 buses, sample schedules
```

### Step 5 Ã¢â‚¬â€ (Optional) Train AI Models

```bash
cd ai-service
python training/generate_dataset.py          # ~2 min
python training/train_demand_lstm.py         # ~15 min (use Colab for GPU)
python training/train_delay_xgboost.py       # ~5 min
```

> Ã°Å¸â€™Â¡ Skip this step for demo. The AI service runs rule-based fallback predictions automatically.

### Step 6 Ã¢â‚¬â€ Run All Services

Open **4 terminals**:

```bash
# Terminal 1 Ã¢â‚¬â€ Backend
cd backend && npm run dev

# Terminal 2 Ã¢â‚¬â€ AI Service
cd ai-service && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3 Ã¢â‚¬â€ Frontend
cd frontend && npm run dev

# Terminal 4 Ã¢â‚¬â€ Mobile App
cd mobile-app && npx expo start
```

---

## 10. Service URLs & Default Credentials

### URLs

| Service | URL |
|---|---|
| Ã°Å¸Å’Â Homepage | http://localhost:3000 |
| Ã°Å¸â€“Â¥Ã¯Â¸Â Admin Dashboard | http://localhost:3000/admin |
| Ã°Å¸â€”ÂºÃ¯Â¸Â Live Tracker (Public) | http://localhost:3000/track |
| Ã°Å¸â€Â Route Search (Public) | http://localhost:3000/search |
| Ã°Å¸â€Å’ Backend API | http://localhost:5000/api/v1 |
| Ã°Å¸Â¤â€“ AI Service | http://localhost:8000 |
| Ã¢ÂÂ¤Ã¯Â¸Â API Health | http://localhost:5000/health |
| Ã¢ÂÂ¤Ã¯Â¸Â AI Health | http://localhost:8000/health |
| Ã°Å¸â€œâ€“ AI API Docs | http://localhost:8000/docs |

### Default Credentials (created by `npm run seed`)

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@dtc.in` | `Admin@123` | Full admin dashboard |
| **Dispatcher** | `dispatcher@dtc.in` | `Dispatch@123` | Dashboard (no delete) |
| **Driver 1** | `driver1@dtc.in` | `Driver@123` | Driver mobile app |
| **Driver 2** | `driver2@dtc.in` | `Driver@123` | Driver mobile app |
| **Driver 3** | `driver3@dtc.in` | `Driver@123` | Driver mobile app |
| **Passenger** | `passenger@dtc.in` | `Pass@123` | Passenger app + web |

---

## 11. Environment Variables

### Backend (`backend/.env`)

```dotenv
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartdtc
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_REFRESH_SECRET=change_this_refresh_secret_too
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### AI Service (`ai-service/.env`)

```dotenv
PORT=8000
MODEL_DIR=models/saved
```

### Mobile App (`mobile-app/.env`)

```dotenv
# Use your machine's LAN IP Ã¢â‚¬â€ phones cannot reach "localhost"
# Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) to find it
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.100:5000
```

---

## 12. API Reference

**Base URL:** `http://localhost:5000/api/v1`  
Ã°Å¸â€â€œ = public | Ã°Å¸â€â€˜ = any authenticated user | Ã°Å¸â€˜â€˜ = admin/dispatcher only

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Ã°Å¸â€â€œ | Register (default role: passenger) |
| POST | `/auth/login` | Ã°Å¸â€â€œ | Login Ã¢â€ â€™ returns `accessToken` + sets refresh cookie |
| POST | `/auth/logout` | Ã°Å¸â€â€˜ | Logout + invalidate refresh token |
| GET | `/auth/me` | Ã°Å¸â€â€˜ | Get current user profile |
| POST | `/auth/refresh-token` | Ã°Å¸â€â€œ | Exchange refresh token Ã¢â€ â€™ new access token |

### Buses
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/buses` | Ã°Å¸â€˜â€˜ | List all buses (filter by status) |
| POST | `/buses` | Ã°Å¸â€˜â€˜ | Add bus |
| PUT | `/buses/:id` | Ã°Å¸â€˜â€˜ | Update bus |
| PATCH | `/buses/:id/status` | Ã°Å¸â€˜â€˜ | Update bus status only |
| DELETE | `/buses/:id` | Ã°Å¸â€˜â€˜ | Delete bus |

### Drivers
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/drivers` | Ã°Å¸â€˜â€˜ | List drivers |
| POST | `/drivers` | Ã°Å¸â€˜â€˜ | Create driver profile |
| PATCH | `/drivers/:id/assign` | Ã°Å¸â€˜â€˜ | Assign bus to driver |
| GET | `/drivers/:id` | Ã°Å¸â€˜â€˜ | Get driver detail |

### Routes & Stages
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/routes` | Ã°Å¸â€â€œ | Search routes (full-text + pagination) |
| GET | `/routes/:id` | Ã°Å¸â€â€œ | Get route by ID |
| POST | `/routes` | Ã°Å¸â€˜â€˜ | Create route |
| PUT | `/routes/:id` | Ã°Å¸â€˜â€˜ | Update route |
| DELETE | `/routes/:id` | Ã°Å¸â€˜â€˜ | Delete route |
| GET | `/stages?routeId=` | Ã°Å¸â€â€œ | Get all stops for a route |
| GET | `/stages/nearby?lat=&lng=&radius=` | Ã°Å¸â€â€œ | Nearby stops (geospatial) |

### Schedules
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/schedule` | Ã°Å¸â€˜â€˜ | List schedules (filter by date/route/status) |
| POST | `/schedule` | Ã°Å¸â€˜â€˜ | Create schedule manually |
| PUT | `/schedule/:id` | Ã°Å¸â€˜â€˜ | Update schedule |
| DELETE | `/schedule/:id` | Ã°Å¸â€˜â€˜ | Delete schedule |
| POST | `/schedule/generate-ai` | Ã°Å¸â€˜â€˜ | AI-generate schedule for a route |
| POST | `/schedule/generate-ai/apply` | Ã°Å¸â€˜â€˜ | Save AI-generated slots to DB |

### Live Tracking
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/tracking/live` | Ã°Å¸â€â€˜ | All live bus positions |
| GET | `/tracking/bus/:busId` | Ã°Å¸â€â€˜ | Single bus position |
| GET | `/tracking/route/:routeId` | Ã°Å¸â€â€œ | All buses on a route |
| GET | `/tracking/nearby?lat=&lng=&radius=` | Ã°Å¸â€â€œ | Nearby buses (geospatial) |

### Demand & AI
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/demand/predict` | Ã°Å¸â€˜â€˜ | LSTM demand prediction |
| GET | `/demand` | Ã°Å¸â€˜â€˜ | Demand history (filter by routeId) |
| GET | `/demand/heatmap?date=&hour=` | Ã°Å¸â€˜â€˜ | Demand heatmap points |

### Alerts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/alerts` | Ã°Å¸â€˜â€˜ | List alerts (filter: isResolved, severity) |
| POST | `/alerts` | Ã°Å¸â€â€˜ | Create alert |
| PUT | `/alerts/:id/resolve` | Ã°Å¸â€˜â€˜ | Mark alert resolved |
| DELETE | `/alerts/:id` | Ã°Å¸â€˜â€˜ | Delete alert |

### Reports
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/reports/summary` | Ã°Å¸â€˜â€˜ | KPI summary (trips, alerts, completion rate) |
| GET | `/reports/on-time-performance` | Ã°Å¸â€˜â€˜ | OTP per route |
| GET | `/reports/export/pdf?type=daily` | Ã°Å¸â€˜â€˜ | Download PDF report |
| GET | `/reports/export/excel?type=monthly` | Ã°Å¸â€˜â€˜ | Download Excel report |

### Mobile Ã¢â‚¬â€ Driver
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/mobile/driver/dashboard` | Ã°Å¸â€â€˜ | Driver dashboard data |
| GET | `/mobile/driver/schedule` | Ã°Å¸â€â€˜ | Driver's upcoming schedules |
| GET | `/mobile/driver/schedule/today` | Ã°Å¸â€â€˜ | Today's schedule |
| GET | `/mobile/driver/schedule/active` | Ã°Å¸â€â€˜ | Currently active trip |
| PATCH | `/mobile/driver/status` | Ã°Å¸â€â€˜ | Update duty status |
| GET | `/mobile/driver/profile` | Ã°Å¸â€â€˜ | Driver profile + rating |

### Mobile Ã¢â‚¬â€ Passenger
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/mobile/passenger/stats` | Ã°Å¸â€â€˜ | Trips tracked, favourites count |
| GET | `/mobile/favourites` | Ã°Å¸â€â€˜ | List saved routes/stops |
| POST | `/mobile/favourites` | Ã°Å¸â€â€˜ | Add favourite |
| DELETE | `/mobile/favourites/:refId` | Ã°Å¸â€â€˜ | Remove favourite |
| POST | `/mobile/trips/:tripId/rating` | Ã°Å¸â€â€˜ | Submit trip rating |
| POST | `/mobile/push-token` | Ã°Å¸â€â€˜ | Register Expo push token |

---

## 13. Socket.io Real-Time Events

### Client Ã¢â€ â€™ Server (emit)

| Event | Payload | Who Sends |
|---|---|---|
| `driver:gps_update` | `{ busId, routeId, latitude, longitude, speed, heading }` | Driver app every 10s |
| `driver:trip_started` | `{ scheduleId, busId, routeId }` | Driver starts trip |
| `driver:arrived_stop` | `{ busId, stageId, stageSeq }` | Driver marks stop |
| `driver:trip_completed` | `{ scheduleId }` | Driver ends trip |
| `driver:sos` | `{ type, message, latitude, longitude }` | SOS screen |
| `passenger:track_bus` | `{ busId }` | Passenger map opens |
| `passenger:set_watch_stop` | `{ stageId }` | Watch for bus at stop |
| `admin:subscribe_all` | Ã¢â‚¬â€ | Admin dashboard mounts |

### Server Ã¢â€ â€™ Client (on)

| Event | Payload | Who Receives |
|---|---|---|
| `bus:location_update` | Full `BusPosition` object | All connected clients |
| `bus:position` | `{ busId, latitude, longitude, speed, Ã¢â‚¬Â¦ }` | Passengers tracking that bus |
| `bus:arrived` | `{ busId, stageId, stageName, eta }` | Passengers watching that stop |
| `admin:new_alert` | Full `Alert` object | Admin dashboard |
| `admin:alert_resolved` | `{ alertId }` | Admin dashboard |
| `alert:new` | Full `Alert` object | Driver app |

---

## 14. Admin Dashboard Ã¢â‚¬â€ Features

**Access:** http://localhost:3000/admin (requires admin or dispatcher login)

### Dashboard (Home)
- **KPI Cards**: Active buses, trips today, on-time rate, active alerts Ã¢â‚¬â€ live from API
- **Fleet Utilisation Bar**: Active vs idle vs maintenance buses
- **Live Alert Feed**: Socket.io stream Ã¢â‚¬â€ new alerts appear without page refresh
- **Auto-refresh**: every 30 seconds + instant socket updates

### Fleet Management (`/admin/buses`)
- Full table: bus number, type, capacity, status, current route
- Add, edit, delete buses with form validation
- Status quick-update: active / idle / maintenance / retired

### Route Management (`/admin/routes`)
- Search across 569 DTC routes
- View: route ID, name, start/end stage, distance, total stops
- Add / Edit / Delete with modal forms

### Driver Management (`/admin/drivers`)
- Driver list: name, license, experience, assigned bus, status, rating
- Add driver (creates `User` + `Driver` records together)
- Assign bus: dropdown filtered to active buses only

### Schedule Management (`/admin/schedule`)
- Date and status filters
- **AI Generation Panel**:
  1. Select a route
  2. Click "Generate with AI" Ã¢â€ â€™ calls FastAPI Genetic Algorithm Ã¢â€ â€™ returns optimised time slots
  3. Preview slots in a table
  4. Click "Apply to Schedule" Ã¢â€ â€™ saves all slots to database
- Manual schedule creation (route + bus + driver + time)

### Live Tracking (`/admin/tracking`)
- Full-screen Leaflet map (OpenStreetMap)
- Active buses as colour-coded markers:
  - Ã°Å¸â€Âµ Blue = on time | Ã°Å¸â€Â´ Red = delayed (> 5 min)
- Click marker Ã¢â€ â€™ popup: bus number, speed, delay, next stop, timestamp
- **Heatmap Toggle**: overlay passenger demand intensity by area
  - Select date + hour Ã¢â€ â€™ fetches `/demand/heatmap` Ã¢â€ â€™ renders gradient heat layer
- Real-time Socket.io updates (no page refresh needed)

### Demand AI (`/admin/demand`)
- **Input panel**: route selector, date picker, hour slider, weather selector, holiday/event toggles
- **Predict**: calls LSTM via backend Ã¢â€ â€™ shows:
  - Predicted passenger count, crowd level badge, confidence %, peak factor
  - Warning banner if `very_high` crowd level detected
- **Build 24h Curve**: fires 24 predictions Ã¢â€ â€™ renders full-day area chart
- **History table**: past predictions vs actual comparison

### Alerts (`/admin/alerts`)
- Socket-driven live feed Ã¢â‚¬â€ no refresh needed
- Alert types with icons: delay, overcrowding, breakdown, route-change, traffic, SOS
- Severity badges: info (blue), warning (yellow), critical (red)
- Resolve / Delete with instant UI feedback

### Reports & Analytics (`/admin/reports`)
- **KPI row**: total trips, completed, active alerts, critical alerts
- **On-Time Performance bar chart**: top 10 routes by OTP %
- **Predicted vs Actual Demand line chart**: 24-hour comparison
- **Alert Type Distribution pie chart**
- **Fleet Utilisation area chart**: active vs idle buses per hour
- **Delay vs Load scatter chart**: correlation analysis
- **Export PDF** Ã¢â‚¬â€ server-rendered PDF (PDFKit)
- **Export Excel** Ã¢â‚¬â€ multi-sheet spreadsheet (ExcelJS)

---

## 15. Passenger Web Portal Ã¢â‚¬â€ Features

**No login required for public pages.**

### Homepage (`/`)
- Hero section with DTC branding
- Quick links to Live Tracker and Route Search
- Feature highlights: AI Predictions, Real-time Tracking, Smart Scheduling

### Route Search (`/search`)
- Search by route name, route number, or stop name
- Results: route ID badge, name, start Ã¢â€ â€™ end, stop count
- Click result Ã¢â€ â€™ navigates to `/track?routeId=` with live bus positions

### Live Tracker (`/track`)
- Full-screen Leaflet map
- All active buses on map, sidebar list with status, next stop, speed
- Real-time Socket.io updates Ã¢â‚¬â€ buses move as GPS data arrives
- Route filter via search box

### Login (`/login`) & Register (`/register`)
- Login: email + password Ã¢â€ â€™ JWT stored Ã¢â€ â€™ role-based redirect
- Register: name, email, phone, password Ã¢â€ â€™ creates passenger account

---

## 16. Driver Mobile App Ã¢â‚¬â€ Features

**Login required. Role: `driver`.**

### Dashboard Tab
- Duty status toggle: on-duty Ã¢â€ â€ off-duty (one tap)
- Stats: today's trips, completed trips, rating
- Assigned bus info and current schedule card

### Schedule Tab
- Full trip list with date, route, bus, departure/arrival, status colour-coding
- Pull-to-refresh

### Active Trip Tab
- **Start GPS Tracking**: requests foreground location Ã¢â€ â€™ starts Socket.io GPS stream every 10s
- Stop list with checkboxes Ã¢â‚¬â€ tap to mark each stop as arrived
- **Background GPS**: `expo-task-manager` continues emitting GPS at 15s intervals when app is minimised
- **Complete Trip**: stops GPS, marks schedule completed

### Alerts Tab
- Real-time alerts via Socket.io
- Toast notification on `alert:new`
- Severity colour-coding

### SOS Tab
- Emergency type selector: Breakdown, Accident, Medical, Other
- Captures current GPS location automatically
- Emits `driver:sos` (instant admin notification) + creates REST API alert record
- Animated pulse effect on send

### Profile Tab
- License, experience, rating, assigned bus
- Total trips completed
- Logout with confirmation

---

## 17. Passenger Mobile App Ã¢â‚¬â€ Features

**Login required for favourites + ratings. Tracking is open.**

### Home Tab
- Nearby stops (device GPS, radius 1 km)
- Popular routes list
- Quick search bar and action cards

### Search Tab
- Full-text route search
- Tap result Ã¢â€ â€™ Route Detail screen

### Route Detail Screen
- Live buses on this route (from `/tracking/route/:id`)
- All stops in sequence
- Heart icon Ã¢â€ â€™ save/remove from Favourites

### Live Bus Tracker Screen
- Native map (react-native-maps)
- Real-time bus marker via Socket.io `bus:position`
- Route polyline from stop coordinates
- Info card: bus number, route, next stop, delay, speed, last updated
- Live / Offline indicator badge

### Favourites Tab
- Saved routes and stops
- Tap Ã¢â€ â€™ route/stop detail
- Remove with heart icon toggle

### Profile Tab
- Stats: favourites count, trips tracked
- Account info: name, email, phone
- Logout with confirmation dialog

### Trip Rating Screen
- Overall star rating (1Ã¢â‚¬â€œ5)
- Driver rating + comfort rating
- Feedback tags: On Time, Late, Clean Bus, Crowded, Safe Driving, etc.
- Comment field
- Submit Ã¢â€ â€™ `POST /mobile/trips/:tripId/rating`

---

## 18. Deployment

### Backend Ã¢â‚¬â€ Render.com (Free)
1. Push `backend/` to GitHub
2. Render Ã¢â€ â€™ New Web Service Ã¢â€ â€™ connect repo
3. Build: `npm install` | Start: `node server.js`
4. Add env vars (MongoDB Atlas URI, JWT secrets, AI_SERVICE_URL)

### AI Service Ã¢â‚¬â€ Render.com (Free)
1. Push `ai-service/` to GitHub
2. Python environment, Build: `pip install -r requirements.txt`
3. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend Ã¢â‚¬â€ Vercel (Free)
1. Vercel Ã¢â€ â€™ New Project Ã¢â€ â€™ Import GitHub repo, root: `frontend`
2. Framework preset: Next.js (auto-detected)
3. Add env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`

### Mobile App Ã¢â‚¬â€ Expo EAS (Free Tier)
```bash
cd mobile-app
eas login
eas build --profile preview --platform android   # .apk for sharing
```

### Database Ã¢â‚¬â€ MongoDB Atlas (Free M0)
- Free tier: 512 MB, shared cluster
- Connection: `mongodb+srv://user:pass@cluster.mongodb.net/smartdtc`

### Docker (Full Stack)
```bash
docker-compose up --build
# Starts: backend (5000), ai-service (8000), frontend (3000), mongo (27017)
```

---

## 19. Demonstration Guide

Follow this sequence for a complete end-to-end demo in **15Ã¢â‚¬â€œ20 minutes**.

### Demo Setup (before presenting)
1. Start all 4 services
2. Open browser tabs: Tab 1 Ã¢â€ â€™ http://localhost:3000, Tab 2 Ã¢â€ â€™ http://localhost:3000/admin
3. Open Expo Go on your phone, start the mobile app
4. Log in as `admin@dtc.in` in Tab 2

---

### Step 1 Ã¢â‚¬â€ Live GPS Tracking (2 min)
**Navigate to:** Admin Dashboard Ã¢â€ â€™ Live Map (`/admin/tracking`)

> *"GPS updates arrive every 10 seconds via Socket.io WebSocket. Blue = on time, red = delayed Ã¢â‚¬â€ no page refresh needed."*

- Point out the bus popup: speed, delay, next stop
- Toggle the **Heatmap** Ã¢â€ â€™ show demand intensity overlay
- Open `/track` in Tab 1 Ã¢â€ â€™ "Passengers see the same live map publicly, no login required"

---

### Step 2 Ã¢â‚¬â€ AI Demand Prediction (3 min)
**Navigate to:** Admin Dashboard Ã¢â€ â€™ Demand AI (`/admin/demand`)

> *"Our LSTM neural network has 128Ã¢â€ â€™64Ã¢â€ â€™32Ã¢â€ â€™1 neurons trained on 50,000+ data points."*

1. Select any route, set hour to **9** (peak), weather to **rain**
2. Click **Predict** Ã¢â€ â€™ show: passenger count, crowd level, confidence %, peak factor
3. Click **Build 24h Curve** Ã¢â€ â€™ show full-day demand area chart
4. Point out warning banner on `very_high` crowd level

> *"Rain during peak hour increases predicted demand by ~30% Ã¢â‚¬â€ the model learned this from historical patterns."*

---

### Step 3 Ã¢â‚¬â€ AI Schedule Generation (2 min)
**Navigate to:** Admin Dashboard Ã¢â€ â€™ Schedule (`/admin/schedule`)

> *"The Genetic Algorithm runs 100 generations across 50 candidate schedules to find the optimal bus assignments."*

1. Click **Generate with AI** Ã¢â€ â€™ select a route Ã¢â€ â€™ Generate
2. Show the slot preview table
3. Click **Apply to Schedule** Ã¢â€ â€™ show the schedule table populate instantly

---

### Step 4 Ã¢â‚¬â€ Real-Time SOS Alert (2 min)
**Navigate to:** Admin Dashboard Ã¢â€ â€™ Alerts (`/admin/alerts`)

> *"Alerts are pushed instantly via Socket.io Ã¢â‚¬â€ no polling delay."*

- Open Driver mobile app Ã¢â€ â€™ SOS tab Ã¢â€ â€™ select **Breakdown** Ã¢â€ â€™ Send SOS
- Switch to admin browser Ã¢â€ â€™ alert appears in real-time
- Click Resolve Ã¢â€ â€™ alert disappears from feed

---

### Step 5 Ã¢â‚¬â€ Fleet Management (1 min)
**Navigate to:** Buses, Drivers, Routes pages

> *"Full CRUD over 569 real DTC routes, the fleet, and driver profiles."*

- Add a new bus, assign it to a driver Ã¢â‚¬â€ show form validation

---

### Step 6 Ã¢â‚¬â€ Reports & Export (2 min)
**Navigate to:** Admin Dashboard Ã¢â€ â€™ Reports (`/admin/reports`)

> *"Analytics generated from real operational data, exportable for presentations and research."*

- Show KPI cards, OTP bar chart, alert distribution pie
- Click **Export PDF** Ã¢â€ â€™ download opens
- Click **Export Excel** Ã¢â€ â€™ spreadsheet downloads

---

### Step 7 Ã¢â‚¬â€ Passenger Web Portal (2 min)
**Navigate to:** http://localhost:3000/search

> *"No login required Ã¢â‚¬â€ passengers can search routes and track buses publicly."*

1. Search any route number Ã¢â€ â€™ click result Ã¢â€ â€™ live tracker opens
2. Open Passenger mobile app Ã¢â€ â€™ Home (nearby stops) Ã¢â€ â€™ Search Ã¢â€ â€™ Route Detail Ã¢â€ â€™ Live Tracker

---

### Step 8 Ã¢â‚¬â€ Driver App (2 min)
**Show:** Driver mobile app (`driver1@dtc.in`)

1. Dashboard Ã¢â€ â€™ duty toggle Ã¢â€ â€™ On Duty
2. Active Trip tab Ã¢â€ â€™ Start Trip Ã¢â€ â€™ GPS emitting
3. Switch to admin browser Ã¢â€ â€™ watch bus position move on Live Map
4. Mark a stop as arrived

---

### Key Metrics for Presentation

| Metric | Value |
|---|---|
| Real DTC routes | 569 |
| Real DTC GPS stops | 14,248 |
| LSTM target MAE | < 15 passengers |
| LSTM target RÃ‚Â² | > 0.85 |
| XGBoost delay F1 | > 0.82 |
| GPS update interval | 10 seconds (foreground) |
| Background GPS interval | 15 seconds |
| Bus position TTL (auto-purge) | 1 hour |
| Automated cron jobs | 5 |
| JWT access token lifetime | 15 minutes |
| API rate limit | 100 req / 15 min |
| Socket.io auto-reconnect attempts | 10 |
| Genetic Algorithm generations | 100 |
| GA population size | 50 schedules |

---

*Built for the Delhi Transport Corporation | Final Year Capstone 2024-25*  
*Stack: Node.js - Next.js - React Native - Python FastAPI - TensorFlow - XGBoost - MongoDB - Socket.io*
