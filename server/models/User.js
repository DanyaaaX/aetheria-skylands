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
    lowercase: true, // Завжди зберігаємо в нижньому регістрі
    trim: true, 
    index: true 
  },
  
  username: { 
    type: String, 
    unique: true, 
    required: true, // 🔥 ОБОВ'ЯЗКОВО: Юзер мусить ввести нік при реєстрації
    trim: true,
    minlength: [3, 'Username must be at least 3 chars'],
    maxlength: [15, 'Username must be max 15 chars'],
    match: [/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed']
    // ❌ ПРИБРАНО default: function()... (Авто-генерації більше немає)
  },

  publicKey: { type: String, required: false },

  // ==========================================
  // 🛡 SECURITY (Безпека)
  // ==========================================
  nonce: { type: String, required: true, default: () => uuidv4() },

  // ==========================================
  // 🤝 REFERRAL SYSTEM (Рефералка)
  // ==========================================
  referralCode: { type: String, unique: true, lowercase: true, index: true },
  referredBy: { type: String, default: null, index: true },
  inviteCount: { type: Number, default: 0, index: -1 },

  // ==========================================
  // 💰 ECONOMY & PROGRESS (Економіка)
  // ==========================================
  points: { type: Number, default: 0, index: -1 },
  dailyStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: null },

  // ==========================================
  // 💎 VIP SYSTEM (VIP Система)
  // ==========================================
  nftReferralsCount: { type: Number, default: 0 }, // Скільки друзів купили NFT
  isVip: { type: Boolean, default: false },        // Чи є юзер VIP-ом

  // ==========================================
  // 🌐 SOCIALS & INTEGRATIONS (Соцмережі)
  // ==========================================
  telegramHandle: { type: String, default: null, trim: true },
  twitterHandle: { type: String, default: null, trim: true },
  telegramId: { type: String, default: null, unique: true, sparse: true },

  socialsFollowed: {
    twitter: { type: Boolean, default: false },
    telegram: { type: Boolean, default: false }
  },

  // ==========================================
  // 🏆 STATUSES (Статуси)
  // ==========================================
  hasPaidEarlyAccess: { type: Boolean, default: false },
  hasMintedNFT: { type: Boolean, default: false }, // Для статусу Owner

}, { timestamps: true });

/**
 * 🔥 AUTOMATION HOOKS 🔥
 */
UserSchema.pre('save', function(next) {
  // 1. Генерація реферального коду
  // Оскільки username тепер обов'язковий, ми завжди беремо його
  if (this.isModified('username') || this.isNew) {
    if (this.username) {
       this.referralCode = this.username.toLowerCase();
    }
  }

  // 2. Гарантія нижнього регістру для гаманця
  if (this.isModified('walletAddress')) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }

  next();
});

module.exports = mongoose.model('User', UserSchema);