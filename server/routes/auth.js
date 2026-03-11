import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js'; // Обов'язково з .js

const router = express.Router();

// --- APP SETTINGS (З твого оригінального коду) ---
const ADMIN_WALLET = process.env.ADMIN_WALLET;
const EARLY_ACCESS_COST_NANO = 1;

if (!ADMIN_WALLET) {
  console.error("🚨 CRITICAL: ADMIN_WALLET is not defined in environment variables.");
}

// --- CRYPTO & BLOCKCHAIN HELPERS ---

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

const verifyOnChainPayment = async (userWalletAddress) => {
  try {
    console.log(`🔍 [CHECK] Payment check for: ${userWalletAddress}`);
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
        console.log(`✅ FOUND! From: ${sourceFriendly} | Amount: ${value}`);
      }
      return isMatch && value >= BigInt(EARLY_ACCESS_COST_NANO);
    });
    
    return !!validTx;
  } catch (err) {
    console.error("💥 Payment Error:", err.message);
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
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ error: 'Wallet required' });

    const lowerWallet = walletAddress.toLowerCase();
    const user = await User.findOne({ walletAddress: lowerWallet });

    if (user) {
      return res.status(200).json({ success: true, user: user });
    } else {
      return res.status(200).json({ success: false, needsRegistration: true });
    }

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { walletAddress, username, referralCode } = req.body;

    if (!walletAddress || !username) {
      return res.status(400).json({ error: 'Wallet and Username are required' });
    }

    const lowerWallet = walletAddress.toLowerCase();
    const cleanUsername = username.trim();

    const existingNick = await User.findOne({ 
      username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } 
    });
    if (existingNick) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const existingWallet = await User.findOne({ walletAddress: lowerWallet });
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet already registered' });
    }

    // Creating User
    const newUser = await User.create({
      walletAddress: lowerWallet,
      username: cleanUsername,
      referralCode: cleanUsername.toLowerCase(),
      referredBy: referralCode || null,
      nonce: uuidv4(),
      socialsFollowed: { twitter: false, telegram: false },
      telegramId: null, // Explicitly set null, handled by sparse index now
      hasPaidEarlyAccess: false,
      hasMintedNFT: false
    });

    // Referral Bonus Logic
    if (referralCode) {
      await User.findOneAndUpdate(
        { referralCode: referralCode.toLowerCase() },
        { $inc: { inviteCount: 1, points: 500 } }
      );
    }

    return res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

/**
 * POST /api/auth/update-socials
 */
router.post('/update-socials', async (req, res) => {
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
 */
router.post('/mint', async (req, res) => {
  const { walletAddress, updateField } = req.body;
  
  try {
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

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

export default router;