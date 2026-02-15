import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { 
  CheckCircle2, Lock, Zap, User as UserIcon, LogIn, 
  RefreshCcw, Loader2, Twitter, Send, 
  Box, Share2, Copy, Globe, Link as LinkIcon,
  ScanLine, Radio, ShieldCheck, Terminal
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

  // --- LOGIC: COPY LINK ---
  const copyReferral = () => {
    if (user?.referralCode) {
      const link = `https://t.me/AetheriaBot?start=${user.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- LOGIC: SOCIAL QUESTS (Verification Protocols) ---
  const handleSocialVerify = async (platform: 'twitter' | 'telegram') => {
    // 1. Open Link immediately
    window.open(platform === 'twitter' ? SOCIAL_LINKS.TWITTER : SOCIAL_LINKS.TELEGRAM, '_blank');
    
    // 2. Start Visual "Scanning" Process
    setVerifyingStep(platform);
    setScanProgress(0);
    setLocalError(null);

    // Imitate scanning progress (User feedback loop)
    const interval = setInterval(() => {
        setScanProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.floor(Math.random() * 10) + 5;
        });
    }, 200);

    try {
      // Artificial delay for "Verification" feel (3.5s total)
      await new Promise(r => setTimeout(r, 3500));
      clearInterval(interval);
      setScanProgress(100);

      // 3. Backend Sync (Badge Update Only)
      const res = await fetch(`${API_BASE_URL}/api/auth/update-socials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: user?.walletAddress, platform })
      });
      const data = await res.json();
      
      if (data.success) {
          setUser(data.user);
      } else {
          setLocalError("Signature verification failed.");
      }
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
            <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] mb-8">Authentication Required</p>
            <button onClick={() => tonConnectUI.openModal()} className="group relative px-8 py-4 bg-white text-black font-bold rounded-xl uppercase tracking-widest text-xs overflow-hidden transition-all hover:scale-105">
                <span className="relative z-10">Connect Wallet</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center text-cyan-400">
        <div className="relative">
            <div className="absolute inset-0 blur-lg bg-cyan-500/20"></div>
            <Loader2 className="w-10 h-10 animate-spin relative z-10" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] mt-6 text-cyan-500/80">Initializing Registry...</p>
      </div>
    );
  }

  const inviteProgress = Math.min((user.inviteCount / INVITES_FOR_EA) * 100, 100);

  return (
    <div className="relative w-full min-h-screen bg-[#030305] text-white overflow-hidden pb-20 selection:bg-cyan-500/30">
      
      {/* --- BACKGROUND GRID --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[#030305]" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto pt-8 px-6 lg:px-12">
        
        {/* HEADER */}
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between mb-12 border-b border-white/5 pb-6"
        >
            <div className="flex items-center gap-4">
                <div className="p-2 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-xl font-cinzel font-bold tracking-widest text-white uppercase">Command Center</h1>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Unit: {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0E0E10] border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">System Online</span>
            </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN (STATS & REFERRALS) --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. REGISTRY EXPANSION CARD */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
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

            {/* 2. PROGRESS CARD */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-8 rounded-[2rem] bg-[#0A0A0C] border border-white/5 relative overflow-hidden"
            >
                <div className="flex items-center gap-2 mb-8">
                    <Radio className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Signal Strength</span>
                </div>

                <div className="relative h-4 bg-[#151518] rounded-full overflow-hidden border border-white/5 mb-2">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${inviteProgress}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 relative"
                    >
                         <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[size:10px_10px]" />
                    </motion.div>
                </div>
                
                <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                    <span className="text-gray-600">Phase 1 Clearance</span>
                    <span className={inviteProgress >= 100 ? "text-green-500 font-bold" : "text-white"}>
                        {user.inviteCount}/{INVITES_FOR_EA}
                    </span>
                </div>
            </motion.div>
          </div>

          {/* --- RIGHT COLUMN (STAGES) --- */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* STAGE 1: REGISTRY (Compact) */}
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

            {/* STAGE 2: ACCESS PASS (Interactive) */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`p-1 rounded-[2.5rem] ${!user.hasPaidEarlyAccess ? 'bg-gradient-to-r from-yellow-900/20 to-transparent' : 'bg-[#0E0E10]'}`}
            >
                <div className="p-8 rounded-[2.3rem] bg-[#0A0A0C] border border-white/5 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        {/* Icon/Status */}
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
                            
                            {/* Action Area */}
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
                                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Protocol Locked: Await Recruits</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* STAGE 3: LEGENDARY MINT (The Quest Hub) */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="relative group"
            >
                {/* Background Glow */}
                <div className={`absolute -inset-1 rounded-[2.5rem] blur-xl opacity-20 transition-all duration-1000 ${user.hasPaidEarlyAccess ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-transparent'}`} />

                <div className={`relative p-8 rounded-[2.5rem] bg-[#08080A] border ${user.hasPaidEarlyAccess ? 'border-purple-500/30' : 'border-white/5'} overflow-hidden`}>
                    
                    {/* Locked Overlay if previous step not done */}
                    {!user.hasPaidEarlyAccess && (
                        <div className="absolute inset-0 z-20 bg-[#030305]/60 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="px-6 py-3 rounded-full bg-black border border-white/10 flex items-center gap-3">
                                <Lock className="w-4 h-4 text-gray-500" />
                                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Access Denied</span>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-8">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-6">
                            <div>
                                <h3 className="text-2xl font-cinzel font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                    <Box className="w-6 h-6 text-purple-500" /> Genesis Artifact
                                </h3>
                                <p className="text-[10px] text-purple-400/60 font-mono uppercase tracking-widest mt-1">
                                    Class: Legendary // Supply: Limited
                                </p>
                            </div>
                            {user.hasMintedNFT && (
                                <div className="px-3 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                    Acquired
                                </div>
                            )}
                        </div>

                        {/* QUESTS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* QUEST 1: TWITTER */}
                            <button
                                onClick={() => !user.socialsFollowed.twitter && handleSocialVerify('twitter')}
                                disabled={user.socialsFollowed.twitter || verifyingStep !== null}
                                className={`relative h-20 rounded-xl border flex items-center justify-between px-6 transition-all overflow-hidden group/quest
                                    ${user.socialsFollowed.twitter 
                                        ? 'bg-[#0F0F12] border-green-500/20' 
                                        : 'bg-[#0F0F12] border-white/5 hover:border-white/10'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${user.socialsFollowed.twitter ? 'bg-green-500/10 text-green-500' : 'bg-[#1A1A1E] text-white'}`}>
                                        <Twitter className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Protocol X</div>
                                        <div className="text-[9px] font-mono text-gray-600">Establish Comm Link</div>
                                    </div>
                                </div>

                                {/* Status Indicator */}
                                <div className="relative z-10">
                                    {verifyingStep === 'twitter' ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] text-cyan-400 font-mono animate-pulse">SCANNING {scanProgress}%</span>
                                            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin mt-1" />
                                        </div>
                                    ) : user.socialsFollowed.twitter ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    )}
                                </div>

                                {/* Progress Bar Overlay for Scanning */}
                                {verifyingStep === 'twitter' && (
                                    <motion.div 
                                        className="absolute inset-0 bg-cyan-500/10 z-0" 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${scanProgress}%` }}
                                    />
                                )}
                            </button>

                            {/* QUEST 2: TELEGRAM */}
                            <button
                                onClick={() => !user.socialsFollowed.telegram && handleSocialVerify('telegram')}
                                disabled={user.socialsFollowed.telegram || verifyingStep !== null}
                                className={`relative h-20 rounded-xl border flex items-center justify-between px-6 transition-all overflow-hidden group/quest
                                    ${user.socialsFollowed.telegram 
                                        ? 'bg-[#0F0F12] border-green-500/20' 
                                        : 'bg-[#0F0F12] border-white/5 hover:border-white/10'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${user.socialsFollowed.telegram ? 'bg-green-500/10 text-green-500' : 'bg-[#1A1A1E] text-white'}`}>
                                        <Send className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Protocol TG</div>
                                        <div className="text-[9px] font-mono text-gray-600">Join Squadron</div>
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    {verifyingStep === 'telegram' ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] text-cyan-400 font-mono animate-pulse">SCANNING {scanProgress}%</span>
                                            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin mt-1" />
                                        </div>
                                    ) : user.socialsFollowed.telegram ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    )}
                                </div>

                                {verifyingStep === 'telegram' && (
                                    <motion.div 
                                        className="absolute inset-0 bg-cyan-500/10 z-0" 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${scanProgress}%` }}
                                    />
                                )}
                            </button>
                        </div>

                        {/* MINT BUTTON */}
                        <div className="pt-4 border-t border-white/5">
                            <button 
                                disabled={!user.socialsFollowed.twitter || !user.socialsFollowed.telegram || user.hasMintedNFT}
                                className={`w-full py-5 rounded-xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 transition-all relative overflow-hidden group ${
                                    user.hasMintedNFT 
                                    ? 'bg-[#0F0F12] text-green-500 border border-green-500/30 cursor-default'
                                    : (user.socialsFollowed.twitter && user.socialsFollowed.telegram)
                                        ? 'bg-white text-black hover:scale-[1.01] shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                        : 'bg-[#15151A] text-gray-600 border border-white/5 cursor-not-allowed'
                                }`}
                            >
                                {/* Animated Shine for active button */}
                                {(!user.hasMintedNFT && user.socialsFollowed.twitter && user.socialsFollowed.telegram) && (
                                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />
                                )}

                                {user.hasMintedNFT ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" /> Artifact Secured
                                    </>
                                ) : (
                                    <>
                                        <ScanLine className={`w-4 h-4 ${(!user.socialsFollowed.twitter || !user.socialsFollowed.telegram) ? 'opacity-30' : ''}`} /> 
                                        Initialize Materialization
                                    </>
                                )}
                            </button>
                            {localError && <p className="text-center text-[10px] text-red-500 uppercase tracking-widest mt-4 animate-pulse">{localError}</p>}
                        </div>

                    </div>
                </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;