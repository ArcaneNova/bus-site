const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
require('dotenv').config();

const { initSocket } = require('./config/socket');
const logger = require('./utils/logger');
const errorMiddleware = require('./middleware/error.middleware');

// Route imports
const authRoutes      = require('./routes/auth.routes');
const routeRoutes     = require('./routes/route.routes');
const stageRoutes     = require('./routes/stage.routes');
const busRoutes       = require('./routes/bus.routes');
const driverRoutes    = require('./routes/driver.routes');
const scheduleRoutes  = require('./routes/schedule.routes');
const trackingRoutes  = require('./routes/tracking.routes');
const demandRoutes    = require('./routes/demand.routes');
const alertRoutes     = require('./routes/alert.routes');
const reportRoutes    = require('./routes/report.routes');
const mobileRoutes    = require('./routes/mobile.routes');
const publicRoutes    = require('./routes/public.routes');

const app = express();
const server = http.createServer(app);

// ── Init Socket.io ──────────────────────────────────────────────────────────
initSocket(server);

// ── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:19006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// Sanitise against NoSQL injection (mongo-sanitize)
app.use(mongoSanitize());

// Sanitise against XSS
app.use(xss());

// Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: ['status', 'routeId', 'driverId', 'busId', 'from', 'to', 'page', 'limit'],
}));

// ── Rate Limiting (tiered by role / endpoint sensitivity) ──────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

const exportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: 'Export rate limit exceeded. Try again in 5 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

app.use('/api/', globalLimiter);
app.use('/api/v1/auth/login',    authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/reports/export', exportLimiter);

// ── General Middleware ──────────────────────────────────────────────────────
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/v1/auth',     authRoutes);
app.use('/api/v1/routes',   routeRoutes);
app.use('/api/v1/stages',   stageRoutes);
app.use('/api/v1/buses',    busRoutes);
app.use('/api/v1/drivers',  driverRoutes);
app.use('/api/v1/schedule', scheduleRoutes);
app.use('/api/v1/tracking', trackingRoutes);
app.use('/api/v1/demand',   demandRoutes);
app.use('/api/v1/alerts',   alertRoutes);
app.use('/api/v1/reports',  reportRoutes);
app.use('/api/v1/mobile',   mobileRoutes);
app.use('/api/v1/public',   publicRoutes);

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = { app, server };
