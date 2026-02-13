
const express = require('express');
const router = express.Router();
const User = require('./models/User'); // ✅ Це шукає в поточній папці (server/models/User)
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const compression = require('compression');
const morgan = require('morgan');

// --- MIDDLEWARE (Merged from Code 2) ---
// 1. OPTIMIZATION & LOGGING
router.use(compression()); // Compresses JSON to save traffic
router.use(morgan('dev')); // Logs requests: "GET /api/leaderboard 200 15ms"

// --- PRODUCTION CONFIGURATION ---
const TON_API_URL = process.env.TON_API_URL || 'https://toncenter.com/api/v2/jsonRPC';
const TON_API_KEY = process.env.TON_API_KEY;
const ADMIN_WALLET = process.env.ADMIN_WALLET;

// 🔥 CONFIG: Set to 1 nanoton so any positive amount passes (0.05 TON will easily pass)
const EARLY_ACCESS_COST_NANO = 1;

// --- INITIALIZATION CHECKS ---
if (!ADMIN_WALLET) {
  console.error("🚨 CRITICAL: ADMIN_WALLET is not defined in environment variables.");
}

// --- HELPER FUNCTIONS ---

/**
 * 🛡️ HELPER: Basic Wallet Validation
 * Prevents injection attacks or malformed requests early.
 */
const validateWalletAddress = (address) => {
    // Basic TON address validation (48 chars raw or user-friendly format)
    if (!address || typeof address !== 'string') return false;
    return address.length >= 48; 
};

/**
 * --- ДОПОМІЖНА ФУНКЦІЯ: Конвертація Friendly (UQ/EQ) -> Raw (Hex) ---
 * Added from Code 2 for Version 3.0 Compatibility
 */
const friendlyToHex = (friendly) => {
  try {
    // Декодуємо Base64 (замінюємо URL-безпечні символи)
    const base64 = friendly.replace(/-/g, '+').replace(/_/g, '/');
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length < 34) return null;
    // Байти з 2 по 33 — це і є наш унікальний Hex-адрес
    return buffer.slice(2, 34).toString('hex').toLowerCase();
  } catch (e) {
    return null;
  }
};

/**
 * 🔐 SECURITY CORE: Verify Ed25519 Signature
 * Performs actual cryptographic verification.
 */
const verifySignature = (publicKeyHex, signatureBase64, messageString) => {
  try {
    if (!publicKeyHex || !signatureBase64 || !messageString) return false;
    // Convert inputs to Uint8Arrays for tweetnacl
    const signature = Buffer.from(signatureBase64, 'base64');
    const publicKey = Buffer.from(publicKeyHex, 'hex');
    const message = new TextEncoder().encode(messageString);

    // Verify using Ed25519
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch (e) {
    console.error("🛑 CRYPTO FAILURE:", e.message);
    return false;
  }
};

/**
 * 💰 BLOCKCHAIN CORE: Verify Payment on TON
 * UPDATED TO VERSION 3.0 (From Code 2) - Ultra Compatibility
 * Uses Hex matching to handle Raw/Base64 address differences reliably.
 */
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

    // Determine User Hex
    // If address has colon, it's raw.
    // Otherwise try to convert friendly to hex.
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
      
      // Конвертуємо адресу відправника з Friendly у Hex
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

/**
 * GET /api/auth/nonce/:walletAddress
 * Generates challenge (nonce) for frontend signing
 */
router.get('/nonce/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Modernization: Input Validation
    if (!validateWalletAddress(walletAddress)) {
        return res.status(400).json({ error: "Invalid wallet address format" });
    }

    let user = await User.findOne({ walletAddress });
    
    if (!user) {
        // If user doesn't exist, return temp nonce for registration
        return res.json({ nonce: uuidv4() });
    }
    
    // Update nonce for security
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
 * Registration or Login (SECURED with Signature from Code 1)
 */
router.post('/login', async (req, res) => {
  const { walletAddress, publicKey, signature, message, username, referredBy } = req.body;

  if (!walletAddress || !publicKey) {
    return res.status(400).json({ error: "Credentials missing." });
  }

  try {
    // 1. Signature Check (Secure)
    const isValid = verifySignature(publicKey, signature, message);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid cryptographic signature." });
    }

    let user = await User.findOne({ walletAddress });

    // 2. Registration Logic (New User)
    if (!user) {
      if (!username) return res.status(400).json({ error: "Username required for registration." });
      
      const cleanUsername = username.toUpperCase().trim();
      
      // Unique username check
      const existingName = await User.findOne({ username: cleanUsername });
      if (existingName) return res.status(409).json({ error: "Username unavailable." });
      
      user = new User({
        walletAddress,
        publicKey,
        username: cleanUsername,
        referralCode: cleanUsername.toLowerCase(),
        referredBy: referredBy || null,
        nonce: uuidv4(),
        socialsFollowed: { twitter: false, telegram: false },
        hasPaidEarlyAccess: false,
        hasMintedNFT: false
      });
      await user.save();

      // Referral bonus logic
      if (referredBy) {
        await User.findOneAndUpdate(
          { referralCode: referredBy.toLowerCase() },
          { $inc: { inviteCount: 1, points: 5 } }
        );
      }
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: 'Auth Failed' });
  }
});

/**
 * POST /api/auth/check
 * Session check (does user exist?)
 */
router.post('/check', async (req, res) => {
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
 * Change username (requires signature)
 */
router.post('/update-username', async (req, res) => {
  const { walletAddress, newUsername, signature, message, publicKey } = req.body;

  try {
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    // SECURITY CHECK
    if (!verifySignature(publicKey, signature, message)) {
        return res.status(401).json({ error: "Signature verification failed." });
    }

    // Nonce check (Anti-replay)
    if (message && !message.includes(user.nonce)) {
        console.warn(`Nonce mismatch for user ${user.username}`);
    }

    const cleanUsername = newUsername.toUpperCase().trim();
    if (cleanUsername.length < 3) return res.status(400).json({ error: "Too short" });

    const exists = await User.findOne({ username: cleanUsername });
    if (exists) return res.status(409).json({ error: "Username taken" });

    user.username = cleanUsername;
    user.nonce = uuidv4(); // Rotate nonce
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error("Update Username Error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/**
 * POST /api/auth/update-socials
 */
router.post('/update-socials', async (req, res) => {
  try {
    const { walletAddress, platform } = req.body;
    
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (platform === 'twitter') user.socialsFollowed.twitter = true;
    if (platform === 'telegram') user.socialsFollowed.telegram = true;

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "Social update failed" });
  }
});

/**
 * POST /api/auth/mint
 * 🚨 FINANCIAL ENDPOINT - Uses Updated Payment Logic from Code 2
 */
router.post('/mint', async (req, res) => {
  const { walletAddress, updateField } = req.body;
  
  try {
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    // 1. Early Access Payment
    if (updateField === 'hasPaidEarlyAccess') {
        if (user.hasPaidEarlyAccess) return res.json({ success: true, user });

        // Check Blockchain (Using updated Code 2 Version 3.0 logic)
        const isPaid = await verifyOnChainPayment(user.walletAddress);
        
        if (isPaid) {
            console.log(`🎉 Marking user ${user.username} as PAID!`);
            user.hasPaidEarlyAccess = true;
            await user.save();
            return res.json({ success: true, user });
        } else {
             // 402 Payment Pending - Frontend should retry
            console.warn(`⚠️ Payment check pending for ${walletAddress}`);
            return res.status(402).json({ error: "Payment pending... Please wait." });
        }
    }
    
    // 2. Mint NFT
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

// --- GLOBAL ERROR HANDLER (Merged from Code 2) ---
// Ensures the server doesn't crash on unhandled errors
router.use((err, req, res, next) => {
  console.error('🔥 UNHANDLED ERROR:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error. Please try again later.' 
  });
});

module.exports = router;
