require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 1. ІНІЦІАЛІЗАЦІЯ APP
const app = express();

// --- ВАЖЛИВО ДЛЯ RENDER ---
app.set('trust proxy', 1);

// 2. ІМПОРТ МАРШРУТІВ
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');
const paymentRoutes = require('./routes/payment');

// 3. БЕЗПЕКА ТА MIDDLEWARE
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// --- ВИПРАВЛЕНИЙ CORS ---
// Дозволяємо доступ конкретно твоєму фронтенду
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://aetheria-skylands.vercel.app', // Твій Vercel
  'https://aetheria.vercel.app' // Альтернативний домен (якщо є)
];

app.use(cors({
  origin: function (origin, callback) {
    // Дозволяємо запити без origin (наприклад, Postman або мобільні додатки)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      // Якщо origin немає в списку, але ми хочемо дозволити для тесту, можна тимчасово:
      // return callback(null, true); 
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control']
}));

// --- ЛОГУВАННЯ ЗАПИТІВ (Щоб бачити в Render Logs) ---
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Обмеження запитів
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5000, 
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false } 
});

app.use(express.json({ limit: '50kb' }));
app.use('/api/', apiLimiter);

// 4. МАРШРУТИ
console.log(">> SYSTEM: Initializing Routes...");

// Важливо: перевір файл routes/leaderboard.js (див. Крок 2 нижче)
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/payment', paymentRoutes);

// 5. HEALTH CHECKS
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));
app.get('/', (req, res) => res.send('Aetheria Backend Active'));

// 6. ЗАПУСК
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI; 

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('>>> DB CONNECTION: SUCCESS');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`>>> SERVER LISTENING ON PORT ${PORT}`);
    });
  })
  .catch(err => {
    console.error('!!! DB CONNECTION FAILED:', err.message);
  });