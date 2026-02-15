import dbConnect from '../../lib/db';
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();

  try {
    const { walletAddress, username, referralCode } = req.body;

    // Валідація: Гаманець і Нік обов'язкові
    if (!walletAddress || !username) {
      return res.status(400).json({ error: 'Wallet and Username are required' });
    }

    const lowerWallet = walletAddress.toLowerCase();

    // 1. Перевірка: Чи зайнятий нік?
    const existingNick = await User.findOne({ username: username });
    if (existingNick) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // 2. Перевірка: Чи зайнятий гаманець?
    const existingWallet = await User.findOne({ walletAddress: lowerWallet });
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet already registered' });
    }

    // 3. Створюємо юзера
    const newUser = await User.create({
      walletAddress: lowerWallet,
      username: username, // Записуємо той нік, що ввів юзер
      referredBy: referralCode || null
    });

    // 4. Нараховуємо бонус тому, хто запросив (якщо був рефкод)
    if (referralCode) {
      await User.findOneAndUpdate(
        { referralCode: referralCode.toLowerCase() },
        { $inc: { inviteCount: 1, points: 5 } }
      );
    }

    return res.status(201).json({ success: true, user: newUser });

  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
}