
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';

interface ReferralCardProps {
  referralCode: string;
  inviteCount: number;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ referralCode, inviteCount }) => {
  const [copied, setCopied] = useState(false);
  // Correctly format the link for HashRouter
  const referralLink = `${window.location.origin}/#/?ref=${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group"
    >
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px] group-hover:bg-cyan-500/20 transition-all duration-700" />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Registry Expansion</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-cinzel font-bold text-white tracking-tighter">
              {inviteCount}
            </p>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Recruits</span>
          </div>
        </div>
        <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-inner">
          <Share2 className="text-cyan-400 w-6 h-6" />
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-center">
          <label className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] ml-1">Universal Referral Link</label>
          {copied && (
            <motion.span 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] text-green-400 font-bold uppercase tracking-widest"
            >
              Link Copied
            </motion.span>
          )}
        </div>
        
        <div className="relative group/input">
          <div className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-xs text-gray-400 font-mono overflow-hidden whitespace-nowrap overflow-ellipsis pr-14 select-all">
            {referralLink}
          </div>
          <button
            onClick={copyToClipboard}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all duration-300 ${
              copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            } border border-white/5`}
            title="Copy to clipboard"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Check className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Copy className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4 p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            Reward: 5 Points per verified recruit
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ReferralCard;
