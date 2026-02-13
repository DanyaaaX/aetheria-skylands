
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ShieldCheck, Diamond, Zap } from 'lucide-react';

const Docs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-6xl font-cinzel font-bold mb-6 tracking-tight">Documentation</h1>
        <p className="text-gray-400 text-lg">Master the mechanics of the Skylands.</p>
      </motion.div>

      <div className="space-y-12">
        <DocSection 
          icon={<BookOpen className="text-cyan-400" />}
          title="The Aetheria Concept"
          content="Aetheria: Skylands is a decentralized RPG set in an endless ocean of clouds. Players own floating islands (NFTs) that serve as their bases for resource extraction, crafting, and aerial combat. Built on the high-performance TON blockchain, Aetheria integrates seamlessly with Telegram for a massive-scale multiplayer experience."
        />

        <DocSection 
          icon={<Diamond className="text-purple-400" />}
          title="Land Rarities"
          content="Islands are classified into four tiers: Common, Rare, Epic, and Legendary. Rarity affects the abundance of Aether crystals, the capacity for defensive structures, and the native yield of the island's ecosystem. Genesis islands (Legendary) are only available to early supporters and top referrers."
        />

        <DocSection 
          icon={<ShieldCheck className="text-green-400" />}
          title="10% Tax Mechanics"
          content="To ensure a sustainable game economy, a 10% tax is applied to all secondary marketplace trades of islands and artifacts. This tax is automatically distributed: 5% to the Treasury (reward pool for active players), 3% to the Liquidity Pool, and 2% to development and maintenance of the Skylands."
        />

        <DocSection 
          icon={<Zap className="text-yellow-400" />}
          title="Resin System"
          content="Resin is the primary energy source in Aetheria. Players consume resin to perform major actions like harvesting Rare resources or initiating raids. Resin regenerates over time based on the quality of your island's atmosphere."
        />
      </div>
    </div>
  );
};

const DocSection: React.FC<{ icon: React.ReactNode, title: string, content: string }> = ({ icon, title, content }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl"
  >
    <div className="flex items-center gap-4 mb-4">
      <div className="p-3 bg-white/5 rounded-xl border border-white/5">{icon}</div>
      <h2 className="text-2xl font-cinzel font-bold text-white">{title}</h2>
    </div>
    <p className="text-gray-400 leading-relaxed text-base">
      {content}
    </p>
  </motion.div>
);

export default Docs;
