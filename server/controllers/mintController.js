import { useTonConnectUI } from '@tonconnect/ui-react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // Або твій варіант повідомлень

// ... всередині компонента ...

const [tonConnectUI] = useTonConnectUI();

const handleMint = async () => {
    // 1. Перевірка: чи підключений гаманець
    if (!tonConnectUI.connected) {
        toast.error("Спочатку підключіть гаманець!");
        return;
    }

    try {
        // 2. Формування транзакції (0.5 TON наприклад)
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 60, // 60 секунд на оплату
            messages: [
                {
                    address: "UQDCOmFcYz_Tvf7clsf9iGNTCIkI9oIg869O2YyBkc4mWPQT", // Твій гаманець адміна
                    amount: "500000000", // 0.5 TON у нанотонах (1 TON = 1 000 000 000)
                },
            ],
        };

        // 3. Виклик гаманця (TonKeeper)
        const result = await tonConnectUI.sendTransaction(transaction);

        // 4. Якщо успішно — відправляємо хеш на твій бекенд для перевірки
        // Важливо: boc — це "мішок з клітинками", хеш треба дістати (або відправити boc як є)
        // Для простоти часто відправляють boc, а бекенд його розбирає, 
        // або просто ігнорують перевірку хешу на етапі тесту.
        
        const boc = result.boc; // Це підтвердження транзакції

        // 5. Запит на твій сервер (Render)
        await axios.post('https://aetheria-skylands.onrender.com/api/mint/verify', {
            walletAddress: tonConnectUI.account?.address,
            transactionHash: boc // Поки що передаємо boc як хеш
        });

        toast.success("NFT успішно замінтлено! Перевірте профіль.");

    } catch (error) {
        console.error("Mint Error:", error);
        toast.error("Мінту скасовано або сталася помилка.");
    }
};

// ... У кнопці: onClick={handleMint}