
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileWarning, Fingerprint, Gavel } from 'lucide-react';

const Legal: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-6xl font-cinzel font-bold mb-6 tracking-tight">Legal & Privacy</h1>
        <p className="text-gray-400 text-lg">Terms of Service and Privacy Policy for Aetheria Guardians.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
           <div className="flex items-center gap-3 mb-6 text-cyan-400">
             <Gavel className="w-6 h-6" />
             <h2 className="text-xl font-cinzel font-bold">Terms of Service</h2>
           </div>
           <p className="text-gray-400 text-sm leading-relaxed mb-4">
             Aetheria: Skylands is a digital asset management platform. By using the platform, you acknowledge that blockchain transactions are irreversible and that asset values may fluctuate significantly.
           </p>
           <ul className="text-gray-500 text-xs space-y-2 list-disc pl-4">
             <li>You are responsible for your own private keys.</li>
             <li>The platform is provided "as is" without warranties.</li>
             <li>Assets are for strategy and entertainment purposes.</li>
           </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
           <div className="flex items-center gap-3 mb-6 text-purple-400">
             <Fingerprint className="w-6 h-6" />
             <h2 className="text-xl font-cinzel font-bold">Privacy Policy</h2>
           </div>
           <p className="text-gray-400 text-sm leading-relaxed mb-4">
             We value your privacy. Your identity in Aetheria is primarily tied to your TON wallet address. We do not store personal PII unless explicitly provided during specialized events.
           </p>
           <ul className="text-gray-500 text-xs space-y-2 list-disc pl-4">
             <li>Wallet addresses are public on-chain.</li>
             <li>Referral data is used solely for reward logic.</li>
             <li>Third-party analytics may be used for performance tracking.</li>
           </ul>
        </div>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4 text-red-400">
          <FileWarning className="w-6 h-6" />
          <h2 className="text-xl font-cinzel font-bold uppercase tracking-widest">Risk Disclaimer</h2>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          Cryptocurrency and digital asset strategy games involve high risk. Past performance of yield assets is not indicative of future results. Do not allocate more funds than you can afford to lose. Aetheria Labs is not a financial advisory firm. All decisions regarding land acquisition, upgrading, and trading are made at the player's sole discretion.
        </p>
      </div>
    </div>
  );
};

export default Legal;
