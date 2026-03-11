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
  referralCode: { type: String, unique: true, lowercase: true, sparse: true },
  
  // 🛑 ВИПРАВЛЕНО: Прибрано default: null. Для відсутності конфліктів краще залишати поле undefined
  referredBy: { type: String, index: true },
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
  telegramHandle: { type: String, trim: true },
  twitterHandle: { type: String, trim: true },
  
  // 🔥 КРИТИЧНО ВИПРАВЛЕНО: default: undefined (або його відсутність) дозволяє sparse працювати ідеально
  telegramId: { type: String, default: undefined, unique: true, sparse: true },

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
UserSchema.pre('save', async function() {
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
});

// ✅ Експорт для ES Modules
// Перевірка mongoose.models.User запобігає помилці "OverwriteModelError" при перезапуску
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;