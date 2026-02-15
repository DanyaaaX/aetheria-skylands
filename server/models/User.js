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
    lowercase: true, // Завжди зберігаємо в нижньому регістрі для уникнення дублів
    trim: true,
    index: true 
  },
  
  username: { 
    type: String, 
    unique: true, 
    required: true, // Юзер вводить його після підключення гаманця
    trim: true,
    minlength: [3, 'Username must be at least 3 chars'],
    maxlength: [15, 'Username must be max 15 chars'],
    match: [/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed'] 
  },

  publicKey: { 
    type: String, 
    required: false, // Зробив необов'язковим, бо іноді TonConnect може не віддати його одразу
    select: false    // Не повертати це поле при звичайних запитах (безпека)
  },

  // ==========================================
  // 🛡 SECURITY (Безпека)
  // ==========================================
  nonce: { 
    type: String, 
    required: true,
    default: () => uuidv4(),
    select: false // Приховуємо nonce від фронтенду
  },

  // ==========================================
  // 🤝 REFERRAL SYSTEM (Рефералка)
  // ==========================================
  referralCode: { 
    type: String, 
    unique: true, 
    lowercase: true,
    index: true 
    // required: true прибрали, бо він генерується автоматично хуком нижче
  },
  
  referredBy: { 
    type: String, 
    default: null,
    index: true 
  },
  
  inviteCount: { 
    type: Number, 
    default: 0,
    index: -1 // Оптимізація для сортування (ТОП за інвайтами)
  },

  // ==========================================
  // 💰 ECONOMY & PROGRESS (Економіка)
  // ==========================================
  points: { 
    type: Number, 
    default: 0,
    index: -1 // Оптимізація для сортування (ТОП за очками)
  },

  dailyStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: null },

  // ==========================================
  // 🌐 SOCIALS & INTEGRATIONS (Соцмережі)
  // ==========================================
  telegramHandle: { type: String, default: null, trim: true },
  twitterHandle: { type: String, default: null, trim: true },
  
  telegramId: { 
    type: String, 
    default: null, 
    unique: true, 
    sparse: true, // Дозволяє багато NULL значень (якщо не прив'язав ТГ)
    select: false // Приховуємо ID для безпеки
  },

  socialsFollowed: {
    twitter: { type: Boolean, default: false },
    telegram: { type: Boolean, default: false }
  },

  // ==========================================
  // 🏆 STATUSES (Статуси)
  // ==========================================
  hasPaidEarlyAccess: { type: Boolean, default: false },
  hasMintedNFT: { type: Boolean, default: false },

}, { 
  timestamps: true // Автоматичні поля createdAt та updatedAt
});

/**
 * 🔥 AUTOMATION HOOKS 🔥
 * Цей код спрацьовує ПЕРЕД збереженням у базу.
 * Він автоматично створює реферальний код із Username.
 */
UserSchema.pre('save', function(next) {
  // 1. Генерація реферального коду
  if (this.isModified('username') || (this.isNew && !this.referralCode)) {
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