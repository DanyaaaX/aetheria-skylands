const User = require('../models/User');
// Тобі знадобиться axios для запитів до API блокчейну
// npm install axios
const axios = require('axios');

// Твій гаманець, куди мають приходити гроші за мінт
const ADMIN_WALLET_ADDRESS = "UQDCOmFcYz_Tvf7clsf9iGNTCIkI9oIg869O2YyBkc4mWPQT"; 

exports.verifyMint = async (req, res) => {
  const { walletAddress, transactionHash } = req.body;

  if (!walletAddress || !transactionHash) {
    return res.status(400).json({ message: "Дані відсутні" });
  }

  try {
    // 1. ПЕРЕВІРКА: Чи ми вже обробляли цю транзакцію? (Захист від повторного використання)
    const existingUsage = await User.findOne({ 'mintTransactionHash': transactionHash });
    if (existingUsage) {
      return res.status(409).json({ message: "Ця транзакція вже використана!" });
    }

    // 2. ЗАПИТ ДО БЛОКЧЕЙНУ (Використовуємо TonCenter або TonApi)
    // Для Mainnet: https://toncenter.com/api/v2/jsonRPC
    // Тобі може знадобитися API KEY від TonCenter (він безкоштовний у них в боті)
    
    // Приклад логіки перевірки (спрощено):
    console.log(`Verifying TX: ${transactionHash} for ${walletAddress}`);
    
    // Тут ми робимо реальний запит до API TON, щоб перевірити транзакцію
    // У реальному проекті використовуй бібліотеку 'ton' або API запит:
    /*
    const response = await axios.get(`https://toncenter.com/api/v2/getTransaction?hash=${transactionHash}...`);
    const txData = response.data;
    
    // Перевіряємо:
    // a) Чи отримувач == ADMIN_WALLET_ADDRESS?
    // b) Чи сума >= вартості мінту?
    // c) Чи транзакція успішна?
    */

    // --- СИМУЛЯЦІЯ ДЛЯ ТЕСТУ (Поки не підключиш реальне API) ---
    const isTxValid = true; // Заміни на реальну перевірку!
    
    if (!isTxValid) {
      return res.status(400).json({ message: "Транзакція невалідна або не знайдена" });
    }

    // 3. ОНОВЛЕННЯ КОРИСТУВАЧА
    const user = await User.findOneAndUpdate(
      { walletAddress: walletAddress }, // Знаходимо по гаманцю
      { 
        $set: { 
          hasNFT: true, 
          mintTransactionHash: transactionHash, // Зберігаємо хеш, щоб не юзали двічі
          isPremium: true 
        },
        $inc: { points: 1000 } // Бонус за мінт
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Користувача не знайдено" });
    }

    // 4. НАРАХУВАННЯ РЕФЕРАЛУ (Якщо користувача хтось запросив)
    if (user.referredBy) {
        await User.findOneAndUpdate(
            { username: user.referredBy },
            { $inc: { points: 500, inviteCount: 1 } } // Бонус рефереру
        );
    }

    return res.status(200).json({ 
      success: true, 
      message: "NFT успішно підтверджено!", 
      user: user 
    });

  } catch (error) {
    console.error("Mint Error:", error);
    return res.status(500).json({ message: "Помилка сервера при перевірці" });
  }
};