import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { 
  CheckCircle2, Lock, Zap, Coins, User as UserIcon, LogIn, 
  RefreshCcw, AlertTriangle, Loader2, Twitter, Send, 
  Box, Share2, Copy, Globe, Link as LinkIcon
} from 'lucide-react';
import { User } from '../types';
import { ADMIN_WALLET, INVITES_FOR_EA, SOCIAL_LINKS, API_BASE_URL } from '../constants';

interface DashboardProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  error?: string | null;
  retry?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, setUser, error, retry }) => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [loading, setLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // --- LOGIC: COPY LINK ---
  const copyReferral = () => {
    if (user?.referralCode) {
      const link = `https://t.me/AetheriaBot?start=${user.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- LOGIC: SOCIAL VERIFY ---
  const handleSocialVerify = async (platform: 'twitter' | 'telegram') => {
    try {
      setLoading(true);
      window.open(platform === 'twitter' ? SOCIAL_LINKS.TWITTER : SOCIAL_LINKS.TELEGRAM, '_blank');
      await new Promise(r => setTimeout(r, 2000)); 
      
      const res = await fetch(`${API_BASE_URL}/api/auth/update-socials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: user?.walletAddress, platform })
      });
      const data = await res.json();
      if (data.success) setUser(data.user);
    } catch (e) {
      setLocalError("Social synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC: PAYMENT POLLING ---
  const pollPaymentStatus = async () => {
      setIsPolling(true);
      setLocalError(null);
      let attempts = 0;
      const maxAttempts = 20; 
      let verified = false;

      while (attempts < maxAttempts && !verified) {
          try {
              const res = await fetch(`${API_BASE_URL}/api/auth/mint`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ walletAddress: user?.walletAddress, updateField: 'hasPaidEarlyAccess' }),
              });
              const data = await res.json();
              if (data.success && data.user.hasPaidEarlyAccess) {
                  setUser(data.user);
                  verified = true;
                  break; 
              }
          } catch (e) { console.warn("Retrying uplink..."); }
          if (!verified) await new Promise(r => setTimeout(r, 3000));
          attempts++;
      }
      setIsPolling(false);
      if (!verified) setLocalError("Transaction processing... Check wallet.");
  };

  // --- LOGIC: PAYMENT HANDLER ---
  const handlePayment = async () => {
    try {
      setLoading(true);
      setLocalError(null);
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [{ address: ADMIN_WALLET, amount: "50000000" }], // 0.05 TON
      };
      const result = await tonConnectUI.sendTransaction(transaction);
      if (result) await pollPaymentStatus();
    } catch (e) {
      console.error(e);
      setLocalError("Transaction cancelled.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
      setLoading(true);
      await pollPaymentStatus();
      setLoading(false);
  }

  // --- RENDER: NOT CONNECTED ---
  if (!wallet) {
    return (
      <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                <LogIn className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-cinzel font-bold text-white mb-4">ACCESS RESTRICTED</h2>
            <button onClick={() => tonConnectUI.openModal()} className="px-8 py-3 bg-white text-black font-bold rounded-full uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors">
                Connect Wallet
            </button>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center text-cyan-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest">Loading Registry...</p>
      </div>
    );
  }

  const inviteProgress = Math.min((user.inviteCount / INVITES_FOR_EA) * 100, 100);

  return (
    <div className="relative w-full min-h-screen bg-[#030305] text-white overflow-hidden pb-20 selection:bg-purple-500/30">
      
      {/* --- BACKGROUND GRID (Dark & Subtle) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[#030305]" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto pt-8 px-6 lg:px-12">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-10">
            <UserIcon className="w-5 h-5 text-cyan-500" />
            <h1 className="text-lg font-cinzel font-bold tracking-widest text-white uppercase">Command Center</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN (STATS & REFERRALS) --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. REGISTRY EXPANSION CARD (Dark, clean) */}
            <div className="p-8 rounded-[2rem] bg-[#0E0E10] border border-white/5 relative overflow-hidden group">
                {/* Subtle gradient corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[60px]"></div>
                
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Registry Expansion</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-cinzel font-bold text-white">{user.inviteCount}</span>
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Recruits</span>
                        </div>
                    </div>
                    <button onClick={copyReferral} className="w-10 h-10 rounded-xl bg-[#1A1A1E] flex items-center justify-center text-cyan-500 border border-white/5 hover:bg-[#25252A] transition-colors">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Universal Referral Link</p>
                <div className="flex items-center gap-2 p-1.5 bg-[#050505] rounded-xl border border-white/5 mb-6">
                    <div className="flex-1 px-3 py-2 text-xs font-mono text-gray-400 truncate select-all">
                        https://t.me/AetheriaBot?start={user.referralCode}
                    </div>
                    <button 
                        onClick={copyReferral}
                        className="p-2 rounded-lg bg-[#1A1A1E] text-white hover:bg-[#25252A] transition-colors"
                    >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                    Reward: 5 Points per verified recruit
                </div>
            </div>

            {/* 2. SQUADRON MOBILIZATION (Progress) */}
            <div className="p-8 rounded-[2rem] bg-[#0E0E10] border border-white/5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-4 h-4 text-cyan-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Squadron Mobilization</span>
                </div>

                <div className="flex justify-between items-end mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recruits Assembled</span>
                    <span className="text-sm font-bold text-white">{inviteProgress.toFixed(0)}%</span>
                </div>

                <div className="w-full h-2 bg-[#1A1A1E] rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${inviteProgress}%` }}
                        className="h-full bg-gradient-to-r from-cyan-600 to-blue-600"
                    />
                </div>
                <p className="mt-4 text-[9px] text-center text-gray-600 uppercase tracking-widest font-mono">
                    Target: {INVITES_FOR_EA} recruits for phase 2 clearance
                </p>
            </div>
          </div>

          {/* --- RIGHT COLUMN (STAGES) --- */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* STAGE 1: REGISTRY ENTRANCE (Success State) */}
            <div className="p-6 md:p-8 rounded-[2rem] bg-[#0E0E10] border border-white/5 flex items-center gap-6 relative group hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#151518] border border-white/5 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-green-500" />
                </div>
                <div>
                    <h3 className="text-lg font-cinzel font-bold text-white uppercase tracking-widest mb-1">Registry Entrance</h3>
                    <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Identity successfully bound to the neural net.</p>
                </div>
                <div className="ml-auto hidden md:flex w-8 h-8 rounded-full border border-green-500/20 items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
            </div>

            {/* STAGE 2: EARLY ACCESS PASS */}
            <div className={`p-6 md:p-8 rounded-[2rem] bg-[#0E0E10] border border-white/5 transition-all relative ${user.hasPaidEarlyAccess ? 'opacity-100' : 'opacity-100'}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${user.hasPaidEarlyAccess ? 'bg-[#151518] border-white/5' : 'bg-[#151518] border-yellow-500/20'}`}>
                        {user.hasPaidEarlyAccess ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <LinkIcon className="w-5 h-5 text-yellow-500" />}
                    </div>
                    
                    <div className="flex-grow">
                        <h3 className="text-lg font-cinzel font-bold text-white uppercase tracking-widest mb-1">Early Access Pass</h3>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Secure your position in the Skylands. (Gas: ~0.05 TON)</p>
                        
                        {/* PAYMENT ACTIONS (Only if not paid and invites ready) */}
                        {!user.hasPaidEarlyAccess && user.inviteCount >= INVITES_FOR_EA && (
                            <div className="mt-6 flex flex-wrap gap-3">
                                <button 
                                    onClick={handlePayment}
                                    disabled={loading || isPolling}
                                    className="px-6 py-3 rounded-xl bg-[#1A1A1E] border border-white/10 hover:border-yellow-500/50 hover:bg-[#202025] text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2"
                                >
                                    {loading || isPolling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-yellow-500" />}
                                    Initiate Transfer
                                </button>
                                <button 
                                    onClick={handleManualCheck}
                                    disabled={isPolling}
                                    className="w-10 h-10 rounded-xl bg-[#1A1A1E] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                >
                                    <RefreshCcw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
                                </button>
                                {localError && <span className="text-[10px] text-red-500 self-center uppercase tracking-wider">{localError}</span>}
                            </div>
                        )}
                         {!user.hasPaidEarlyAccess && user.inviteCount < INVITES_FOR_EA && (
                             <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                                 <Lock className="w-3 h-3" /> Locked: Await Referrals
                             </div>
                         )}
                    </div>
                    {user.hasPaidEarlyAccess && (
                        <div className="ml-auto hidden md:flex w-8 h-8 rounded-full border border-green-500/20 items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                    )}
                </div>
            </div>

            {/* STAGE 3: LEGENDARY MINT (The Main Event) */}
            <div className={`relative p-1 rounded-[2.5rem] ${user.hasPaidEarlyAccess ? 'bg-gradient-to-b from-purple-900/40 to-transparent' : 'bg-[#0E0E10]'}`}>
                {/* Glow behind the card */}
                {user.hasPaidEarlyAccess && <div className="absolute inset-0 bg-purple-600/10 blur-xl rounded-[2.5rem] -z-10"></div>}
                
                <div className={`p-8 rounded-[2.3rem] bg-[#0A0A0C] border ${user.hasPaidEarlyAccess ? 'border-purple-500/30' : 'border-white/5'} overflow-hidden relative`}>
                    
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* 3D Cube Placeholder */}
                        <div className="w-32 h-32 rounded-3xl bg-[#0F0F12] border border-white/5 flex items-center justify-center shrink-0 relative shadow-2xl">
                             <div className={`absolute inset-0 bg-purple-500/10 blur-xl ${user.hasPaidEarlyAccess ? 'opacity-100' : 'opacity-0'}`}></div>
                             {user.hasMintedNFT ? (
                                 <CheckCircle2 className="w-12 h-12 text-green-500 relative z-10" />
                             ) : (
                                 <Box className={`w-12 h-12 relative z-10 ${user.hasPaidEarlyAccess ? 'text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-gray-700'}`} />
                             )}
                        </div>

                        <div className="flex-grow w-full text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center gap-3 mb-2 justify-center md:justify-start">
                                <h3 className="text-2xl font-cinzel font-bold text-white uppercase tracking-widest">Legendary Mint</h3>
                                {user.hasPaidEarlyAccess && !user.hasMintedNFT && (
                                    <span className="px-2 py-0.5 rounded bg-purple-600 text-[9px] font-bold text-white uppercase tracking-wider">Live</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-6">
                                Initialize Genesis Artifact materialization.<br/>
                                <span className="text-purple-400/80">Rarity determined by block hash.</span>
                            </p>

                            {/* Actions */}
                            <div className={`space-y-4 ${!user.hasPaidEarlyAccess ? 'opacity-30 pointer-events-none filter blur-[1px]' : ''}`}>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => handleSocialVerify('twitter')}
                                        className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${
                                            user.socialsFollowed.twitter 
                                            ? 'bg-[#0F0F12] border-green-500/30 text-green-500' 
                                            : 'bg-[#0F0F12] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                                        }`}
                                    >
                                        {user.socialsFollowed.twitter ? <CheckCircle2 className="w-3 h-3" /> : <Twitter className="w-3 h-3" />}
                                        Follow X
                                    </button>
                                    <button 
                                        onClick={() => handleSocialVerify('telegram')}
                                        className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${
                                            user.socialsFollowed.telegram 
                                            ? 'bg-[#0F0F12] border-green-500/30 text-green-500' 
                                            : 'bg-[#0F0F12] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                                        }`}
                                    >
                                        {user.socialsFollowed.telegram ? <CheckCircle2 className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                                        Join TG
                                    </button>
                                </div>

                                <button 
                                    disabled={!user.socialsFollowed.twitter || !user.socialsFollowed.telegram || user.hasMintedNFT}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                                        user.hasMintedNFT 
                                        ? 'bg-[#0F0F12] text-green-500 border border-green-500/30 cursor-default'
                                        : (user.socialsFollowed.twitter && user.socialsFollowed.telegram)
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30'
                                            : 'bg-[#15151A] text-gray-600 border border-white/5 cursor-not-allowed'
                                    }`}
                                >
                                    {user.hasMintedNFT ? (
                                        <>Artifact Secured</>
                                    ) : (
                                        <>
                                            <Box className="w-4 h-4" /> Materialize Artifact
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;