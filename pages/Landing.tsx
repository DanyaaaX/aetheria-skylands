import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Zap, BarChart3, Rocket, Send, Coins, MousePointerClick, Star } from 'lucide-react';

const Landing: React.FC = () => {
  
  return (
    <div className="relative w-full min-h-screen bg-[#030305] text-white overflow-hidden selection:bg-cyan-500/30">
      
      {/* --- BACKGROUND EFFECTS (ГЛИБИНА ТА ТЕКСТУРА) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* 1. Основний градієнт фону */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000]" />
        
        {/* 2. Техно-сітка (Grid) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* 3. Кольорові плями (Orbs) */}
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" 
        />
        <motion.div 
           animate={{ opacity: [0.2, 0.4, 0.2], scale: [1.1, 1, 1.1] }}
           transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[100px]" 
        />
        
        {/* 4. Зірки (Stars) */}
        <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
                <div key={i} 
                     className="absolute bg-white rounded-full"
                     style={{
                         top: `${Math.random() * 100}%`,
                         left: `${Math.random() * 100}%`,
                         width: `${Math.random() * 2 + 1}px`,
                         height: `${Math.random() * 2 + 1}px`,
                         opacity: Math.random()
                     }}
                />
            ))}
        </div>
      </div>

      <div className="relative z-10 pt-24 pb-24 px-6 max-w-7xl mx-auto">
        
        {/* --- HERO SECTION --- */}
        <section className="flex flex-col items-center text-center mb-28">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:bg-white/10 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-[0.2em] font-semibold">Next-Gen TG Gaming Ecosystem</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl md:text-8xl lg:text-9xl font-cinzel font-black mb-6 tracking-tight leading-none drop-shadow-2xl"
          >
            AETHERIA<br />
            <span className="relative inline-block mt-2">
              <span className="absolute -inset-2 blur-2xl bg-gradient-to-r from-cyan-500 to-purple-600 opacity-30"></span>
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-purple-300">
                SKYLANDS
              </span>
            </span>
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl text-lg md:text-xl text-gray-400 font-light leading-relaxed mb-10"
          >
            <p>
              An <span className="text-white font-medium">Economic Strategy</span> evolving into a high-stakes <span className="text-cyan-400 font-medium">Telegram Mini-Game</span>. 
              Secure <span className="text-purple-400 font-medium">Passive Income</span> 24/7 within the TON ecosystem.
            </p>
          </motion.div>
          
          {/* BUTTONS SWAPPED & STYLED */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full max-w-md mx-auto">
             {/* 1. TonConnect Button (Left) */}
             <div className="scale-105"> 
                <TonConnectButton />
             </div>

             {/* 2. Mint Button (Right - More Prominent) */}
             <Link to="/dashboard" className="group relative w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 overflow-hidden border border-cyan-400/20">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                <Rocket className="w-5 h-5 relative z-10" />
                <span className="relative z-10 tracking-wider text-sm">MINT GENESIS NFT</span>
             </Link>
          </div>
        </section>

        {/* --- FEATURE CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32 relative z-10">
            <FeatureCard 
                icon={<Coins className="text-yellow-400" />}
                title="Passive Rewards"
                desc="Hold Genesis Islands to earn Aether Points and $AETH tokens automatically."
                color="yellow"
            />
            <FeatureCard 
                icon={<Send className="text-cyan-400" />}
                title="TG Mini-App"
                desc="Manage your sky empire and raid competitors directly from Telegram."
                color="cyan"
            />
            <FeatureCard 
                icon={<BarChart3 className="text-purple-400" />}
                title="Yield Multiplier"
                desc="Artifacts increase output. Rarer islands yield higher daily revenue."
                color="purple"
            />
        </div>

        {/* --- CTA SECTION --- */}
        <motion.div 
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 30 }}
            viewport={{ once: true }}
            className="w-full relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0A0A0E]"
        >
             {/* Gradient glow behind CTA */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-purple-900/20 to-transparent opacity-50 pointer-events-none" />
            
            <div className="relative z-10 p-12 md:p-16 text-center">
                <h2 className="text-3xl md:text-5xl font-cinzel font-bold mb-4 text-white">READY TO CONQUER?</h2>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto text-sm md:text-base">
                    Mint your legendary land today and start earning passive income before the official TGE.
                </p>
                
                <Link to="/dashboard" className="inline-flex items-center gap-3 px-10 py-4 bg-white text-black font-black rounded-full transition-all hover:scale-105 hover:bg-gray-100 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                    <MousePointerClick className="w-5 h-5" />
                    <span>START MY JOURNEY</span>
                </Link>
            </div>
        </motion.div>

      </div>
    </div>
  );
};

// Feature Card Component (Updated Design)
const FeatureCard = ({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) => {
    
    // Mapping colors for dynamic styles
    const colors: Record<string, string> = {
        yellow: "group-hover:border-yellow-500/50 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]",
        cyan: "group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]",
        purple: "group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]",
    };

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className={`group relative p-8 bg-[#0e0e12]/80 backdrop-blur-sm border border-white/5 rounded-3xl transition-all duration-300 ${colors[color]}`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
            
            <div className="mb-5 p-3 bg-white/5 w-fit rounded-xl border border-white/5 backdrop-blur-md">
                {icon}
            </div>
            <h3 className="text-lg font-bold mb-3 font-cinzel text-white tracking-wide">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed font-light">{desc}</p>
        </motion.div>
    );
};

export default Landing;