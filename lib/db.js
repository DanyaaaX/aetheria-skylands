import mongoose from 'mongoose';

// Важливо: в ESM треба писати розширення файлу .js
import User from '../server/models/User.js'; 

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!MONGODB_URI) {
      throw new Error("❌ CRITICAL: MONGODB_URI is not defined in .env");
    }

    if (mongoose.connection.readyState >= 1) {
      return;
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ============================================================
    // 🚑 AUTO-FIX: ВИДАЛЕННЯ СТАРОГО "ЗЛАМАНОГО" ІНДЕКСУ
    // ============================================================
    try {
      await User.collection.dropIndex('telegramId_1');
      console.log('🔧 FIXED: Old telegramId index dropped successfully.');
    } catch (err) {
      // Ігноруємо, якщо індексу немає
    }
    // ============================================================

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

export default connectDB;