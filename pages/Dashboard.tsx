import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { 
  CheckCircle2, Lock, Zap, LogIn, 
  RefreshCcw, Loader2, Twitter, Send, 
  Share2, Copy, Globe, 
  ScanLine, Crown, ShieldCheck, Gem,
  Image as ImageIcon, Sparkles
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
  
  // State for visual "Quest" tracking
  const [verifyingStep, setVerifyingStep] = useState<'twitter' | 'telegram' | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // --- LOGIC: VIP STATS (Minted Referrals Only) ---
  // ЦІЛЬ ЗМІНЕНО НА 1
  const vipReferralsCount = (user as any).mintedInviteCount || 0; 
  const VIP_TARGET = 1;
  const vipProgress = Math.min((vipReferralsCount / VIP_TARGET) * 100, 100);

  // --- LOGIC: COPY LINK ---
  const copyReferral = () => {
    if (user?.referralCode) {
      const link = `https://aetheria-skylands.vercel.app/?start=${user.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- LOGIC: SOCIAL QUESTS ---
  const handleSocialVerify = async (platform: 'twitter' | 'telegram') => {
    window.open(platform === 'twitter' ? SOCIAL_LINKS.TWITTER : SOCIAL_LINKS.TELEGRAM, '_blank');
    
    setVerifyingStep(platform);
    setScanProgress(0);
    setLocalError(null);

    const interval = setInterval(() => {
        setScanProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.floor(Math.random() * 10) + 5;
        });
    }, 200);

    try {
      await new Promise(r => setTimeout(r, 3500));
      clearInterval(interval);
      setScanProgress(100);

      const res = await fetch(`${API_BASE_URL}/api/auth/update-socials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: user?.walletAddress, platform })
      });
      const data = await res.json();
      
      if (data.success) setUser(data.user);
      else setLocalError("Signature verification failed.");
    } catch (e) {
      setLocalError("Network synchronization failed.");
    } finally {
      setVerifyingStep(null);
      setScanProgress(0);
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
      <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent opacity-50" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center relative z-10 p-10 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-xl">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                <LogIn className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-3xl font-cinzel font-bold text-white mb-2 tracking-widest">SYSTEM LOCKED</h2>
            <button onClick={() => tonConnectUI.openModal()} className="mt-8 px-8 py-4 bg-white text-black font-bold rounded-xl uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                Connect Wallet
            </button>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center text-cyan-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  // LOGIC HELPERS
  const isSocialsComplete = user.socialsFollowed.twitter && user.socialsFollowed.telegram;

  return (
    <div className="relative w-full min-h-screen bg-[#030305] text-white overflow-hidden pb-20 selection:bg-cyan-500/30">
      
      {/* --- BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[#030305]" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto pt-12 px-6 lg:px-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. REGISTRY EXPANSION (ALL INVITES) */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="p-1 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent relative group"
            >
                <div className="absolute inset-0 bg-cyan-500/5 blur-xl group-hover:bg-cyan-500/10 transition-colors duration-500 rounded-[2rem]" />
                <div className="bg-[#0A0A0C] p-8 rounded-[1.9rem] h-full relative overflow-hidden">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500/70 mb-2 flex items-center gap-2">
                                <Globe className="w-3 h-3" /> Network Expansion
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-cinzel font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                    {user.inviteCount}
                                </span>
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Units</span>
                            </div>
                        </div>
                        <button onClick={copyReferral} className="w-12 h-12 rounded-2xl bg-[#151518] flex items-center justify-center text-cyan-400 border border-white/5 hover:border-cyan-500/50 hover:bg-[#1A1A1E] transition-all group/btn">
                            <Share2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Secure Uplink</p>
                        <div className="flex items-center gap-2 p-2 bg-[#050505] rounded-xl border border-white/10 group-hover:border-white/20 transition-colors">
                            <div className="flex-1 px-3 py-2 text-[10px] font-mono text-gray-400 truncate select-all">
                                t.me/AetheriaBot?start={user.referralCode}
                            </div>
                            <button 
                                onClick={copyReferral}
                                className="p-2.5 rounded-lg bg-[#151518] text-white hover:bg-[#202025] transition-colors border border-white/5"
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 2. VIP / GOLD AIRDROP STATUS (MINTED ONLY) */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-1 rounded-[2rem] bg-gradient-to-br from-amber-500/20 via-transparent to-transparent relative group"
            >
                <div className="absolute inset-0 bg-amber-500/5 blur-xl group-hover:bg-amber-500/10 transition-colors duration-500 rounded-[2rem]" />
                <div className="bg-[#0A0A0C] p-8 rounded-[1.9rem] border border-amber-500/20 h-full relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <Crown className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">VIP Protocol</span>
                    </div>

                    <h3 className="text-lg font-cinzel font-bold text-white mb-2 leading-tight">
                        Gold Airdrop Whitelist
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono mb-6 leading-relaxed">
                        Recruit <span className="text-white font-bold">1 agent</span> who successfully <span className="text-white font-bold">Mints the Artifact</span>.
                        <br/><span className="text-amber-500/70 text-[9px] uppercase mt-1 block">Standard referrals do not count here.</span>
                    </p>

                    {/* Progress Bar for Minted Referrals */}
                    <div className="relative h-3 bg-[#151518] rounded-full overflow-hidden border border-white/5 mb-2">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${vipProgress}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 relative"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[size:10px_10px]" />
                        </motion.div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[9px] uppercase font-mono tracking-wider">
                        <span className="text-gray-600">Artifact Holders Recruited</span>
                        <span className={vipReferralsCount >= VIP_TARGET ? "text-amber-400 font-bold" : "text-gray-500"}>
                            {vipReferralsCount}/{VIP_TARGET} Qualified
                        </span>
                    </div>
                </div>
            </motion.div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* STAGE 1: REGISTRY */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-[2rem] bg-[#0E0E10] border border-white/5 flex items-center gap-6"
            >
                <div className="w-10 h-10 rounded-full bg-green-900/20 border border-green-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                    <h3 className="text-sm font-cinzel font-bold text-white uppercase tracking-widest">Identity Verified</h3>
                    <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">Neural link established.</p>
                </div>
            </motion.div>

            {/* STAGE 2: ACCESS PASS */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`p-1 rounded-[2.5rem] ${!user.hasPaidEarlyAccess ? 'bg-gradient-to-r from-yellow-900/20 to-transparent' : 'bg-[#0E0E10]'}`}
            >
                <div className="p-8 rounded-[2.3rem] bg-[#0A0A0C] border border-white/5 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${user.hasPaidEarlyAccess ? 'bg-green-900/10 border-green-500/30 text-green-500' : 'bg-yellow-900/10 border-yellow-500/30 text-yellow-500'}`}>
                            {user.hasPaidEarlyAccess ? <CheckCircle2 className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                        </div>

                        <div className="flex-grow">
                            <h3 className="text-xl font-cinzel font-bold text-white uppercase tracking-widest mb-2">Early Access Clearance</h3>
                            {user.hasPaidEarlyAccess ? (
                                <p className="text-xs text-green-500 font-mono uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> Clearance Granted
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                                    Requirement: {INVITES_FOR_EA} Recruits + 0.05 TON Gas Fee
                                </p>
                            )}
                            
                            {!user.hasPaidEarlyAccess && (
                                <div className="mt-6">
                                    {user.inviteCount >= INVITES_FOR_EA ? (
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={handlePayment}
                                                disabled={loading || isPolling}
                                                className="px-8 py-3 rounded-xl bg-[#EAB308] text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#CA8A04] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-black" />}
                                                Initialize Transfer
                                            </button>
                                            <button 
                                                onClick={handleManualCheck}
                                                className="p-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                                            >
                                                <RefreshCcw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                            <Lock className="w-3 h-3 text-red-500" />
                                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Locked: Await Recruits</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* STAGE 3 WRAPPER: Contains Socials (Quest 3) and Mint (Quest 4) */}
            <div className="relative space-y-4">
                
                {/* GLOBAL OVERLAY if Not Paid Early Access (Covers both) */}
                {!user.hasPaidEarlyAccess && (
                    <div className="absolute inset-0 z-30 bg-[#030305]/80 backdrop-blur-[4px] rounded-[2.5rem] flex flex-col items-center justify-center border border-white/5">
                        <Lock className="w-8 h-8 text-gray-600 mb-4" />
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Complete Previous Stages</span>
                    </div>
                )}

                {/* --- QUEST 3: SOCIAL PROTOCOLS (COMBINED) --- */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className={`p-8 rounded-[2.5rem] border transition-all ${isSocialsComplete ? 'bg-[#0E0E10] border-green-500/20' : 'bg-[#0A0A0C] border-white/5'}`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-cinzel font-bold text-white uppercase tracking-widest flex items-center gap-3">
                            <span className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 font-mono text-xs">03</span>
                            Protocol Verification
                        </h3>
                        {isSocialsComplete && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* TWITTER BTN */}
                        <button
                            onClick={() => !user.socialsFollowed.twitter && handleSocialVerify('twitter')}
                            disabled={user.socialsFollowed.twitter || verifyingStep !== null}
                            className={`relative h-16 rounded-xl border flex items-center gap-4 px-4 transition-all overflow-hidden
                                ${user.socialsFollowed.twitter 
                                    ? 'bg-[#151518] border-green-500/30 opacity-50' 
                                    : 'bg-[#151518] border-white/5 hover:border-white/20'
                                }
                            `}
                        >
                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white">
                                <Twitter className="w-4 h-4" />
                            </div>
                            <div className="text-left flex-grow">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Follow X</div>
                            </div>
                            {verifyingStep === 'twitter' ? (
                                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                            ) : user.socialsFollowed.twitter ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                            )}
                            {verifyingStep === 'twitter' && (
                                <motion.div className="absolute inset-0 bg-cyan-500/10" initial={{ width: 0 }} animate={{ width: `${scanProgress}%` }} />
                            )}
                        </button>

                        {/* TELEGRAM BTN */}
                        <button
                            onClick={() => !user.socialsFollowed.telegram && handleSocialVerify('telegram')}
                            disabled={user.socialsFollowed.telegram || verifyingStep !== null}
                            className={`relative h-16 rounded-xl border flex items-center gap-4 px-4 transition-all overflow-hidden
                                ${user.socialsFollowed.telegram 
                                    ? 'bg-[#151518] border-green-500/30 opacity-50' 
                                    : 'bg-[#151518] border-white/5 hover:border-white/20'
                                }
                            `}
                        >
                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white">
                                <Send className="w-4 h-4" />
                            </div>
                            <div className="text-left flex-grow">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Join TG</div>
                            </div>
                            {verifyingStep === 'telegram' ? (
                                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                            ) : user.socialsFollowed.telegram ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                            )}
                            {verifyingStep === 'telegram' && (
                                <motion.div className="absolute inset-0 bg-cyan-500/10" initial={{ width: 0 }} animate={{ width: `${scanProgress}%` }} />
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* CONNECTOR LINE (Visual Flow) */}
                <div className="flex justify-center -my-2 relative z-0">
                    <div className={`h-8 w-px border-l border-dashed ${isSocialsComplete ? 'border-green-500/50' : 'border-gray-700'}`}></div>
                </div>

                {/* --- QUEST 4: MINT (LOCKED UNTIL SOCIALS DONE) --- */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="relative group"
                >
                    {/* Access Denied Overlay (Local for Mint) */}
                    {!isSocialsComplete && user.hasPaidEarlyAccess && (
                        <div className="absolute inset-0 z-20 bg-[#030305]/60 backdrop-blur-[2px] rounded-[2.5rem] flex items-center justify-center border border-white/5">
                            <div className="px-6 py-3 rounded-full bg-black border border-white/10 flex items-center gap-3 shadow-2xl">
                                <Lock className="w-4 h-4 text-red-500" />
                                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Locked: Verify Socials</span>
                            </div>
                        </div>
                    )}

                    <div className={`relative p-1 rounded-[2.5rem] ${isSocialsComplete ? 'bg-gradient-to-b from-purple-600 to-blue-900' : 'bg-[#0E0E10]'}`}>
                        <div className="bg-[#08080A] rounded-[2.4rem] p-8 overflow-hidden relative">
                            
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-cinzel font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs ${isSocialsComplete ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-500'}`}>04</span>
                                    Genesis Artifact
                                </h3>
                                <div className="text-[9px] font-mono text-purple-400 uppercase tracking-widest border border-purple-500/20 px-2 py-1 rounded bg-purple-500/5">
                                    Supply: 8888
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                
                                {/* NFT PLACEHOLDER IMAGE (INSERT YOUR IMG HERE) */}
                                <div className="w-full md:w-48 aspect-square rounded-2xl bg-black/50 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group/img shrink-0 shadow-2xl">
                                    {/* Animated Scanline Effect */}
                                    {isSocialsComplete && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent animate-scan pointer-events-none" />}
                                    
                                    {/* Placeholder Content - Replace with <img src="..." /> later */}
                                    <div className={`transition-all duration-500 flex flex-col items-center ${isSocialsComplete ? 'scale-100 opacity-100' : 'scale-90 opacity-30 grayscale'}`}>
                                        <div className="relative">
                                            <ImageIcon className="w-12 h-12 text-gray-600 mb-3 mx-auto" />
                                            {isSocialsComplete && <Sparkles className="w-4 h-4 text-purple-400 absolute -top-1 -right-1 animate-pulse" />}
                                        </div>
                                        <span className="text-[9px] uppercase tracking-widest text-gray-700 font-mono">
                                            {isSocialsComplete ? "Ready for Mint" : "Encrypted"}
                                        </span>
                                    </div>
                                </div>

                                {/* MINT ACTION AREA */}
                                <div className="flex-grow w-full">
                                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-6 leading-relaxed">
                                        Materialize your unique genesis artifact on the blockchain. Rarity is determined by block hash upon generation.
                                    </p>

                                    <button 
                                        disabled={!isSocialsComplete || user.hasMintedNFT}
                                        className={`w-full py-5 rounded-xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 transition-all relative overflow-hidden group ${
                                            user.hasMintedNFT 
                                            ? 'bg-[#0F0F12] text-green-500 border border-green-500/30 cursor-default'
                                            : isSocialsComplete
                                                ? 'bg-white text-black hover:scale-[1.01] shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                                : 'bg-[#15151A] text-gray-600 border border-white/5 cursor-not-allowed'
                                        }`}
                                    >
                                        {(!user.hasMintedNFT && isSocialsComplete) && (
                                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />
                                        )}

                                        {user.hasMintedNFT ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" /> Artifact Secured
                                            </>
                                        ) : (
                                            <>
                                                <Gem className={`w-4 h-4 ${!isSocialsComplete ? 'opacity-30' : ''}`} /> 
                                                Initialize Materialization
                                            </>
                                        )}
                                    </button>
                                    {localError && <p className="text-center text-[10px] text-red-500 uppercase tracking-widest mt-4 animate-pulse">{localError}</p>}
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;