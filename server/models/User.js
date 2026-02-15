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
    // 🔥 ВАЖЛИВО: ПРИБИРАЄМО required: true, бо при першому вході його ще немає!
    // required: true, 
    trim: true,
    minlength: [3, 'Username must be at least 3 chars'],
    maxlength: [15, 'Username must be max 15 chars'],
    match: [/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed'],
    
    // 🔥 АВТО-ГЕНЕРАЦІЯ ТИМЧАСОВОГО НІКУ (Щоб база не сварилася)
    default: function() {
       return `G-${this.walletAddress.slice(0,6).toUpperCase()}`;
    }
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
  hasMintedNFT: { type: Boolean, default: false },

}, { timestamps: true });

/**
 * 🔥 AUTOMATION HOOKS 🔥
 */
UserSchema.pre('save', function(next) {
  // 1. Якщо рефералки немає - створюємо її з username
  if (!this.referralCode) {
     if (this.username) {
        this.referralCode = this.username.toLowerCase();
     } else {
        // Якщо навіть username немає (раптом), то з гаманця
        this.referralCode = `ref-${this.walletAddress.slice(0,8)}`;
     }
  }

  // 2. Гарантія нижнього регістру для гаманця
  if (this.isModified('walletAddress')) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }

  next();
});

module.exports = mongoose.model('User', UserSchema);