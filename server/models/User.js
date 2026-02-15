const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    unique: true, 
    required: true, 
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 15,
    match: /^[A-Z0-9]+$/ // STRICT: Alphanumeric ONLY
  },
  walletAddress: { 
    type: String, 
    unique: true, 
    required: true, 
    index: true 
  },
  publicKey: { 
    type: String, 
    required: true 
  },
  nonce: { 
    type: String, 
    required: true,
    default: () => uuidv4()
  },
  referralCode: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true 
  },
  referredBy: { 
    type: String, 
    default: null,
    index: true 
  },
  inviteCount: { type: Number, default: 0 },
  points: { type: Number, default: 0 },

  // --- НОВІ ПОЛЯ (SOCIALS & GAMEPLAY) ---
  telegramHandle: { type: String, default: null }, // Зберігає @username
  twitterHandle: { type: String, default: null },  // Зберігає @username
  
  dailyStreak: { type: Number, default: 0 },       // Для підрахунку днів входу
  lastLoginDate: { type: Date, default: null },    // Дата останнього входу
  // --------------------------------------

  hasPaidEarlyAccess: { type: Boolean, default: false },
  hasMintedNFT: { type: Boolean, default: false },
  
  socialsFollowed: {
    twitter: { type: Boolean, default: false },
    telegram: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);