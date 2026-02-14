import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { Shield, Zap, Sparkles, BarChart3, Hexagon, Box, Lock, Info, Loader2, Crown } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// --- НАЛАШТУВАННЯ ---
const SALE_CONTRACT_ADDRESS = "EQDy...ТВОЯ_АДРЕСА_З_GETGEMS"; // <--- Встав сюди адресу контракту
const MINT_PRICE_TON = 2.5;

// Тип для інвентарю
interface InventoryItem {
  id: number;
  name: string;
  type: 'mystery';
  status: 'locked';
  image: string; // Посилання на картинку закритої скрині
}

const Landing: React.FC = () => {
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();
  const [isMinting, setIsMinting] = useState(false);
  
  // Локальний інвентар (для миттєвого відображення після покупки)
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const handleMint = async () => {
    if (!userAddress) {
      toast.error("Connect wallet first!");
      return;
    }

    if (SALE_CONTRACT_ADDRESS.includes("ТВОЯ_АДРЕСА")) {
      toast.error("DEV ERROR: Contract address not set!");
      return;
    }

    setIsMinting(true);

    try {
      const amountNano = (MINT_PRICE_TON * 1000000000).toString();
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: SALE_CONTRACT_ADDRESS,
            amount: amountNano,
          },
        ],
      };
      // Відправка транзакції
      await tonConnectUI.sendTransaction(transaction);

      // Емуляція успіху для UI (додаємо предмет в інвентар)
      toast.success("Mint Successful! Item added to inventory.");
      const newItem: InventoryItem = {
        id: Date.now(),
        name: `Genesis Capsule #${Math.floor(Math.random() * 8888)}`,
        type: 'mystery',
        status: 'locked',
        image: 'https://cdn-icons-png.flaticon.com/512/8655/8655590.png' // Заміни на свою картинку скрині
      };
      setInventory(prev => [newItem, ...prev]);
      
    } catch (error: any) {
      console.error("Mint Error:", error);
      if (error?.message?.includes('User rejected')) {
        toast.error("Transaction cancelled.");
      } else {
        toast.error("Transaction failed. Check balance.");
      }
    } finally {
      setIsMinting(false);
    }
  };

  const features = [
    { icon: <BarChart3 className="w-6 h-6" />, title: "Passive Yield", desc: "Automated yield generation 24/7." },
    { icon: <Shield className="w-6 h-6" />, title: "Strategy", desc: "Manage and upgrade Sky Islands." },
    { icon: <Crown className="w-6 h-6" />, title: "Rankings", desc: "Compete for elite rewards." }
  ];

  return (
    <div className="flex flex-col items-center text-center max-w-6xl mx-auto py-12 md:py-20 relative px-4 overflow-hidden">
      <Toaster position="top-center" toastOptions={{ 
        style: { background: 'rgba(20, 20, 30, 0.9)', color: '#fff', border: '1px solid rgba(139, 92, 246, 0.3)', backdropFilter: 'blur(10px)' } 
      }} />

      {/* Hero Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-xs font-mono text-gray-300 uppercase tracking-widest">System Online • Phase 3</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-cinzel font-black mb-6 tracking-tighter leading-[0.9]">
          AETHERIA<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 drop-shadow-[0_0_35px_rgba(168,85,247,0.4)]">
            SKYLANDS
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          Mint your Genesis Land.
          Secure your passive income. <br/>
          <span className="text-white font-semibold">No tasks. No barriers. Just Web3.</span>
        </p>
        
        <div className="flex justify-center mb-12">
            <div className="p-1 bg-gradient-to-r from-cyan-500/50 to-purple-600/50 rounded-full backdrop-blur-md">
                <div className="bg-[#0b0b0e] rounded-full px-4 py-2">
                    <TonConnectButton />
                </div>
            </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12 w-full items-start">
        
        {/* LEFT COLUMN: MINT CARD */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-full bg-[#0f0f13]/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white font-cinzel">MYSTERY BOX</h2>
                        <p className="text-purple-400 text-sm font-mono tracking-widest">GENESIS EDITION</p>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                         <Hexagon className="text-purple-400 w-8 h-8 animate-spin-slow" />
                    </div>
                </div>

                {/* Central Visual (The Mystery Box) */}
                <div className="relative h-64 w-full flex items-center justify-center mb-8 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                     <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    >
                        <Box className="w-32 h-32 text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]" strokeWidth={1} />
                    </motion.div>
                    
                    {/* Rarity Ticker */}
                    <div className="absolute bottom-4 left-0 w-full overflow-hidden">
                        <div className="flex gap-4 text-[10px] uppercase font-bold text-gray-500 justify-center opacity-60">
                            <span>Common 60%</span> • <span>Rare 25%</span> • <span>Legendary 10%</span> • <span className="text-yellow-500">Mystic 5%</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between items-center mb-8 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-left">
                        <p className="text-gray-400 text-xs uppercase">Price</p>
                        <p className="text-2xl font-bold text-white">{MINT_PRICE_TON} TON</p>
                    </div>
                    <div className="text-right">
                         <p className="text-gray-400 text-xs uppercase">Supply</p>
                         <p className="text-2xl font-bold text-white">8,888</p>
                    </div>
                </div>

                {/* Mint Button */}
                <button 
                  onClick={handleMint}
                  disabled={isMinting}
                  className={`w-full py-5 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all relative overflow-hidden group/btn
                    ${isMinting 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-white to-purple-400 opacity-0 group-hover/btn:opacity-20 transition-opacity"></div>
                    {isMinting ? (
                        <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin w-5 h-5" /> CONFIRMING...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Zap className="w-5 h-5 fill-current" /> MINT ARTIFACT
                        </span>
                    )}
                </button>
                 <p className="mt-4 text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Info className="w-3 h-3" /> Includes 1 Mystery Land + 500 Aether Points
                </p>
            </div>
        </motion.div>

        {/* RIGHT COLUMN: INVENTORY / FEATURES */}
        <div className="flex flex-col gap-6">
            
            {/* INVENTORY SECTION */}
            <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#0f0f13]/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md min-h-[300px]"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Box className="w-5 h-5 text-purple-400" /> 
                        YOUR INVENTORY
                    </h3>
                    <span className="bg-white/10 px-2 py-1 rounded-md text-xs text-gray-300 font-mono">
                        {inventory.length} ITEMS
                    </span>
                </div>

                {inventory.length === 0 ? (
                    // Empty State
                    <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-black/20">
                        <Lock className="w-8 h-8 text-gray-600 mb-2" />
                        <p className="text-gray-500 text-sm">No artifacts detected.</p>
                        <p className="text-gray-600 text-xs">Mint to reveal your inventory.</p>
                    </div>
                ) : (
                    // Inventory Grid
                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence>
                            {inventory.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/30 rounded-xl flex flex-col items-center gap-2 group hover:border-purple-500/60 transition-colors"
                                >
                                    <div className="w-16 h-16 bg-black/50 rounded-lg flex items-center justify-center relative overflow-hidden">
                                        {/* Тут можна вставити <img src={item.image} /> */}
                                        <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                                        <div className="absolute inset-0 bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors"></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white text-xs font-bold truncate w-24">{item.name}</p>
                                        <p className="text-purple-400 text-[10px] uppercase">{item.status}</p>
                                    </div>
                                    <button className="w-full py-1.5 mt-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-300 transition-colors">
                                        VIEW DETAILS
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* Features (Compact) */}
            <div className="grid grid-cols-1 gap-4">
                {features.map((f, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors"
                    >
                        <div className="p-2 bg-black rounded-lg text-cyan-400">
                            {f.icon}
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-white text-sm">{f.title}</h4>
                            <p className="text-gray-400 text-xs">{f.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

        </div>
      </div>
    </div>
  );
};

export default Landing;