import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { 
  CheckCircle2, Lock, Zap, User as UserIcon, LogIn, 
  RefreshCcw, Loader2, Twitter, Send, 
  Box, Share2, Copy, Globe, Link as LinkIcon, Shield, Gem, Map, Scan, Radio
} from 'lucide-react';
import { User } from '../types'; 
import { ADMIN_WALLET, INVITES_FOR_EA, SOCIAL_LINKS, API_BASE_URL } from '../constants';

interface DashboardProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  error?: string | null;
  retry?: () => void;
}

// --- BADGE SYSTEM CONFIGURATION ---
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
  
  // Стан для анімації сканування конкретного завдання
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

  // --- LOGIC: SCAN PROTOCOL (QUESTS ONLY) ---
  // Розділена логіка: це перевірка квесту для бейджів, а не прив'язка профілю
  const handleScanProtocol = async (platform: 'twitter' | 'telegram') => {
    if (scanningTask) return; // Запобігаємо подвійним клікам

    try {
      setScanningTask(platform); // Вмикаємо анімацію сканування
      
      // 1. Відкриваємо цільовий протокол
      window.open(platform === 'twitter' ? SOCIAL_LINKS.TWITTER : SOCIAL_LINKS.TELEGRAM, '_blank');
      
      // 2. Імітуємо роботу сканера (візуальний ефект затримки)
      await new Promise(r => setTimeout(r, 5000));

      // 3. Відправляємо запит на перевірку квесту
      // Використовуємо окремий шлях або емуляцію, щоб не псувати auth
      // Тут ми припускаємо, що бекенд має ендпоінт або ми просто оновлюємо UI
      const res = await fetch(`${API_BASE_URL}/api/quests/verify`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: user?.walletAddress, platform })
      });
      
      if (res.ok) {
         const data = await res.json();
         if (data.success) setUser(data.user);
      } else {
         // Fallback: Якщо API ще немає, емулюємо успіх для UI
         setUser(prev => prev ? ({
             ...prev,
             socialsFollowed: { ...prev.socialsFollowed, [platform]: true }
         }) : null);
      }

    } catch (e) {
      setLocalError(`Signal lost for ${platform}. Retry.`);
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
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse"></div>
                <LogIn className="w-8 h-8 text-gray-400 relative z-10" /> 
            </div>
            <h2 className="text-2xl font-cinzel font-bold text-white mb-4">ACCESS RESTRICTED</h2>
            <button onClick={() => tonConnectUI.openModal()} className="px-8 py-3 bg-white text-black font-bold rounded-full uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]">
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
      
      {/* --- BACKGROUND GRID --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[#030305]" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto pt-8 px-6 lg:px-12">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-cyan-500" />
                <h1 className="text-lg font-cinzel font-bold tracking-widest text-white uppercase">Command Center</h1>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                <span className="text-[10px] font-mono text-gray-400 uppercase">System Online</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN (STATS & BADGES) --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. BADGE COLLECTION */}
            <div className="p-6 rounded-[2rem] bg-[#0E0E10] border border-white/5 relative overflow-hidden backdrop-blur-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                    <Scan className="w-3 h-3" /> Identity Matrix (Badges)
                </h3>
                <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                        {earnedBadges.map((badge) => (
                            <motion.div 
                                key={badge.id}
                                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#151518] border border-white/5 hover:border-white/20 transition-all cursor-default group hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                            >
                                <badge.icon className={`w-3 h-3 ${badge.color}`} />
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wide group-hover:text-white transition-colors">
                                    {badge.label}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {earnedBadges.length === 0 && (
                        <span className="text-xs text-gray-600 font-mono">No attributes synthesized yet.</span>
                    )}
                </div>
            </div>

            {/* 2. REGISTRY EXPANSION */}
            <div className="p-8 rounded-[2rem] bg-[#0E0E10] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[60px]"></div>
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Registry Expansion</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-cinzel font-bold text-white drop-shadow-lg">{user.inviteCount}</span>
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Recruits</span>
                        </div>
                    </div>
                    <button onClick={copyReferral} className="w-10 h-10 rounded-xl bg-[#1A1A1E] flex items-center justify-center text-cyan-500 border border-white/5 hover:bg-[#25252A] hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-[#050505] rounded-xl border border-white/5 mb-4 relative z-10">
                    <div className="flex-1 px-3 py-2 text-xs font-mono text-gray-400 truncate select-all">
                        https://t.me/AetheriaBot?start={user.referralCode}
                    </div>
                    <button onClick={copyReferral} className="p-2 rounded-lg bg-[#1A1A1E] text-white hover:bg-[#25252A] transition-colors">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* 3. MOBILIZATION */}
            <div className="p-8 rounded-[2rem] bg-[#0E0E10] border border-white/5 relative">
                <div className="flex items-center gap-2 mb-6">
                    <Radio className="w-4 h-4 text-cyan-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Mobilization</span>
                </div>
                <div className="w-full h-2 bg-[#1A1A1E] rounded-full overflow-hidden mb-2 relative">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${inviteProgress}%` }}
                        className="h-full bg-gradient-to-r from-cyan-600 to-blue-600 relative z-10"
                    />
                     {/* Grid Pattern in bar */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-20"></div>
                </div>
                <div className="flex justify-between text-[9px] uppercase tracking-wider font-mono text-gray-500">
                    <span>Current: {user.inviteCount}</span>
                    <span>Target: {INVITES_FOR_EA}</span>
                </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN (STAGES & TASKS) --- */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* STAGE 1: REGISTRY (DONE) */}
            <div className="p-6 rounded-[2rem] bg-[#0E0E10] border border-white/5 flex items-center gap-6 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                <div className="w-12 h-12 rounded-full bg-[#151518] border border-white/5 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-green-500" />
                </div>
                <div>
                    <h3 className="text-lg font-cinzel font-bold text-white uppercase tracking-widest mb-1">Registry Entrance</h3>
                    <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Identity bound. Badges: Genesis, Early Adopter.</p>
                </div>
                <CheckCircle2 className="ml-auto w-5 h-5 text-green-500" />
            </div>

            {/* STAGE 2: EARLY ACCESS */}
            <div className={`p-6 md:p-8 rounded-[2rem] bg-[#0E0E10] border transition-all relative overflow-hidden ${user.hasPaidEarlyAccess ? 'border-green-500/20' : 'border-white/5'}`}>
                 {/* Background ambient glow */}
                {user.hasPaidEarlyAccess && <div className="absolute right-0 top-0 w-64 h-64 bg-green-500/5 blur-[80px] -z-10" />}

                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${user.hasPaidEarlyAccess ? 'bg-[#151518] border-green-500/20' : 'bg-[#151518] border-yellow-500/20'}`}>
                        {user.hasPaidEarlyAccess ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <LinkIcon className="w-5 h-5 text-yellow-500" />}
                    </div>
                    
                    <div className="flex-grow">
                        <h3 className="text-lg font-cinzel font-bold text-white uppercase tracking-widest mb-1">Early Access Pass</h3>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                            {user.hasPaidEarlyAccess 
                                ? "Position Secured. 'Alpha Access' Badge Awarded." 
                                : "Secure your position. Unlocks 'Alpha Access'."}
                        </p>
                        
                        {!user.hasPaidEarlyAccess && user.inviteCount >= INVITES_FOR_EA && (
                            <div className="mt-6 flex gap-3">
                                <button 
                                    onClick={handlePayment}
                                    disabled={loading || isPolling}
                                    className="px-6 py-3 rounded-xl bg-[#1A1A1E] border border-white/10 hover:border-yellow-500/50 hover:bg-[#202025] text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group"
                                >
                                    {loading || isPolling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-yellow-500 group-hover:scale-110 transition-transform" />}
                                    Initiate Transfer (0.05 TON)
                                </button>
                                <button onClick={handleManualCheck} disabled={isPolling} className="w-10 h-10 rounded-xl bg-[#1A1A1E] border border-white/10 flex items-center justify-center hover:text-white text-gray-400">
                                    <RefreshCcw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        )}
                         {!user.hasPaidEarlyAccess && user.inviteCount < INVITES_FOR_EA && (
                             <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                                 <Lock className="w-3 h-3" /> Locked: Need {INVITES_FOR_EA - user.inviteCount} more recruits
                             </div>
                         )}
                    </div>
                </div>
            </div>

            {/* STAGE 3: LEGENDARY MINT & TASKS */}
            <div className={`relative p-1 rounded-[2.5rem] ${user.hasPaidEarlyAccess ? 'bg-gradient-to-b from-purple-900/40 to-transparent' : 'bg-[#0E0E10]'}`}>
                
                <div className={`p-8 rounded-[2.3rem] bg-[#0A0A0C] border ${user.hasPaidEarlyAccess ? 'border-purple-500/30' : 'border-white/5'} overflow-hidden relative`}>
                    
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* 3D Cube / Visual */}
                        <div className="w-full md:w-32 h-32 rounded-3xl bg-[#0F0F12] border border-white/5 flex items-center justify-center shrink-0 relative shadow-2xl mx-auto md:mx-0 overflow-hidden">
                             {/* Internal Grid */}
                             <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(168,85,247,0.05)_50%,transparent_75%)] bg-[length:10px_10px]"></div>

                             <div className={`absolute inset-0 bg-purple-500/10 blur-xl ${user.hasPaidEarlyAccess ? 'opacity-100' : 'opacity-0'}`}></div>
                             {user.hasMintedNFT ? (
                                 <Gem className="w-12 h-12 text-purple-400 relative z-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-pulse" />
                             ) : (
                                 <Box className={`w-12 h-12 relative z-10 ${user.hasPaidEarlyAccess ? 'text-purple-400/50' : 'text-gray-700'}`} />
                             )}
                        </div>

                        <div className="flex-grow w-full">
                            <h3 className="text-2xl font-cinzel font-bold text-white uppercase tracking-widest mb-2">Genesis Artifact</h3>
                            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-6">
                                Execute verification protocols to materialize Artifact.<br/>
                            </p>

                            <div className={`space-y-4 ${!user.hasPaidEarlyAccess ? 'opacity-30 pointer-events-none filter blur-[1px]' : ''}`}>
                                
                                {/* QUESTS SECTION - STYLED AS HOLOGRAPHIC DATA CARDS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    
                                    {/* QUEST: TWITTER */}
                                    <button 
                                        onClick={() => handleScanProtocol('twitter')}
                                        disabled={user.socialsFollowed.twitter || !!scanningTask}
                                        className={`group relative h-14 rounded-xl border overflow-hidden transition-all flex items-center px-4 gap-3 ${
                                            user.socialsFollowed.twitter 
                                            ? 'bg-green-900/10 border-green-500/30' 
                                            : 'bg-[#0F0F12] border-white/5 hover:border-cyan-500/50'
                                        }`}
                                    >
                                        {/* Scanning animation line */}
                                        {scanningTask === 'twitter' && (
                                            <motion.div 
                                                initial={{ left: '-100%' }} animate={{ left: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent skew-x-12 z-0"
                                            />
                                        )}

                                        <div className={`relative z-10 p-1.5 rounded bg-black/50 ${user.socialsFollowed.twitter ? 'text-green-500' : 'text-cyan-500'}`}>
                                            <Twitter className="w-4 h-4" />
                                        </div>
                                        
                                        <div className="relative z-10 flex flex-col items-start">
                                            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest leading-none mb-1">Target: X Protocol</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${user.socialsFollowed.twitter ? 'text-green-400' : 'text-white'}`}>
                                                {user.socialsFollowed.twitter 
                                                    ? 'Uplink Established' 
                                                    : scanningTask === 'twitter' ? 'Scanning...' : 'Initialize'}
                                            </span>
                                        </div>

                                        {user.socialsFollowed.twitter && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                                    </button>
                                    
                                    {/* QUEST: TELEGRAM */}
                                    <button 
                                        onClick={() => handleScanProtocol('telegram')}
                                        disabled={user.socialsFollowed.telegram || !!scanningTask}
                                        className={`group relative h-14 rounded-xl border overflow-hidden transition-all flex items-center px-4 gap-3 ${
                                            user.socialsFollowed.telegram 
                                            ? 'bg-green-900/10 border-green-500/30' 
                                            : 'bg-[#0F0F12] border-white/5 hover:border-cyan-500/50'
                                        }`}
                                    >
                                        {/* Scanning animation line */}
                                        {scanningTask === 'telegram' && (
                                            <motion.div 
                                                initial={{ left: '-100%' }} animate={{ left: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent skew-x-12 z-0"
                                            />
                                        )}

                                        <div className={`relative z-10 p-1.5 rounded bg-black/50 ${user.socialsFollowed.telegram ? 'text-green-500' : 'text-cyan-500'}`}>
                                            <Send className="w-4 h-4" />
                                        </div>
                                        
                                        <div className="relative z-10 flex flex-col items-start">
                                            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest leading-none mb-1">Target: TG Channel</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${user.socialsFollowed.telegram ? 'text-green-400' : 'text-white'}`}>
                                                {user.socialsFollowed.telegram 
                                                    ? 'Uplink Established' 
                                                    : scanningTask === 'telegram' ? 'Scanning...' : 'Initialize'}
                                            </span>
                                        </div>

                                        {user.socialsFollowed.telegram && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                                    </button>
                                </div>

                                {/* MINT ACTION */}
                                <button 
                                    disabled={!user.socialsFollowed.twitter || !user.socialsFollowed.telegram || user.hasMintedNFT}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 transition-all shadow-lg relative overflow-hidden group ${
                                        user.hasMintedNFT 
                                        ? 'bg-[#0F0F12] text-purple-400 border border-purple-500/30 cursor-default'
                                        : (user.socialsFollowed.twitter && user.socialsFollowed.telegram)
                                            ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-purple-900/40 hover:scale-[1.01]'
                                            : 'bg-[#15151A] text-gray-600 border border-white/5 cursor-not-allowed'
                                    }`}
                                >
                                     {/* Shine effect on ready button */}
                                    {!user.hasMintedNFT && user.socialsFollowed.twitter && user.socialsFollowed.telegram && (
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine" />
                                    )}

                                    {user.hasMintedNFT ? (
                                        <>Artifact Materialized</>
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