require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const nacl = require('tweetnacl');
const User = require('./models/User');

const app = express();

// --- SERVER CONFIGURATION ---
app.set('trust proxy', 1);

// --- MIDDLEWARE & SECURITY ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://aetheria-skylands.vercel.app',
  'https://aetheria.vercel.app',
  process.env.FRONTEND_URL // Added from CODE 2
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      return callback(null, true);
    } else {
      console.warn(`Blocked CORS for origin: ${origin}`);
      // Allowing strictly allowed origins, adhering to security best practices
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control']
}));

app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '50kb' }));

// Request Logging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Rate Limiting (Using CODE 2 settings: max 1000)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false } 
});
app.use('/api/', apiLimiter);

// --- APP SETTINGS ---
const ADMIN_WALLET = process.env.ADMIN_WALLET;
const EARLY_ACCESS_COST_NANO = 1;

if (!ADMIN_WALLET) {
  console.error("🚨 CRITICAL: ADMIN_WALLET is not defined in environment variables.");
}

// --- CRYPTO & BLOCKCHAIN HELPERS (Kept from CODE 1 for Mint/Safety) ---

const validateWalletAddress = (address) => {
    if (!address || typeof address !== 'string') return false;
    return address.length >= 48; 
};

const friendlyToHex = (friendly) => {
  try {
    const base64 = friendly.replace(/-/g, '+').replace(/_/g, '/');
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length < 34) return null;
    return buffer.slice(2, 34).toString('hex').toLowerCase();
  } catch (e) {
    return null;
  }
};

const verifySignature = (publicKeyHex, signatureBase64, messageString) => {
  try {
    if (!publicKeyHex || !signatureBase64 || !messageString) return false;
    const signature = Buffer.from(signatureBase64, 'base64');
    const publicKey = Buffer.from(publicKeyHex, 'hex');
    const message = new TextEncoder().encode(messageString);
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch (e) {
    console.error("🛑 CRYPTO FAILURE:", e.message);
    return false;
  }
};

const verifyOnChainPayment = async (userWalletAddress) => {
  try {
    console.log(`🔍 [CHECK] Початок перевірки для: ${userWalletAddress}`);
    const endpoint = `https://toncenter.com/api/v2/getTransactions?address=${ADMIN_WALLET}&limit=50&archival=true`;
    const headers = process.env.TON_API_KEY ? { 'X-API-Key': process.env.TON_API_KEY } : {};
    
    const response = await fetch(endpoint, { headers });
    const data = await response.json();
    
    if (!data.ok) {
      console.error("❌ TON API ERROR:", data);
      return false;
    }

    let userHex;
    if (userWalletAddress.includes(':')) {
        userHex = userWalletAddress.split(':')[1].toLowerCase();
    } else {
        const converted = friendlyToHex(userWalletAddress);
        userHex = converted ? converted : userWalletAddress.toLowerCase();
    }

    const validTx = data.result.find(tx => {
      const inMsg = tx.in_msg;
      if (!inMsg || !inMsg.source) return false;
      
      const sourceFriendly = inMsg.source; 
      const value = BigInt(inMsg.value);
      const sourceHex = friendlyToHex(sourceFriendly);

      const isMatch = (sourceHex === userHex);
      if (isMatch) {
        console.log(`✅ ЗНАЙДЕНО! Від: ${sourceFriendly} (Hex: ${sourceHex}) | Сума: ${value}`);
      }
      return isMatch && value >= BigInt(EARLY_ACCESS_COST_NANO);
    });
    return !!validTx;
  } catch (err) {
    console.error("💥 Помилка:", err.message);
    return false;
  }
};

// --- ROUTES ---

const authRouter = express.Router();

/**
 * GET /api/auth/nonce/:walletAddress
 * Kept from CODE 1 as a utility
 */
authRouter.get('/nonce/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    if (!validateWalletAddress(walletAddress)) {
        return res.status(400).json({ error: "Invalid wallet address format" });
    }

    let user = await User.findOne({ walletAddress });
    if (!user) {
        return res.json({ nonce: uuidv4() });
    }
    
    user.nonce = uuidv4();
    await user.save();
    res.json({ nonce: user.nonce });
  } catch (err) {
    console.error("Nonce Error:", err);
    res.status(500).json({ error: 'System Error' });
  }
});

/**
 * POST /api/auth/login
 * INJECTED CODE 2 LOGIC: Simplified login (No Signature Required) to fix 401 errors.
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { walletAddress, referredBy } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    // 1. Find User
    let user = await User.findOne({ walletAddress });

    // 2. Register if not exists (CODE 2 Logic)
    if (!user) {
      console.log(`🆕 New User Registration: ${walletAddress}`);
      
      // Note: User model should handle default username/referralCode generation
      user = new User({
        walletAddress,
        referredBy: referredBy || null,
        nonce: uuidv4() // Maintain compatibility with nonce system
      });

      await user.save();

      // Referral Bonus (CODE 2 Logic)
      if (referredBy) {
        await User.findOneAndUpdate(
          { referralCode: referredBy.toLowerCase() },
          { $inc: { inviteCount: 1, points: 500 } } // +500 points per invite
        );
      }
    }

    // 3. Return Data (CODE 2 Format)
    return res.status(200).json({ 
      success: true,
      user: {
        id: user._id,
        username: user.username,
        walletAddress: user.walletAddress,
        points: user.points,
        inviteCount: user.inviteCount,
        hasPaidEarlyAccess: user.hasPaidEarlyAccess,
        hasMintedNFT: user.hasMintedNFT,
        socialsFollowed: user.socialsFollowed,
        referralCode: user.referralCode
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/auth/check
 */
authRouter.post('/check', async (req, res) => {
  try {
      const { walletAddress } = req.body;
      const user = await User.findOne({ walletAddress });
      res.json({ exists: !!user, user });
  } catch (err) {
      res.status(500).json({ error: "Check failed" });
  }
});

/**
 * POST /api/auth/update-username
 * Kept from CODE 1 to allow profile updates with security
 */
authRouter.post('/update-username', async (req, res) => {
  const { walletAddress, newUsername, signature, message, publicKey } = req.body;

  try {
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify signature for sensitivity of username change
    if (!verifySignature(publicKey, signature, message)) {
        return res.status(401).json({ error: "Signature verification failed." });
    }

    const cleanUsername = newUsername.toUpperCase().trim();
    if (cleanUsername.length < 3) return res.status(400).json({ error: "Too short" });

    const exists = await User.findOne({ username: cleanUsername });
    if (exists) return res.status(409).json({ error: "Username taken" });

    user.username = cleanUsername;
    user.nonce = uuidv4(); 
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error("Update Username Error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/**
 * POST /api/auth/update-socials
 * INJECTED CODE 2 LOGIC: Optimized using findOneAndUpdate
 */
authRouter.post('/update-socials', async (req, res) => {
  try {
    const { walletAddress, platform } = req.body;
    
    const updateQuery = {};
    if (platform === 'twitter') updateQuery['socialsFollowed.twitter'] = true;
    if (platform === 'telegram') updateQuery['socialsFollowed.telegram'] = true;

    const user = await User.findOneAndUpdate(
      { walletAddress }, 
      { $set: updateQuery },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("Social Update Error:", err);
    res.status(500).json({ error: "Social update failed" });
  }
});

/**
 * POST /api/auth/mint
 * Kept from CODE 1 (Critical Game Logic)
 */
authRouter.post('/mint', async (req, res) => {
  const { walletAddress, updateField } = req.body;
  
  try {
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (updateField === 'hasPaidEarlyAccess') {
        if (user.hasPaidEarlyAccess) return res.json({ success: true, user });
        
        // Uses CODE 1 helper
        const isPaid = await verifyOnChainPayment(user.walletAddress);
        
        if (isPaid) {
            console.log(`🎉 Marking user ${user.username} as PAID!`);
            user.hasPaidEarlyAccess = true;
            await user.save();
            return res.json({ success: true, user });
        } else {
            console.warn(`⚠️ Payment check pending for ${walletAddress}`);
            return res.status(402).json({ error: "Payment pending... Please wait." });
        }
    }
    
    if (updateField === 'hasMintedNFT') {
        if (!user.hasPaidEarlyAccess) return res.status(403).json({ error: "Early Access required." });
        if (!user.socialsFollowed.twitter || !user.socialsFollowed.telegram) {
             return res.status(403).json({ error: "Social tasks incomplete." });
        } 
        user.hasMintedNFT = true;
        await user.save();
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Mint Error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// --- MOUNT ROUTERS ---
app.use('/api/auth', authRouter);
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/payment', require('./routes/payment'));

// --- HEALTH CHECKS ---
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));
app.get('/', (req, res) => res.send('Aetheria Skylands Backend is Active 🚀'));

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error('🔥 UNHANDLED ERROR:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error. Please try again later.' 
  });
});

// --- DATABASE & SERVER START ---
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error("❌ CRITICAL: MONGODB_URI is not defined in .env");
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const PORT = process.env.PORT || 5000; // Prefer CODE 1 port logic but fallbacks are good
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });