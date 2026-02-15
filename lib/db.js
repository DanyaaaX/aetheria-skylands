const mongoose = require('mongoose');

// 👇 Шлях до моделі. Оскільки файл лежить в папці /lib, 
// ми виходимо на рівень вгору (..) і заходимо в server/models
const User = require('../server/models/User'); 

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!MONGODB_URI) {
      throw new Error("❌ CRITICAL: MONGODB_URI is not defined in .env");
    }

    // Перевірка: якщо вже підключено, не підключаємось знову
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ============================================================
    // 🚑 AUTO-FIX: ВИДАЛЕННЯ СТАРОГО "ЗЛАМАНОГО" ІНДЕКСУ
    // ============================================================
    try {
      // Це критично для вирішення вашої помилки E11000 duplicate key
      await User.collection.dropIndex('telegramId_1');
      console.log('🔧 FIXED: Old telegramId index dropped successfully. New sparse index will be used.');
    } catch (err) {
      // Якщо індексу вже немає - це нормально
      // console.log('ℹ️ Index check: Clean'); 
    }
    // ============================================================

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1); // Зупиняємо сервер, якщо немає бази
  }
};

module.exports = connectDB;