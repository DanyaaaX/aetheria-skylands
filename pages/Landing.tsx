import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { Shield, Zap, Sparkles, BarChart3, Rocket, Send, Coins, MousePointerClick, Loader2, Info } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// --- CONFIGURATION ---
// 🔴 IMPORTANT: Insert Sale Contract Address from Getgems!
const SALE_CONTRACT_ADDRESS = "EQDy...YOUR_GETGEMS_ADDRESS"; 
const MINT_PRICE_TON = 2.5;

const Landing: React.FC = () => {
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress(); 
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async () => {
    if (!userAddress) {
      toast.error("Connect wallet first!");
      return;
    }

    if (SALE_CONTRACT_ADDRESS.includes("YOUR_GETGEMS_ADDRESS")) {
      toast.error("DEV ERROR: Contract address not configured!");
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
      await tonConnectUI.sendTransaction(transaction);
      
      toast.success("Transaction sent! NFT will appear in your profile shortly.");
    } catch (error: any) {
      console.error("Mint Error:", error);
      if (error?.message?.includes('User rejected')) {
        toast.error("You cancelled the transaction.");
      } else {
        toast.error("Error. Check balance (need extra for gas).");
      }
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#050505] text-white overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1a1b1e', color: '#fff', border: '1px solid #333' } }} />
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[15%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-[5%] right-[5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[110px]" />
      </div>

      <div className="relative z-10 pt-20 pb-24 px-6 max-w-7xl mx-auto">
        
        {/* --- HERO SECTION --- */}
        <section className="flex flex-col items-center text-center mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8 backdrop-blur-md"
          >
            <Zap className="w-3 h-3 text-cyan-400 fill-current" />
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.2em]">Next-Gen TG Gaming Ecosystem</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-9xl font-cinzel font-black mb-8 tracking-tighter leading-none"
          >
            AETHERIA<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 drop-shadow-[0_0_40px_rgba(168,85,247,0.3)]">
              SKYLANDS
            </span>
          </motion.h1>

          {/* PROJECT DESCRIPTION */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl mb-12 shadow-2xl"
          >
            <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed">
              Aetheria is an <span className="text-white font-bold">Economic Strategy</span> evolving into a high-stakes <span className="text-cyan-400 font-bold">Telegram Mini-Game</span>.
              Own Genesis Lands to automate resource extraction and secure <span className="text-purple-400 font-bold">Passive Income</span> 24/7 within the TON ecosystem.
            </p>
          </motion.div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
             <Link to="/dashboard" className="group relative px-10 py-5 bg-white text-black font-black rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <Rocket className="w-5 h-5" />
                <span className="tracking-widest uppercase text-sm">Mint Genesis NFT</span>
             </Link>
             <div className="p-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full">
                <div className="bg-black rounded-full px-2">
                   <TonConnectButton />
                </div>
             </div>
          </div>
        </section>

        {/* --- NFT MINT BLOCK (WEB3 VERSION) --- */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-2xl mx-auto bg-[#0f0f13] border border-purple-500/30 rounded-3xl p-6 md:p-8 mb-32 shadow-[0_0_60px_-15px_rgba(168,85,247,0.3)] relative overflow-hidden"
        >
            {/* Decorative Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

            <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-purple-500/10 rounded-full mb-4">
                <Sparkles className="text-purple-400 w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-wide font-cinzel mb-2">MYSTERY SKYLAND</h2>
            <p className="text-gray-400 text-sm max-w-md text-center">
                Mint a generic Genesis Land now.
                Reveal its rarity (Common to Mystic) after the public sale ends.
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

        {/* --- FEATURE CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
            <FeatureCard 
                icon={<Coins className="text-yellow-400" />}
                title="Passive Rewards"
                desc="Hold Genesis Islands to earn Aether Points and $AETH tokens automatically through the TG bot."
            />
            <FeatureCard 
                icon={<Send className="text-cyan-400" />}
                title="TG Mini-App"
                desc="Manage your sky empire, upgrade island rarity, and raid competitors directly from Telegram."
            />
            <FeatureCard 
                icon={<BarChart3 className="text-purple-400" />}
                title="Yield Multiplier"
                desc="Artifacts increase your land's output. The rarer your island, the higher your daily passive revenue."
            />
        </div>

        {/* --- CTA SECTION --- */}
        <motion.div 
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.9 }}
            className="w-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-purple-500/30 rounded-[3rem] p-12 text-center backdrop-blur-2xl relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
            <h2 className="text-4xl md:text-5xl font-cinzel font-bold mb-6">READY TO CONQUER THE VOID?</h2>
            <p className="text-gray-400 mb-10 max-w-xl mx-auto uppercase tracking-widest text-sm font-bold">
                Mint your legendary land today and start earning passive income before the official TGE.
            </p>
            <button 
                onClick={handleMint}
                className="inline-flex items-center gap-3 px-12 py-5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl transition-all shadow-2xl shadow-purple-500/40 uppercase tracking-widest text-sm"
            >
                <MousePointerClick className="w-5 h-5" />
                Mint My First Skyland
            </button>
        </motion.div>

      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <motion.div 
        whileHover={{ y: -10 }}
        className="p-8 bg-[#111115] border border-white/5 rounded-[2.5rem] hover:border-cyan-500/30 transition-all text-left"
    >
        <div className="mb-6 p-4 bg-white/5 w-fit rounded-2xl border border-white/5">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 font-cinzel text-white uppercase tracking-tight">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </motion.div>
);

export default Landing;
