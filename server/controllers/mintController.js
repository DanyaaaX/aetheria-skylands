const User = require('../models/User');

exports.verifyMint = async (req, res) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ message: "Wallet address is required" });
  }

  try {
    console.log(`Processing mint for: ${walletAddress}`);

    // Знаходимо користувача і оновлюємо його статус
    // Ми просто додаємо йому мітку, що він має NFT (або "Mystery Box")
    const user = await User.findOneAndUpdate(
      { walletAddress: walletAddress },
      { 
        $set: { 
          hasNFT: true,
          lastMintDate: new Date()
        },
        $inc: { points: 500 } // Бонусні бали за мінт
      },
      { new: true, upsert: true } // Створити, якщо не існує
    );

    return res.status(200).json({ 
      success: true, 
      message: "Mint recorded successfully", 
      user: user 
    });

  } catch (error) {
    console.error("Mint Controller Error:", error);
    return res.status(500).json({ message: "Server error during mint recording" });
  }
};