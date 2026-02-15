const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  // ==========================================
  // 🆔 IDENTITY (Ідентифікація)
  // ==========================================
  walletAddress: { 
    type: String, 
    unique: true, 
    required: true, 
    lowercase: true, 
    trim: true, 
    index: true 
  },
  
  username: { 
    type: String, 
    unique: true, 
    required: true, 
    trim: true,
    minlength: [3, 'Username must be at least 3 chars'],
    maxlength: [15, 'Username must be max 15 chars'],
    match: [/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed']
  },

  publicKey: { type: String, required: false },

  // ==========================================
  // 🛡 SECURITY (Безпека)
  // ==========================================
  // ✅ Зберігаємо nonce, щоб підписувати транзакції
  nonce: { type: String, required: true, default: () => uuidv4() },

  // ==========================================
  // 🤝 REFERRAL SYSTEM (Рефералка)
  // ==========================================
  // ✅ sparse: true тут теж корисний, про всяк випадок, якщо код колись буде null
  referralCode: { type: String, unique: true, lowercase: true, sparse: true }, 
  referredBy: { type: String, default: null, index: true },
  
  // ✅ index: true (для сортування лідерборду)
  inviteCount: { type: Number, default: 0, index: true }, 

  // ==========================================
  // 💰 ECONOMY & PROGRESS (Економіка)
  // ==========================================
  points: { type: Number, default: 0, index: true }, // ✅ Індекс для топу гравців
  dailyStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: null },

  // ==========================================
  // 💎 VIP SYSTEM (VIP Система)
  // ==========================================
  nftReferralsCount: { type: Number, default: 0 },
  isVip: { type: Boolean, default: false },

  // ==========================================
  // 🌐 SOCIALS & INTEGRATIONS (Соцмережі)
  // ==========================================
  telegramHandle: { type: String, default: null, trim: true },
  twitterHandle: { type: String, default: null, trim: true },
  
  // 🔥🔥🔥 ГОЛОВНЕ ВИПРАВЛЕННЯ 🔥🔥🔥
  // sparse: true дозволяє мати багато користувачів з telegramId: null
  telegramId: { type: String, default: null, unique: true, sparse: true },

  socialsFollowed: {
    twitter: { type: Boolean, default: false },
    telegram: { type: Boolean, default: false }
  },

  // ==========================================
  // 🏆 STATUSES (Статуси)
  // ==========================================
  hasPaidEarlyAccess: { type: Boolean, default: false },
  hasMintedNFT: { type: Boolean, default: false },

}, { timestamps: true });

/**
 * 🔥 AUTOMATION HOOKS 🔥
 */
UserSchema.pre('save', function(next) {
  // 1. Генерація реферального коду
  if (this.isModified('username') || this.isNew) {
    if (this.username) {
       this.referralCode = this.username.toLowerCase();
    }
  }

  // 2. Гарантія нижнього регістру для гаманця
  if (this.isModified('walletAddress') && this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }

  next();
});

// Експортуємо модель
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);