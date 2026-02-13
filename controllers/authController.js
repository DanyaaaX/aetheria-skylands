// Коли юзер вперше заходить
exports.registerUser = async (req, res) => {
    const { username, walletAddress, referralCode, ipAddress } = req.body;

    // 1. ЗАХИСТ ВІД МУЛЬТИАККАУНТІВ ПО IP
    // Якщо з цього IP вже було 5 реєстрацій за добу - блокуємо
    const accountsFromIp = await User.countDocuments({ ip: ipAddress });
    if (accountsFromIp > 5) {
        return res.status(403).json({ message: "Ліміт реєстрацій з цього пристрою" });
    }

    // 2. ОБРОБКА РЕФЕРАЛУ
    let referrer = null;
    if (referralCode) {
        // Шукаємо, хто запросив
        const inviter = await User.findOne({ referralCode: referralCode });
        
        // Захист: не можна запросити самого себе
        if (inviter && inviter.walletAddress !== walletAddress) {
            referrer = inviter.username;
        }
    }

    // Створення нового юзера
    const newUser = new User({
        username,
        walletAddress,
        referredBy: referrer, // Зберігаємо, хто запросив
        ip: ipAddress,
        referralCode: Math.random().toString(36).substring(7) // Генеруємо його особистий код
    });
    
    await newUser.save();
    
    // ...
};