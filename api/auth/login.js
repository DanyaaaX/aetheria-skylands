import dbConnect from '../../lib/db';
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ error: 'Wallet required' });

    const lowerWallet = walletAddress.toLowerCase();
    
    // Шукаємо юзера
    const user = await User.findOne({ walletAddress: lowerWallet });

    if (user) {
      // ✅ ЮЗЕР Є: Просто логінимо
      return res.status(200).json({ 
        success: true, 
        user: user 
      });
    } else {
      // ❌ ЮЗЕРА НЕМАЄ: Кажемо фронтенду відкрити вікно введення ніку
      return res.status(200).json({ 
        success: false, 
        needsRegistration: true // Цей прапорець важливий для фронтенду!
      });
    }

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}