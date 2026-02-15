import dbConnect from '../../lib/db';
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  await dbConnect();

  const { walletAddress } = req.body;

  try {
    // 1. Знаходимо юзера (Покупця)
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.hasMintedNFT) {
      return res.status(400).json({ success: false, message: 'Already minted' });
    }

    // 2. Оновлюємо статус Покупця
    user.hasMintedNFT = true;
    user.isVip = true; // 🔥 ДОДАНО: Покупець теж стає VIP!
    await user.save();

    // 3. Шукаємо Реферера (Того, хто запросив)
    if (user.referredBy) {
      const referrer = await User.findOne({ referralCode: user.referredBy.toLowerCase() });
      
      if (referrer) {
        referrer.nftReferralsCount += 1;

        // Реферер стає VIP, якщо привів хоча б 1 покупця
        if (referrer.nftReferralsCount >= 1) {
          referrer.isVip = true;
        }
        
        referrer.points += 1000; // Бонус
        await referrer.save();
      }
    }

    return res.status(200).json({ success: true, user });

  } catch (error) {
    console.error('Mint Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}