
import React from 'react';
import { motion } from 'framer-motion';
import { Flag, Rocket, Sword, ShoppingCart, BarChart3, TrendingUp } from 'lucide-react';

const Roadmap: React.FC = () => {
  const phases = [
    {
      id: "Phase 1",
      title: "Genesis Awakening",
      period: "Current",
      icon: <Flag className="text-cyan-400" />,
      tasks: ["Launch of referral/points system", "Community social growth campaign", "Whitelist spots for Genesis Land", "Initial point multiplier distributions"]
    },
    {
      id: "Phase 2",
      title: "Land Allocation",
      period: "Q1 2026",
      icon: <Rocket className="text-purple-400" />,
      tasks: ["Genesis Floating Islands Mint", "Distribution to early points leaders", "Exclusive 3D assets unveiling", "Early supporter registry snapshot"]
    },
    {
      id: "Phase 3",
      title: "Sky Market & Upgrades",
      period: "Q2 2026",
      icon: <ShoppingCart className="text-red-400" />,
      tasks: ["P2P Marketplace activation", "Land upgrade mechanics (Rarity/Yield)", "Artifact trading system", "Beta marketplace testing on TON"]
    },
    {
      id: "Phase 4",
      title: "Aetheria Economy",
      period: "Q3 2026",
      icon: <TrendingUp className="text-yellow-400" />,
      tasks: ["Official $AETH Token TGE", "Passive Yield mechanics activation", "Governance staking for land owners", "Global yield optimization expansions"]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-6xl font-cinzel font-bold mb-6 tracking-tight">The Path to Wealth</h1>
        <p className="text-gray-400 text-lg">Aetheria's strategic economic evolution roadmap.</p>
      </motion.div>

      <div className="relative border-l-2 border-white/5 ml-4 md:ml-8 space-y-12">
        {phases.map((phase, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="relative pl-12"
          >
            <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-[#050505] shadow-[0_0_10px_rgba(255,255,255,0.2)] ${idx === 0 ? 'bg-cyan-500' : 'bg-gray-700'}`} />
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">{phase.icon}</div>
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{phase.id}</span>
                    <h2 className="text-2xl font-cinzel font-bold text-white">{phase.title}</h2>
                  </div>
                </div>
                <div className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-400 whitespace-nowrap self-start md:self-center">
                  {phase.period}
                </div>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phase.tasks.map((task, tidx) => (
                  <li key={tidx} className="flex items-center gap-3 text-gray-400 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Roadmap;
