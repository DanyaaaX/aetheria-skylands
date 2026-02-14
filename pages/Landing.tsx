import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Shield, Zap, Sparkles, BarChart3, Rocket, Send, Coins, MousePointerClick } from 'lucide-react';

const Landing: React.FC = () => {
  
  const stats = [
    { label: "Total Supply", value: "8,888" },
    { label: "Yield Type", value: "Passive" },
    { label: "Platform", value: "Telegram Mini-App" }
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#050505] text-white overflow-hidden">
      
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
             <TonConnectButton />
          </div>
        </section>

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
            <Link to="/dashboard" className="inline-flex items-center gap-3 px-12 py-5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl transition-all shadow-2xl shadow-purple-500/40 uppercase tracking-widest text-sm">
                <MousePointerClick className="w-5 h-5" />
                Mint My First Skyland
            </Link>
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