import dbConnect from '../lib/db';
import User from '../models/User';

export default async function handler(req, res) {
  // 1. Дозволяємо тільки метод POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 2. Підключаємось до бази
    await dbConnect();

    // 3. Отримуємо дані від фронтенда
    const { walletAddress, platform, username } = req.body;

    // Валідація
    if (!walletAddress || !platform || !username) {
      return res.status(400).json({ success: false, message: 'Missing data' });
    }

    // 4. Формуємо об'єкт оновлення
    let updateFields = {};

    if (platform === 'twitter') {
      updateFields.twitterHandle = username;
      updateFields['socialsFollowed.twitter'] = true;
    } else if (platform === 'telegram') {
      updateFields.telegramHandle = username;
      updateFields['socialsFollowed.telegram'] = true;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid platform' });
    }

    // 5. Шукаємо юзера і оновлюємо
    // upsert: true означає "якщо юзера нема - створи", але зазвичай краще спочатку перевіряти
    const user = await User.findOneAndUpdate(
      { walletAddress: walletAddress },
      { $set: updateFields },
      { new: true } // Повернути оновленого юзера
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in DB' });
    }

    // 6. Успіх!
    return res.status(200).json({ 
      success: true, 
      message: `${platform} bound successfully`,
      user: user 
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}