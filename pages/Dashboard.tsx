import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { 
  CheckCircle2, Lock, Zap, User as UserIcon, LogIn, 
  RefreshCcw, Loader2, Twitter, Send, 
  Box, Share2, Copy, Globe, Link as LinkIcon, Shield, Gem, Map, Scan, Radio, Activity
} from 'lucide-react';
import { User } from '../types'; 
import { ADMIN_WALLET, INVITES_FOR_EA, SOCIAL_LINKS, API_BASE_URL } from '../constants';

interface DashboardProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  error?: string | null;
  retry?: () => void;
}

// --- CONFIG: BADGES MATRIX ---
const BADGE_DEFINITIONS = [
  { id: 'genesis', label: 'Genesis Era', icon: Globe, color: 'text-blue-400', condition: () => true },
  { id: 'early', label: 'Early Adopter', icon: UserIcon, color: 'text-cyan-400', condition: () => true },
  { id: 'whitelist', label: 'Whitelisted', icon: Shield, color: 'text-emerald-400', condition: (u: User) => u.inviteCount >= INVITES_FOR_EA },
  { id: 'alpha', label: 'Alpha Access', icon: Zap, color: 'text-yellow-400', condition: (u: User) => u.hasPaidEarlyAccess },
  { id: 'minted', label: 'Artifact Holder', icon: Gem, color: 'text-purple-400', condition: (u: User) => u.hasMintedNFT },
  { id: 'island', label: 'Island Owner', icon: Map, color: 'text-orange-400', condition: (u: User) => u.hasMintedNFT },
];

const Dashboard: React.FC<DashboardProps> = ({ user, setUser, error, retry }) => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [loading, setLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // New State: Scanning Process for Quests
  const [scanningTask, setScanningTask] = useState<string | null>(null);

  // --- LOGIC: BADGE CALCULATION ---
  const earnedBadges = useMemo(() => {
    if (!user) return [];
    return BADGE_DEFINITIONS.filter(badge => badge.condition(user));
  }, [user]);

  // --- LOGIC: COPY LINK ---
  const copyReferral = () => {
    if (user?.referralCode) {
      const link = `https://t.me/AetheriaBot?start=${user.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- LOGIC: SCAN PROTOCOL (QUESTS) ---
  // Це ЛОКАЛЬНА перевірка виконання завдання (кліку), яка не перезаписує профіль
  const handleScanProtocol = async (platform: 'twitter' | 'telegram') => {
    if (scanningTask) return; // Block double clicks

    try {
      setScanningTask(platform); // Start scanning UI
      
      // 1. Open Target Link
      window.open(platform === 'twitter' ? SOCIAL_LINKS.TWITTER : SOCIAL_LINKS.TELEGRAM, '_blank');
      
      // 2. Simulate Scanning Process (Interaction Delay)
      await new Promise(r => setTimeout(r, 4500)); 

      // 3. Send Quest Completion Signal
      // Тут ми звертаємось до логіки оновлення квесту, а не прив'язки профілю
      const res = await fetch(`${API_BASE_URL}/api/auth/update-socials`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: user?.walletAddress, platform }) 
      });
      
      if (res.ok) {
         const data = await res.json();
         if (data.success) setUser(data.user);
      } else {
         // Fallback for visual feedback if API fails or in dev mode
         setUser(prev => prev ? ({
             ...prev,
             socialsFollowed: { ...prev.socialsFollowed, [platform]: true }
         }) : null);
      }

    } catch (e) {
      setLocalError(`Signal lost for ${platform}. Retry uplink.`);
    } finally {
      setScanningTask(null);
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
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-cyan-500/10 blur-xl animate-pulse"></div>
                <div className="absolute inset-0 bg-[linear-gradient(transparent_45%,rgba(255,255,255,0.1)_50%,transparent_55%)] bg-[length:100%_4px] animate-scan"></div>
                <LogIn className="w-10 h-10 text-gray-400 relative z-10" /> 
            </div>
            <h2 className="text-3xl font-cinzel font-bold text-white mb-2 tracking-widest">SYSTEM LOCKED</h2>
            <p className="text-xs font-mono text-cyan-500/70 uppercase tracking-[0.3em] mb-8">Authentication Required</p>
            <button onClick={() => tonConnectUI.openModal()} className="px-10 py-4 bg-white text-black font-black rounded-none clip-path-polygon uppercase tracking-[0.2em] text-xs hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                Connect Wallet
            </button>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center text-cyan-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Registry...</p>
      </div>
    );
  }

  const inviteProgress = Math.min((user.inviteCount / INVITES_FOR_EA) * 100, 100);

  return (
    <div className="relative w-full min-h-screen bg-[#030305] text-white overflow-hidden pb-24 selection:bg-cyan-500/30">
      
      {/* --- BACKGROUND GRID --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[#030305]" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto pt-10 px-6 lg:px-12">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-cyan-950/30 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                    <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-xl font-cinzel font-bold tracking-[0.15em] text-white uppercase leading-none">Command Center</h1>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Operator: {user.walletAddress?.slice(0,4)}...{user.walletAddress?.slice(-4)}</span>
                </div>
            </div>
            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">Uplink Stable</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. IDENTITY MATRIX (BADGES) - NEW VISUALS */}
            <div className="p-1 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent">
                <div className="p-6 rounded-[1.9rem] bg-[#0A0A0C] border border-white/5 relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                            <Scan className="w-3 h-3 text-cyan-500" /> Identity Matrix
                        </h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-2.5">
                        <AnimatePresence>
                            {earnedBadges.map((badge) => (
                                <motion.div 
                                    key={badge.id}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#121215] border border-white/5 hover:border-cyan-500/30 transition-all cursor-default group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-cyan-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <badge.icon className={`w-3.5 h-3.5 ${badge.color} relative z-10`} />
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-white transition-colors relative z-10">
                                        {badge.label}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {earnedBadges.length === 0 && (
                            <span className="text-xs text-gray-600 font-mono italic">Analysis in progress...</span>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. REGISTRY EXPANSION */}
            <div className="group p-8 rounded-[2rem] bg-[#0E0E10] border border-white/5 relative overflow-hidden transition-all hover:border-white/10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-[80px] group-hover:bg-cyan-500/10 transition-colors duration-500"></div>
                
                <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Network Expansion</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-cinzel font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{user.inviteCount}</span>
                            <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest bg-cyan-950/30 px-2 py-1 rounded">Nodes</span>
                        </div>
                    </div>
                    <button onClick={copyReferral} className="w-12 h-12 rounded-2xl bg-[#1A1A1E] flex items-center justify-center text-cyan-500 border border-white/5 hover:bg-cyan-500 hover:text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex items-center gap-2 p-1 bg-[#050505] rounded-xl border border-white/5 mb-4 relative z-10">
                    <div className="flex-1 px-4 py-3 text-[10px] font-mono text-gray-400 truncate select-all">
                        https://t.me/AetheriaBot?start={user.referralCode}
                    </div>
                    <button onClick={copyReferral} className="p-3 rounded-lg bg-[#151518] border border-white/5 text-gray-400 hover:text-white hover:bg-[#202025] transition-colors">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* 3. MOBILIZATION */}
            <div className="p-8 rounded-[2rem] bg-[#0E0E10] border border-white/5 relative">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Mobilization Status</span>
                </div>
                
                <div className="w-full h-3 bg-[#151518] rounded-full overflow-hidden mb-3 relative border border-white/5">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${inviteProgress}%` }}
                        className="h-full bg-gradient-to-r from-cyan-800 to-cyan-500 relative z-10"
                    >
                         <div className="absolute top-0 bottom-0 right-0 w-1 bg-white/50 shadow-[0_0_10px_white]"></div>
                    </motion.div>
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 z-20"></div>
                </div>
                
                <div className="flex justify-between text-[9px] uppercase tracking-wider font-mono text-gray-500">
                    <span>Protocol: {user.inviteCount} / {INVITES_FOR_EA}</span>
                    <span className={`${inviteProgress >= 100 ? 'text-emerald-500' : 'text-gray-500'}`}>
                        {inviteProgress.toFixed(0)}% Complete
                    </span>
                </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* STAGE 1: REGISTRY (DONE) */}
            <div className="p-6 rounded-[2rem] bg-[#0A0A0C] border border-white/5 flex items-center gap-6 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default">
                <div className="w-14 h-14 rounded-full bg-[#121215] border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                    <Globe className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-lg font-cinzel font-bold text-white uppercase tracking-widest mb-1">Registry Entrance</h3>
                    <div className="flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                         <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Identity Bound</p>
                    </div>
                </div>
                <div className="ml-auto p-2 rounded-full border border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
            </div>

            {/* STAGE 2: EARLY ACCESS */}
            <div className={`p-8 rounded-[2rem] bg-[#0E0E10] border transition-all duration-500 relative overflow-hidden group ${user.hasPaidEarlyAccess ? 'border-emerald-500/20' : 'border-white/5 hover:border-yellow-500/30'}`}>
                {user.hasPaidEarlyAccess && <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 blur-[100px] -z-10" />}

                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                    <div className={`w-14 h-14 rounded-full border flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${user.hasPaidEarlyAccess ? 'bg-[#121215] border-emerald-500/30' : 'bg-[#121215] border-yellow-500/20'}`}>
                        {user.hasPaidEarlyAccess ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <LinkIcon className="w-6 h-6 text-yellow-500" />}
                    </div>
                    
                    <div className="flex-grow">
                        <div className="flex items-center justify-between mb-2">
                             <h3 className="text-xl font-cinzel font-bold text-white uppercase tracking-widest">Early Access Pass</h3>
                             {user.hasPaidEarlyAccess && <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Verified</span>}
                        </div>
                        
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-6">
                            {user.hasPaidEarlyAccess 
                                ? "Secure connection established. Alpha clearance granted." 
                                : "Required for Phase 2 entry. Unlocks 'Alpha Access' Badge."}
                        </p>
                        
                        {!user.hasPaidEarlyAccess && user.inviteCount >= INVITES_FOR_EA && (
                            <div className="flex gap-4">
                                <button 
                                    onClick={handlePayment}
                                    disabled={loading || isPolling}
                                    className="px-8 py-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(234,179,8,0.1)] group"
                                >
                                    {loading || isPolling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-4 h-4 group-hover:fill-black" />}
                                    Initialize Transfer (0.05 TON)
                                </button>
                                <button onClick={handleManualCheck} disabled={isPolling} className="w-12 h-12 rounded-xl bg-[#1A1A1E] border border-white/10 flex items-center justify-center hover:text-white hover:border-white/30 text-gray-400 transition-all">
                                    <RefreshCcw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        )}
                         {!user.hasPaidEarlyAccess && user.inviteCount < INVITES_FOR_EA && (
                             <div className="inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                                 <Lock className="w-3 h-3" /> Access Denied: Requires {INVITES_FOR_EA - user.inviteCount} more recruits
                             </div>
                         )}
                    </div>
                </div>
            </div>

            {/* STAGE 3: LEGENDARY MINT & QUESTS - HOLOGRAPHIC REDESIGN */}
            <div className={`relative p-[1px] rounded-[2.5rem] overflow-hidden ${user.hasPaidEarlyAccess ? 'bg-gradient-to-b from-purple-500/50 to-transparent' : 'bg-[#151518]'}`}>
                {/* Animated Gradient Border Effect */}
                {user.hasPaidEarlyAccess && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-pulse -z-10"></div>}
                
                <div className={`p-8 rounded-[2.4rem] bg-[#08080A] h-full relative overflow-hidden`}>
                    
                    <div className="flex flex-col md:flex-row gap-10">
                        {/* 3D Cube / Visual Container */}
                        <div className="w-full md:w-40 h-40 rounded-[1.5rem] bg-[#0C0C0E] border border-white/5 flex items-center justify-center shrink-0 relative shadow-2xl mx-auto md:mx-0 overflow-hidden group">
                             {/* Holographic Grid Background */}
                             <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
                             
                             {/* Ambient Light */}
                             <div className={`absolute inset-0 bg-purple-500/20 blur-[40px] ${user.hasPaidEarlyAccess ? 'opacity-100' : 'opacity-0'} transition-opacity duration-700`}></div>
                             
                             {user.hasMintedNFT ? (
                                 <div className="relative z-10 p-4 bg-purple-500/10 rounded-full border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                                     <Gem className="w-10 h-10 text-purple-300 animate-pulse" />
                                 </div>
                             ) : (
                                 <Box className={`w-12 h-12 relative z-10 transition-colors duration-500 ${user.hasPaidEarlyAccess ? 'text-purple-400 drop-shadow-[0_0_10px_#a855f7]' : 'text-gray-700'}`} />
                             )}
                        </div>

                        <div className="flex-grow w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-cinzel font-bold text-white uppercase tracking-widest">Genesis Artifact</h3>
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${user.hasPaidEarlyAccess ? 'bg-purple-500 animate-pulse' : 'bg-gray-700'}`}></div>
                                    <span className="text-[9px] text-gray-500 font-mono uppercase">System: {user.hasPaidEarlyAccess ? 'Ready' : 'Standby'}</span>
                                </div>
                            </div>
                            
                            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-8 leading-relaxed">
                                Execute verification protocols to materialize Artifact.<br/>
                                <span className="text-purple-400/60">Warning: One-time synthesis per identity.</span>
                            </p>

                            <div className={`space-y-4 ${!user.hasPaidEarlyAccess ? 'opacity-30 pointer-events-none filter blur-[2px]' : ''}`}>
                                
                                {/* QUESTS: HOLOGRAPHIC DATA CARDS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    
                                    {/* TWITTER QUEST CARD */}
                                    <button 
                                        onClick={() => handleScanProtocol('twitter')}
                                        disabled={user.socialsFollowed.twitter || !!scanningTask}
                                        className={`relative h-16 rounded-xl border overflow-hidden transition-all flex items-center px-5 gap-4 group ${
                                            user.socialsFollowed.twitter 
                                            ? 'bg-emerald-950/10 border-emerald-500/30' 
                                            : 'bg-[#0F0F12] border-white/5 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                                        }`}
                                    >
                                        {/* Scanner Beam Animation */}
                                        {scanningTask === 'twitter' && (
                                            <div className="absolute inset-0 z-0">
                                                <div className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-scan-fast h-full"></div>
                                                <div className="absolute inset-0 bg-cyan-500/10"></div>
                                            </div>
                                        )}

                                        <div className={`relative z-10 p-2 rounded-lg ${user.socialsFollowed.twitter ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                            <Twitter className="w-5 h-5" />
                                        </div>
                                        
                                        <div className="relative z-10 flex flex-col items-start">
                                            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest leading-none mb-1.5">Protocol X</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${user.socialsFollowed.twitter ? 'text-emerald-400' : 'text-white'}`}>
                                                {user.socialsFollowed.twitter 
                                                    ? 'Uplink Established' 
                                                    : scanningTask === 'twitter' ? 'Scanning...' : 'Initialize'}
                                            </span>
                                        </div>

                                        {user.socialsFollowed.twitter && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            </motion.div>
                                        )}
                                    </button>
                                    
                                    {/* TELEGRAM QUEST CARD */}
                                    <button 
                                        onClick={() => handleScanProtocol('telegram')}
                                        disabled={user.socialsFollowed.telegram || !!scanningTask}
                                        className={`relative h-16 rounded-xl border overflow-hidden transition-all flex items-center px-5 gap-4 group ${
                                            user.socialsFollowed.telegram 
                                            ? 'bg-emerald-950/10 border-emerald-500/30' 
                                            : 'bg-[#0F0F12] border-white/5 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                                        }`}
                                    >
                                        {/* Scanner Beam Animation */}
                                        {scanningTask === 'telegram' && (
                                            <div className="absolute inset-0 z-0">
                                                <div className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-scan-fast h-full"></div>
                                                <div className="absolute inset-0 bg-cyan-500/10"></div>
                                            </div>
                                        )}

                                        <div className={`relative z-10 p-2 rounded-lg ${user.socialsFollowed.telegram ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                            <Send className="w-5 h-5" />
                                        </div>
                                        
                                        <div className="relative z-10 flex flex-col items-start">
                                            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest leading-none mb-1.5">Channel Uplink</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${user.socialsFollowed.telegram ? 'text-emerald-400' : 'text-white'}`}>
                                                {user.socialsFollowed.telegram 
                                                    ? 'Signal Verified' 
                                                    : scanningTask === 'telegram' ? 'Scanning...' : 'Initialize'}
                                            </span>
                                        </div>

                                        {user.socialsFollowed.telegram && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            </motion.div>
                                        )}
                                    </button>
                                </div>

                                {/* MINT ACTION BUTTON */}
                                <button 
                                    disabled={!user.socialsFollowed.twitter || !user.socialsFollowed.telegram || user.hasMintedNFT}
                                    className={`w-full py-5 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 transition-all shadow-xl relative overflow-hidden group ${
                                        user.hasMintedNFT 
                                        ? 'bg-[#0F0F12] text-purple-400 border border-purple-500/30 cursor-default'
                                        : (user.socialsFollowed.twitter && user.socialsFollowed.telegram)
                                            ? 'bg-gradient-to-r from-purple-800 to-indigo-800 text-white shadow-[0_0_30px_rgba(88,28,135,0.4)] hover:scale-[1.01] hover:from-purple-700 hover:to-indigo-700'
                                            : 'bg-[#15151A] text-gray-600 border border-white/5 cursor-not-allowed'
                                    }`}
                                >
                                     {/* Ready State: Moving Shine Effect */}
                                    {!user.hasMintedNFT && user.socialsFollowed.twitter && user.socialsFollowed.telegram && (
                                        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:250%_100%] animate-shine" />
                                    )}

                                    {user.hasMintedNFT ? (
                                        <>
                                            <Gem className="w-4 h-4" /> Artifact Materialized
                                        </>
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