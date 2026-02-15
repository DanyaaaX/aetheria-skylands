import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, Wallet, Coins, Users, 
  CheckCircle2, Twitter, Send, Copy, ShieldCheck, 
  Lock, Medal, Scroll, Gem, Star, Flame, Trophy, AlertTriangle, X, Save, Loader2 
} from 'lucide-react';
import { User } from '../types';
import { SOCIAL_LINKS, API_BASE_URL } from '../constants'; // Переконайся, що API_BASE_URL тут є

// --- TYPES EXTENSION ---
interface ExtendedUser extends User {
  dailyStreak?: number;
  hasNft?: boolean;
  xpProgress?: number;
  telegramHandle?: string;
  twitterHandle?: string;
}

interface ProfileProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Profile: React.FC<ProfileProps> = ({ user: initialUser, setUser }) => {
  const [copied, setCopied] = useState(false);
  
  // Стан для модального вікна та завантаження
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'twitter' | 'telegram' | null>(null);
  const [inputHandle, setInputHandle] = useState('');
  const [isSaving, setIsSaving] = useState(false); // Стан збереження в БД
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const user = initialUser as ExtendedUser;
  
  // Мокові дані
  const userStreak = user.dailyStreak || 5;
  const hasNft = user.hasNft || false; 
  const mysteryProgress = 45;

  // --- ГЕНЕРАЦІЯ УНІКАЛЬНОГО UID ---
  const uniqueUID = useMemo(() => {
    if (!user?.walletAddress) return "849201";
    let hash = 0;
    for (let i = 0; i < user.walletAddress.length; i++) {
      hash = user.walletAddress.charCodeAt(i) + ((hash << 5) - hash);
    }
    const base36 = Math.abs(hash).toString(36).toUpperCase();
    return (base36 + "X9Y5Z").slice(0, 6);
  }, [user?.walletAddress]);

  if (!user) return null;

  const copyAddress = () => {
    if (user.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- SOCIAL INPUT LOGIC ---
  const openSocialModal = (platform: 'twitter' | 'telegram') => {
    setActivePlatform(platform);
    setInputHandle(''); 
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // 🔥 ГОЛОВНА ФУНКЦІЯ ЗБЕРЕЖЕННЯ В БАЗУ 🔥
  const handleSaveSocial = async () => {
    if (!activePlatform || !inputHandle) return;
    
    setIsSaving(true);
    setErrorMsg(null);

    // 1. Форматуємо нікнейм (додаємо @)
    const formattedHandle = inputHandle.trim().startsWith('@') 
        ? inputHandle.trim() 
        : `@${inputHandle.trim()}`;

    try {
        // 2. ВІДПРАВЛЯЄМО НА СЕРВЕР (БАЗУ ДАНИХ)
        const response = await fetch(`${API_BASE_URL}/api/bind-social`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress: user.walletAddress,
                platform: activePlatform, // 'twitter' або 'telegram'
                username: formattedHandle
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // 3. ЯКЩО СЕРВЕР ПІДТВЕРДИВ - ОНОВЛЮЄМО ІНТЕРФЕЙС
            const updatedUser = { ...user };
            
            if (activePlatform === 'twitter') {
                updatedUser.twitterHandle = formattedHandle;
                updatedUser.socialsFollowed = { ...user.socialsFollowed, twitter: true };
            } else {
                updatedUser.telegramHandle = formattedHandle;
                updatedUser.socialsFollowed = { ...user.socialsFollowed, telegram: true };
            }

            setUser(updatedUser);
            setIsModalOpen(false); // Закриваємо вікно
        } else {
            setErrorMsg(data.message || "Failed to save to database.");
        }

    } catch (error) {
        console.error("Database Error:", error);
        setErrorMsg("Connection error. Try again.");
    } finally {
        setIsSaving(false);
    }
  };

  const badges = [
    {
      id: 1,
      title: "Early Adopter",
      desc: "Genesis Era",
      icon: <Star className="w-5 h-5" />,
      color: "yellow",
      status: "unlocked", 
      progress: 100
    },
    {
      id: 2,
      title: "Whitelisted",
      desc: "Alpha Access",
      icon: <Scroll className="w-5 h-5" />,
      color: "cyan",
      status: user.hasPaidEarlyAccess ? "unlocked" : "locked",
      progress: user.hasPaidEarlyAccess ? 100 : 0
    },
    {
      id: 3,
      title: "Island Owner",
      desc: "Minted NFT",
      icon: <Gem className="w-5 h-5" />,
      color: "purple",
      status: hasNft ? "unlocked" : "locked",
      progress: hasNft ? 100 : 0
    },
    {
      id: 4,
      title: "Classified",
      desc: "Decrypting...",
      icon: <Lock className="w-5 h-5" />,
      color: "red",
      status: "progress",
      progress: mysteryProgress
    }
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#030305] text-white overflow-hidden pb-32 selection:bg-cyan-500/30 font-sans">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px]" 
        />
        <motion.div 
           animate={{ opacity: [0.1, 0.2, 0.1], scale: [1.1, 1, 1.1] }}
           transition={{ duration: 12, repeat: Infinity }}
           className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[100px]" 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto pt-24 px-4 sm:px-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
        >
          
          {/* ================= LEFT COLUMN (Identity & Socials) ================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. IDENTITY CARD */}
            <div className="relative p-6 sm:p-8 rounded-[2rem] bg-[#0A0A0E]/60 backdrop-blur-xl border border-white/10 overflow-hidden group hover:border-white/20 transition-all">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
                {/* Avatar */}
                <div className="relative shrink-0">
                   <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                   <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center overflow-hidden z-10 shadow-2xl">
                      <UserIcon className="w-12 h-12 text-gray-500" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-scan" />
                   </div>
                   <div className="absolute bottom-1 right-1 px-2.5 py-0.5 bg-[#030305] border border-green-500/30 text-green-400 text-[10px] font-bold uppercase rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)] z-20">
                     Online
                   </div>
                </div>

                {/* User Details */}
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                    {/* UID SECTION */}
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-mono text-cyan-200 uppercase tracking-widest">
                      UID: {uniqueUID}
                    </span>
                    {user.hasPaidEarlyAccess && (
                      <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-md text-[10px] font-mono text-purple-300 uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                        <ShieldCheck className="w-3 h-3" /> Alpha Commander
                      </span>
                    )}
                  </div>
                  
                  <h1 className="text-3xl sm:text-5xl font-cinzel font-black text-white mb-4 drop-shadow-lg truncate">
                    {user.username}
                  </h1>

                  {/* Wallet Action */}
                  <button 
                    onClick={copyAddress}
                    className="relative overflow-hidden inline-flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-xl transition-all w-full sm:w-auto justify-center sm:justify-start group/wallet"
                    title="Click to copy full address"
                  >
                    <Wallet className="w-4 h-4 text-gray-400 group-hover/wallet:text-cyan-400 transition-colors" />
                    <span className="font-mono text-sm text-gray-300 group-hover/wallet:text-white">
                      {user.walletAddress 
                        ? `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}` 
                        : "Connect Wallet"}
                    </span>
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-500 group-hover/wallet:text-white" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. SECURITY NOTICE */}
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-400 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-1">Access Protocol Warning</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                        By linking your Telegram, you are creating a permanent binding. <span className="text-gray-200 font-bold">Your Whitelist & NFT access will be tied strictly to this Telegram handle.</span> Ensure this is your primary account.
                    </p>
                </div>
            </div>

            {/* 3. BADGES */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                 <h3 className="text-lg font-cinzel font-bold text-white flex items-center gap-2">
                   <Medal className="w-5 h-5 text-yellow-500" />
                   Service Medals
                 </h3>
                 <span className="text-xs text-gray-500 font-mono">3/4 UNLOCKED</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge) => (
                  <BadgeCard key={badge.id} data={badge} />
                ))}
              </div>
            </div>

            {/* 4. COMMUNICATION MODULES (BINDING) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <SocialModule 
                  icon={<Twitter className="w-5 h-5" />}
                  title="Neural Uplink"
                  platform="Twitter"
                  isConnected={user.socialsFollowed.twitter}
                  handle={user.twitterHandle}
                  color="blue"
                  onConnect={() => openSocialModal('twitter')}
               />
               <SocialModule 
                  icon={<Send className="w-5 h-5" />}
                  title="Command Channel"
                  platform="Telegram"
                  isConnected={user.socialsFollowed.telegram}
                  handle={user.telegramHandle}
                  color="cyan"
                  onConnect={() => openSocialModal('telegram')}
               />
            </div>
          </div>

          {/* ================= RIGHT COLUMN (Stats) ================= */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* A. BALANCE CARD */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#15151a] to-[#0A0A0E] border border-white/10 relative overflow-hidden group hover:border-yellow-500/30 transition-all shadow-xl">
               <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-colors"></div>
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <Coins className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="px-2 py-1 bg-yellow-500/5 border border-yellow-500/10 rounded text-[10px] text-yellow-300 font-bold uppercase tracking-wider">
                      Pending
                    </div>
                 </div>
                 <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-1">Total Balance</p>
                 <h2 className="text-4xl font-cinzel font-bold text-white mb-2 tracking-wide">
                    {user.points.toLocaleString()} <span className="text-sm text-yellow-500">AETH</span>
                 </h2>
               </div>
            </div>

            {/* B. DAILY STREAK */}
            <div className="p-6 rounded-3xl bg-[#0A0A0E] border border-white/10 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                <div>
                   <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-1">Login Streak</p>
                   <p className="text-2xl font-cinzel font-bold text-white">{userStreak} Days</p>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center">
                   <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse"></div>
                   <Flame className="w-8 h-8 text-orange-500 relative z-10 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                </div>
            </div>

            {/* C. SQUADRON */}
            <div className="p-6 rounded-3xl bg-[#0A0A0E] border border-white/10 group hover:border-cyan-500/30 transition-colors">
               <div className="flex items-center gap-4 mb-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                     <Users className="w-5 h-5" />
                  </div>
                  <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Squadron</p>
               </div>
               <div className="flex items-end gap-2">
                  <span className="text-2xl font-cinzel font-bold text-white">{user.inviteCount}</span>
                  <span className="text-sm text-gray-500 mb-1">recruits</span>
               </div>
            </div>

             {/* D. LEADERBOARD TEASER */}
             <div className="relative p-6 rounded-3xl bg-[#08080a] border border-white/5 overflow-hidden">
               <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                  <Lock className="w-6 h-6 text-gray-500 mb-2" />
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Season 1 Locked</p>
                  <p className="text-[10px] text-gray-500 mt-1">Coming Soon</p>
               </div>
               <div className="opacity-30 blur-sm">
                  <div className="flex items-center justify-between mb-4">
                     <p className="font-cinzel font-bold text-white">Global Ranking</p>
                     <Trophy className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="space-y-3">
                     {[1,2,3].map(i => (
                        <div key={i} className="h-8 bg-white/10 rounded w-full"></div>
                     ))}
                  </div>
               </div>
            </div>

          </div>

        </motion.div>

        {/* --- MODAL FOR SOCIAL INPUT (DB BINDING) --- */}
        <AnimatePresence>
            {isModalOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-md bg-[#0A0A0E] border border-white/10 rounded-3xl p-6 relative shadow-2xl"
                    >
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className={`p-4 rounded-full mb-4 ${activePlatform === 'twitter' ? 'bg-blue-500/10 text-blue-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                {activePlatform === 'twitter' ? <Twitter className="w-8 h-8" /> : <Send className="w-8 h-8" />}
                            </div>
                            <h3 className="text-xl font-cinzel font-bold text-white">Bind {activePlatform === 'twitter' ? 'Twitter' : 'Telegram'}</h3>
                            <p className="text-xs text-gray-400 mt-2">
                                Enter your username to permanently bind it to this Skylands account.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <input 
                                    type="text" 
                                    placeholder="@username"
                                    value={inputHandle}
                                    onChange={(e) => setInputHandle(e.target.value)}
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono text-sm"
                                />
                            </div>
                            
                            {errorMsg && (
                                <p className="text-red-400 text-xs text-center">{errorMsg}</p>
                            )}

                            <button 
                                onClick={handleSaveSocial}
                                disabled={isSaving}
                                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isSaving ? "Binding..." : "Confirm Binding"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const BadgeCard = ({ data }: { data: any }) => {
   const isLocked = data.status === "locked";
   const isProgress = data.status === "progress";
   
   const colors: Record<string, string> = {
      yellow: "text-yellow-400 border-yellow-500/40 bg-yellow-500/5 shadow-[0_0_15px_rgba(250,204,21,0.15)]",
      cyan: "text-cyan-400 border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_15px_rgba(34,211,238,0.15)]",
      purple: "text-purple-400 border-purple-500/40 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
      red: "text-red-400 border-red-500/20 bg-red-500/5", 
   };

   return (
      <div className={`
         relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 h-full
         ${!isLocked && !isProgress ? colors[data.color] : 'border-white/5 bg-[#0e0e12]'}
         ${isLocked ? 'opacity-50 grayscale' : 'opacity-100'}
      `}>
         <div className={`
            w-10 h-10 rounded-full flex items-center justify-center mb-3 border
            ${!isLocked && !isProgress ? 'bg-[#050505] border-white/10' : 'bg-[#050505] border-white/5 text-gray-600'}
         `}>
            {data.icon}
         </div>
         <h4 className={`text-sm font-bold leading-tight mb-1 ${!isLocked ? 'text-white' : 'text-gray-500'}`}>
            {data.title}
         </h4>
         <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">
            {data.desc}
         </p>
         {isProgress && (
            <div className="w-full mt-3">
               <div className="flex justify-between text-[8px] text-red-400 font-mono mb-1">
                  <span>DECRYPTING</span>
                  <span>{data.progress}%</span>
               </div>
               <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                     className="h-full bg-red-500/50 shadow-[0_0_5px_rgba(239,68,68,0.5)]" 
                     style={{ width: `${data.progress}%` }} 
                  />
               </div>
            </div>
         )}
      </div>
   );
};

const SocialModule = ({ icon, title, platform, isConnected, handle, color, onConnect }: any) => {
   return (
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0e0e12] border border-white/5 hover:border-white/10 transition-colors group">
         <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-400 group-hover:scale-105 transition-transform`}>
               {icon}
            </div>
            <div>
               <p className="text-white font-bold text-sm leading-none mb-1">{title}</p>
               <p className={`text-[10px] uppercase font-bold tracking-wider ${isConnected ? 'text-green-500' : 'text-gray-500'}`}>
                  {isConnected ? (handle || 'Bound') : 'Not Bound'}
               </p>
            </div>
         </div>
         
         {!isConnected ? (
            <button 
               onClick={onConnect} 
               className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest transition-all"
            >
               Bind
            </button>
         ) : (
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
               <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
         )}
      </div>
   );
};

export default Profile;