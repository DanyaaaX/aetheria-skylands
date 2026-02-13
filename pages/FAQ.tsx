
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQ: React.FC = () => {
  const questions = [
    {
      q: "Is Aetheria: Skylands an RPG?",
      a: "No, Aetheria is an automated economic strategy game focused on land management and passive income. While it features a mystical setting, the core mechanics are centered around asset yield and trading."
    },
    {
      q: "How do I earn passive income in Aetheria?",
      a: "By owning, upgrading, and renting out your Sky Islands. Once the official token ($AETH) launches in Phase 4, your land assets will generate daily rewards based on their rarity, level, and the resin atmosphere quality."
    },
    {
      q: "Why should I refer friends?",
      a: "Every successful referral grants you exactly 5 Points. These points determine your rank on the global leaderboard, which directly impacts your eligibility for Free Genesis Mints and exclusive yield multipliers."
    },
    {
      q: "What is the P2P Marketplace?",
      a: "Launching in Phase 3, the Sky Market allows players to trade land assets and artifacts before the token TGE. This allows for early price discovery and strategic portfolio management."
    },
    {
      q: "Is my data secure?",
      a: "Aetheria utilizes the TON blockchain for all asset ownership and transaction security. Your wallet is your identity, and all land titles are stored as immutable NFTs."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-block p-3 bg-cyan-500/10 rounded-full mb-6">
          <HelpCircle className="w-10 h-10 text-cyan-400" />
        </div>
        <h1 className="text-4xl md:text-6xl font-cinzel font-bold mb-4">Frequency Asked Questions</h1>
        <p className="text-gray-400 text-lg">Everything you need to know about the Skylands economy.</p>
      </motion.div>

      <div className="space-y-4">
        {questions.map((item, idx) => (
          <FAQItem key={idx} question={item.q} answer={item.a} />
        ))}
      </div>
    </div>
  );
};

const FAQItem: React.FC<{ question: string, answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-bold text-gray-200">{question}</span>
        {isOpen ? <Minus className="w-5 h-5 text-cyan-400" /> : <Plus className="w-5 h-5 text-gray-500" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 text-gray-400 text-sm leading-relaxed border-t border-white/5">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FAQ;
