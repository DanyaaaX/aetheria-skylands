import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { Shield, Users, Sparkles, BarChart3, CheckCircle, Loader2, Info } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// --- НАЛАШТУВАННЯ ---
// 🔴 ВАЖЛИВО: Сюди встав адресу Sale-контракту з Getgems!
const SALE_CONTRACT_ADDRESS = "EQDy...ТВОЯ_АДРЕСА_З_GETGEMS"; 
const MINT_PRICE_TON = 2.5; // Ціна має співпадати з тією, що ти вказав у контракті

const Landing: React.FC = () => {
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress(); 
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async () => {
    if (!userAddress) {
      toast.error("Спочатку підключіть гаманець!");
      return;
    }

    // Перевірка, чи вставив ти адресу контракту
    if (SALE_CONTRACT_ADDRESS.includes("ТВОЯ_АДРЕСА")) {
      toast.error("DEV ERROR: Адреса контракту не налаштована!");
      return;
    }

    setIsMinting(true);

    try {
      // Конвертація TON в нанотонии (1 TON = 1 млрд)
      const amountNano = (MINT_PRICE_TON * 1000000000).toString();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // 6 хвилин на валідацію
        messages: [
          {
            address: SALE_CONTRACT_ADDRESS,
            amount: amountNano, 
            // Для стандартних сейлів на Getgems payload не потрібен, 
            // контракт сам зрозуміє, що це покупка, якщо сума правильна.
          },
        ],
      };

      // Відправка транзакції
      await tonConnectUI.sendTransaction(transaction);
      
      toast.success("Транзакція відправлена! NFT з'явиться у профілі за хвилину.");
      
    } catch (error: any) {
      console.error("Mint Error:", error);
      if (error?.message?.includes('User rejected')) {
        toast.error("Ви скасували транзакцію.");
      } else {
        toast.error("Помилка. Перевірте баланс (треба трохи більше для комісії).");
      }
    } finally {
      setIsMinting(false);
    }
  };

  const features = [
    { icon: <BarChart3 className="w-6 h-6" />, title: "Passive Yield", desc: "Automated yield-generating ecosystem where land works for you 24/7." },
    { icon: <Shield className="w-6 h-6" />, title: "Economic Strategy", desc: "Manage, upgrade, and rent out Sky Islands for consistent returns." },
    { icon: <Sparkles className="w-6 h-6" />, title: "Land Upgrades", desc: "Enhance land rarity to increase output before the official token TGE." },
    { icon: <Users className="w-6 h-6" />, title: "Referral Rank", desc: "Earn points to qualify for Genesis Land mints and elite rewards." }
  ];

  return (
    <div className="flex flex-col items-center text-center max-w-5xl mx-auto py-12 md:py-24 relative">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1a1b1e', color: '#fff', border: '1px solid #333' } }} />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-8xl font-cinzel font-bold mb-6 tracking-tighter">
          AETHERIA<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500">
            SKYLANDS
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 font-light leading-relaxed">
          The ultimate automated yield-generating ecosystem on TON. 
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <div className="p-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full">
            <div className="bg-black rounded-full px-2">
               <TonConnectButton />
            </div>
          </div>
          <Link to="/faq" className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white font-semibold">
            Documentation
          </Link>
        </div>
      </motion.div>

      {/* --- NFT MINT BLOCK (WEB3 VERSION) --- */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-2xl bg-[#0f0f13] border border-purple-500/30 rounded-3xl p-6 md:p-8 mb-20 shadow-[0_0_60px_-15px_rgba(168,85,247,0.3)] relative overflow-hidden"
      >
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-purple-500/10 rounded-full mb-4">
             <Sparkles className="text-purple-400 w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-wide font-cinzel mb-2">MYSTERY SKYLAND</h2>
          <p className="text-gray-400 text-sm max-w-md">
            Mint a generic Genesis Land now. Reveal its rarity (Common to Mystic) after the public sale ends.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Supply</span>
                <span className="text-xl font-bold text-white">8,888</span>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Price</span>
                <span className="text-xl font-bold text-cyan-400">{MINT_PRICE_TON} TON</span>
            </div>
        </div>

        <button 
          onClick={handleMint}
          disabled={isMinting}
          className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all 
            ${isMinting 
              ? 'bg-gray-700 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-purple-500/25 active:scale-[0.98]'
            }`}
        >
          {isMinting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin w-5 h-5" /> CONFIRM IN WALLET...
            </span>
          ) : (
            `MINT NOW`
          )}
        </button>
        
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Info className="w-3 h-3" />
            <span>Gas fee ~0.05 TON required</span>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-4">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md hover:border-cyan-500/30 transition-all text-left group"
          >
            <div className="mb-4 p-3 bg-white/5 w-fit rounded-xl group-hover:scale-110 transition-transform text-cyan-400">
              {f.icon}
            </div>
            <h3 className="text-lg font-bold mb-2 font-cinzel">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Landing;