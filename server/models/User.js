import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

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
  // 🛡 SECURITY
  // ==========================================
  nonce: { type: String, required: true, default: () => uuidv4() },

  // ==========================================
  // 🤝 REFERRAL SYSTEM
  // ==========================================
  // sparse: true тут важливий, щоб уникнути конфліктів, якщо поле раптом буде порожнім
  referralCode: { type: String, unique: true, lowercase: true, sparse: true },
  referredBy: { type: String, default: null, index: true },
  inviteCount: { type: Number, default: 0, index: true }, 

  // ==========================================
  // 💰 ECONOMY
  // ==========================================
  points: { type: Number, default: 0, index: true },
  dailyStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: null },

  // ==========================================
  // 💎 VIP SYSTEM
  // ==========================================
  nftReferralsCount: { type: Number, default: 0 },
  isVip: { type: Boolean, default: false },

  // ==========================================
  // 🌐 SOCIALS
  // ==========================================
  telegramHandle: { type: String, default: null, trim: true },
  twitterHandle: { type: String, default: null, trim: true },
  
  // 🔥 КРИТИЧНО ВАЖЛИВО: sparse: true дозволяє мати багато користувачів з telegramId: null
  telegramId: { type: String, default: null, unique: true, sparse: true },

  socialsFollowed: {
    twitter: { type: Boolean, default: false },
    telegram: { type: Boolean, default: false }
  },

  // ==========================================
  // 🏆 STATUSES
  // ==========================================
  hasPaidEarlyAccess: { type: Boolean, default: false },
  hasMintedNFT: { type: Boolean, default: false },

}, { timestamps: true });

/**
 * 🔥 AUTOMATION HOOKS
 */
UserSchema.pre('save', function(next) {
  // 1. Авто-генерація реферального коду з юзернейму
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

// ✅ Експорт для ES Modules
// Перевірка mongoose.models.User запобігає помилці "OverwriteModelError" при перезапуску
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;