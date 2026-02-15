import express from 'express';
import User from '../models/User.js'; // 👇 Обов'язково .js

const router = express.Router();

// --- КОНФІГУРАЦІЯ ---
const ADMIN_WALLET = process.env.ADMIN_WALLET;
const EARLY_ACCESS_COST_NANO = 1; // 1 nanotone (мінімальна сума для тесту)

// --- ДОПОМІЖНІ ФУНКЦІЇ ---

/**
 * Перетворення Friendly адреси в Hex (Raw)
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
 * Перевірка платежу в блокчейні TON
 */
const verifyOnChainPayment = async (userWalletAddress) => {
  try {
    const endpoint = `https://toncenter.com/api/v2/getTransactions?address=${ADMIN_WALLET}&limit=50&archival=true`;
    const headers = process.env.TON_API_KEY ? { 'X-API-Key': process.env.TON_API_KEY } : {};
    
    const response = await fetch(endpoint, { headers });
    const data = await response.json();
    
    if (!data.ok) {
      console.error("❌ TON API ERROR:", data);
      return false;
    }

    let userHex;
    // Визначаємо формат адреси юзера
    if (userWalletAddress.includes(':')) {
        userHex = userWalletAddress.split(':')[1].toLowerCase();
    } else {
        const converted = friendlyToHex(userWalletAddress);
        userHex = converted ? converted : userWalletAddress.toLowerCase();
    }

    // Шукаємо транзакцію
    const validTx = data.result.find(tx => {
      const inMsg = tx.in_msg;
      if (!inMsg || !inMsg.source) return false;
      
      const sourceFriendly = inMsg.source; 
      const value = BigInt(inMsg.value);
      const sourceHex = friendlyToHex(sourceFriendly);

      // Порівнюємо Hex адреси
      const isMatch = (sourceHex === userHex);
      
      if (isMatch) {
         console.log(`✅ PAYMENT FOUND! From: ${sourceFriendly} | Amount: ${value}`);
      }
      
      return isMatch && value >= BigInt(EARLY_ACCESS_COST_NANO);
    });

    return !!validTx;
  } catch (err) {
    console.error("💥 Payment Check Error:", err.message);
    return false;
  }
};

// --- МАРШРУТИ (ROUTES) ---

/**
 * GET /api/payment/status
 * Просто перевірка, чи працює сервіс
 */
router.get('/status', (req, res) => {
  res.json({ success: true, message: 'Payment verification service operational.' });
});

/**
 * POST /api/payment/verify-mint
 * Основний маршрут для перевірки оплати Early Access
 */
router.post('/verify-mint', async (req, res) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  try {
    // 1. Знаходимо юзера
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Якщо вже оплачено - повертаємо успіх одразу
    if (user.hasPaidEarlyAccess) {
      return res.json({ success: true, status: "already_paid", user });
    }

    // 3. Перевіряємо блокчейн
    const isPaid = await verifyOnChainPayment(user.walletAddress);

    if (isPaid) {
      // ✅ Успішна оплата
      user.hasPaidEarlyAccess = true;
      await user.save();
      console.log(`🎉 User ${user.username} granted Early Access!`);
      return res.json({ success: true, status: "paid_now", user });
    } else {
      // ⏳ Оплата ще не знайдена
      return res.status(402).json({ 
        success: false, 
        error: "Payment not found yet. Please wait a few seconds and try again." 
      });
    }

  } catch (error) {
    console.error('Verify Mint Error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

export default router;