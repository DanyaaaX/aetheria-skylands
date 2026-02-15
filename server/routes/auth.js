import express from 'express';
import nacl from 'tweetnacl';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto'; // Залишаємо, якщо використовується десь приховано, хоча основна крипта тут на nacl

// 👇 ВАЖЛИВО: Додаємо .js в кінці імпорту
import User from '../models/User.js';

const router = express.Router();

// --- PRODUCTION CONFIGURATION ---
const TON_API_URL = process.env.TON_API_URL || 'https://toncenter.com/api/v2/jsonRPC';
const TON_API_KEY = process.env.TON_API_KEY;
const ADMIN_WALLET = process.env.ADMIN_WALLET;

// 🔥 CONFIG: Cost in NanoTON
const EARLY_ACCESS_COST_NANO = 1;

// --- INITIALIZATION CHECKS ---
if (!ADMIN_WALLET) {
  console.error("🚨 CRITICAL: ADMIN_WALLET is not defined in environment variables.");
}

// --- HELPER FUNCTIONS ---

/**
 * 🛡️ HELPER: Basic Wallet Validation
 */
const validateWalletAddress = (address) => {
    if (!address || typeof address !== 'string') return false;
    return address.length >= 48; 
};

/**
 * --- ДОПОМІЖНА ФУНКЦІЯ: Конвертація Friendly (UQ/EQ) -> Raw (Hex) ---
 */
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

/**
 * 🔐 SECURITY CORE: Verify Ed25519 Signature
 */
const verifySignature = (publicKeyHex, signatureBase64, messageString) => {
  try {
    if (!publicKeyHex || !signatureBase64 || !messageString) return false;
    
    // Convert inputs for tweetnacl
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

/**
 * GET /api/auth/nonce/:walletAddress
 */
router.get('/nonce/:walletAddress', async (req, res) => {
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
 */
router.post('/login', async (req, res) => {
  const { walletAddress, publicKey, signature, message, username, referredBy } = req.body;

  if (!walletAddress || !publicKey) {
    return res.status(400).json({ error: "Credentials missing." });
  }

  try {
    // 1. Signature Check
    const isValid = verifySignature(publicKey, signature, message);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid cryptographic signature." });
    }

    let user = await User.findOne({ walletAddress });

    // 2. Registration Logic
    if (!user) {
      if (!username) return res.status(400).json({ error: "Username required for registration." });
      
      const cleanUsername = username.trim(); // Прибрав uppercase, краще зберігати як є, або lower
      
      const existingName = await User.findOne({ 
        username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } 
      });
      
      if (existingName) return res.status(409).json({ error: "Username unavailable." });

      user = new User({
        walletAddress,
        username: cleanUsername, // Зберігаємо як ввів юзер
        referralCode: cleanUsername.toLowerCase(),
        referredBy: referredBy || null,
        nonce: uuidv4(),
        socialsFollowed: { twitter: false, telegram: false },
        telegramId: null, // Важливо для sparse index
        hasPaidEarlyAccess: false,
        hasMintedNFT: false
      });

      await user.save();

      // Referral bonus
      if (referredBy) {
        await User.findOneAndUpdate(
          { referralCode: referredBy.toLowerCase() },
          { $inc: { inviteCount: 1, points: 500 } } // Оновив points до 500 (як було в server.js)
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

    // Nonce check
    if (message && !message.includes(user.nonce)) {
       console.warn(`Nonce mismatch for user ${user.username}`);
       // Можна розкоментувати, якщо хочемо жорстку перевірку:
       // return res.status(401).json({ error: "Invalid nonce" });
    }

    const cleanUsername = newUsername.trim();
    if (cleanUsername.length < 3) return res.status(400).json({ error: "Too short" });

    const exists = await User.findOne({ 
        username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') }
    });
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
 */
router.post('/update-socials', async (req, res) => {
  try {
    const { walletAddress, platform } = req.body;
    
    // Використовуємо findOneAndUpdate для атомарності
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
    res.status(500).json({ error: "Social update failed" });
  }
});

/**
 * POST /api/auth/mint
 */
router.post('/mint', async (req, res) => {
  const { walletAddress, updateField } = req.body;
  
  try {
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    // 1. Early Access Payment
    if (updateField === 'hasPaidEarlyAccess') {
        if (user.hasPaidEarlyAccess) return res.json({ success: true, user });

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

// Експортуємо router як default (це важливо для import в server.js)
export default router;