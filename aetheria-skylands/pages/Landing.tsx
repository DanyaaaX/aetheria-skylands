
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Shield, Users, Sparkles, Sword, BarChart3 } from 'lucide-react';

const Landing: React.FC = () => {
  const features = [
    { icon: <BarChart3 className="w-6 h-6" />, title: "Passive Yield", desc: "Automated yield-generating ecosystem where land works for you 24/7." },
    { icon: <Shield className="w-6 h-6" />, title: "Economic Strategy", desc: "Manage, upgrade, and rent out Sky Islands for consistent returns." },
    { icon: <Sparkles className="w-6 h-6" />, title: "Land Upgrades", desc: "Enhance land rarity to increase output before the official token TGE." },
    { icon: <Users className="w-6 h-6" />, title: "Referral Rank", desc: "Earn points to qualify for Genesis Land mints and elite rewards." }
  ];

  return (
    <div className="flex flex-col items-center text-center max-w-5xl mx-auto py-12 md:py-24">
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
          Aetheria is an economic strategy platform where your 3D Land assets work for you 24/7.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="p-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full">
            <div className="bg-black rounded-full px-2">
               <TonConnectButton />
            </div>
          </div>
          <Link to="/faq" className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white font-semibold">
            Learn More
          </Link>
        </div>
      </motion.div>

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
