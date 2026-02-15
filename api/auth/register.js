import dbConnect from '../../lib/db';
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  await dbConnect();

  const { walletAddress, username, referralCode } = req.body; // referralCode тут - це "хто запросив" (referrer)

  if (!walletAddress || !username) {
    return res.status(400).json({ success: false, message: 'Wallet and Username are required' });
  }

  try {
    // 1. Перевіряємо, чи такий нік вже зайнятий
    const existingNick = await User.findOne({ username: username });
    if (existingNick) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    // 2. Перевіряємо, чи цей гаманець вже зареєстрований
    const existingWallet = await User.findOne({ walletAddress: walletAddress });
    if (existingWallet) {
      return res.status(400).json({ success: false, message: 'Wallet already registered' });
    }

    // 3. Створюємо нового юзера
    // Примітка: referralCode (свій власний) згенерується автоматично з username завдяки pre('save') в моделі
    const newUser = await User.create({
      walletAddress,
      username,
      referredBy: referralCode || null // Якщо він прийшов за чиїмось посиланням
    });

    // 4. Якщо був реферер - нараховуємо йому бонус (опціонально)
    if (referralCode) {
      await User.findOneAndUpdate(
        { referralCode: referralCode.toLowerCase() },
        { $inc: { inviteCount: 1, points: 100 } } // +1 інвайт, +100 очок
      );
    }

    return res.status(201).json({ success: true, user: newUser });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}