
import './config/loadEnv.js';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import connectRedis from 'connect-redis';
import rateLimit from 'express-rate-limit';
import passport from './auth/Passport.js'; // Import passport config
import authRoutes from './auth/authRoutes.js';
import chefRoutes from './routes/chefRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import geocodeRoutes from './routes/geocodeRoutes.js';
import proxyRoutes from './routes/proxyRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import socketService from './services/socketService.js';
import redis from './config/redis.js';
import compression from 'compression';
import helmet from 'helmet';
import hpp from 'hpp';
import { initScheduledJobs } from './services/cronService.js';
import { logger } from './utils/logger.js';

const RedisStore = connectRedis(session);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Trust proxy (important for production deployments)
app.set('trust proxy', 1);

// Security: Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET is not set in environment variables');
}
if (!process.env.SESSION_SECRET) {
  throw new Error('FATAL: SESSION_SECRET is not set in environment variables');
}

// Security: CORS configuration with environment-based origins
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
    'https://chef-hub-coral.vercel.app', // Updated Vercel URL
    // Vercel preview / project URL
    // Add other verified production URLs here (or move to env-based list)
  ]
  : [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Security: Request size limits to prevent DOS attacks
app.use(express.json({ limit: '10mb' })); // Limit JSON payload
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Limit URL-encoded data

// Serve uploaded files statically with basic security
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  etag: true,
  setHeaders: (res, path) => {
    // Prevent directory listing and set proper content types
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Security: General rate limiter for all requests
const generalLimiter = process.env.NODE_ENV === 'production'
  ? rateLimit({
    windowMs: 15 * 1000, // 15 sec
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  })
  : (req, res, next) => next();

// Security: Strict rate limiter for authentication endpoints
const authLimiter = process.env.NODE_ENV === 'production'
  ? rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again after 15 minutes.',
    skipSuccessfulRequests: true,
  })
  : (req, res, next) => next();

app.use(generalLimiter);

// Session Middleware with Redis Store (production-ready)
app.use(session({
  store: new RedisStore({
    client: redis,
    prefix: 'chefhub:sess:',
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production (requires HTTPS)
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  name: 'sessionId', // Don't use default 'connect.sid' name
}));

//optimizers

app.use(compression());

// Security: Enhanced Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow external resources
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests
}));

// Security: Prevent HTTP Parameter Pollution
app.use(hpp());

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes

app.use('/api/auth', authLimiter, authRoutes); // Apply strict rate limiting to auth
app.use('/api/chefs', chefRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api', healthRoutes);

// Security: 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Security: Global error handler (don't expose stack traces in production)
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('MongoDB connected successfully');

    // Initialize Socket.io
    socketService.init(server);

    // Initialize Chef Search Index (Redis)
    /** 
     * NOTE: redisIndexService is currently missing from the codebase.
     * Commenting out to prevent startup errors.
    (async () => {
      try {
        await redisIndexService.initChefIndex();
      } catch (err) {
        logger.error('Failed to initialize Redis Index:', err);
      }
    })();
    */

    // Initialize Cron Jobs
    initScheduledJobs();

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        socketEnabled: true
      });
    });
  })
  .catch(err => {
    logger.error('MongoDB connection error', { error: err.message, stack: err.stack });
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server gracefully...');
  server.close(() => {
    logger.info('Server closed');
    redis.quit();
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing server gracefully...');
  server.close(() => {
    logger.info('Server closed');
    redis.quit();
    mongoose.connection.close();
    process.exit(0);
  });
});
