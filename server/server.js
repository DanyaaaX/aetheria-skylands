import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';

// Імпорти модулів (обов'язково з розширенням .js)
import connectDB from '../lib/db.js'; 
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
import leaderboardRoutes from './routes/leaderboard.js';

const app = express();

// =================================================================
// 🔧 SERVER CONFIGURATION & MIDDLEWARE
// =================================================================

app.set('trust proxy', 1);

// 1. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// 2. CORS Configuration
// ОПТИМІЗАЦІЯ: .filter(Boolean) видаляє undefined, якщо FRONTEND_URL не задано в .env
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://aetheria-skylands.vercel.app',
  'https://aetheria.vercel.app',
  process.env.FRONTEND_URL 
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Дозволяємо запити без origin (наприклад, сервер-сервер або Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`⚠️ Blocked CORS for origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control'],
  maxAge: 86400 // ОПТИМІЗАЦІЯ: Кешування preflight (OPTIONS) запитів на 24 години для швидкодії
}));

// 3. Optimization & Logging
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '50kb' })); 
app.use(express.urlencoded({ extended: true, limit: '50kb' })); // ОПТИМІЗАЦІЯ: Надійна обробка Form Data

// 4. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

app.use('/api/', apiLimiter);

// =================================================================
// 🛣️ ROUTES MOUNTING
// =================================================================

app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health Checks
app.get('/health', (req, res) => res.status(200).json({ status: 'OK', timestamp: new Date() }));
app.get('/', (req, res) => res.send('🚀 Aetheria Skylands Backend is Running!'));

// =================================================================
// 🚨 ERROR HANDLING
// =================================================================

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 CRITICAL ERROR:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =================================================================
// 🚀 STARTUP SEQUENCE
// =================================================================

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000; 
    app.listen(PORT, () => {
      console.log(`\n✅ SERVER STARTED`);
      console.log(`🌍 URL: http://localhost:${PORT}`);
      console.log(`📅 Time: ${new Date().toISOString()}\n`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();