import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { 
  CheckCircle2, Lock, Zap, Coins, User as UserIcon, LogIn, 
  RefreshCcw, AlertTriangle, Loader2, Twitter, Send, 
  Box, Activity, Signal, Cpu, Globe, ShieldAlert 
} from 'lucide-react';
import { User } from '../types';
import ReferralCard from '../components/ReferralCard'; // Переконайся, що цей компонент теж стилізований, або загорни його в мої контейнери
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

  // --- LOGIC: SOCIAL VERIFY ---
  const handleSocialVerify = async (platform: 'twitter' | 'telegram') => {
    try {
      setLoading(true);
      window.open(platform === 'twitter' ? SOCIAL_LINKS.TWITTER : SOCIAL_LINKS.TELEGRAM, '_blank');
      await new Promise(r => setTimeout(r, 2000)); // Sim delay
      
      const res = await fetch(`${API_BASE_URL}/api/auth/update-socials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: user?.walletAddress, platform })
      });
      const data = await res.json();
      if (data.success) setUser(data.user);
    } catch (e) {
      setLocalError("Social synchronization failed. Uplink error.");
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
      if (!verified) setLocalError("Signal lost. Click refresh if transaction confirmed.");
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
      setLocalError("Transaction aborted by user.");
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
      <div className="relative min-h-screen w-full bg-[#030305] text-white overflow-hidden flex flex-col items-center justify-center">
         {/* Background DNA */}
         <div className="fixed inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
         </div>

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 p-10 bg-[#0A0A0E]/80 backdrop-blur-xl border border-cyan-500/20 rounded-[3rem] text-center shadow-[0_0_50px_rgba(6,182,212,0.15)] max-w-lg mx-4">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <LogIn className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-cinzel font-bold mb-4 text-white">ACCESS RESTRICTED</h2>
          <p className="text-gray-400 mb-8 font-light leading-relaxed">
             Secure channel required. Connect your neural interface (Wallet) to access the Skylands Registry.
          </p>
          <button onClick={() => tonConnectUI.openModal()} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 uppercase tracking-widest text-sm flex items-center justify-center gap-2">
             <Zap className="w-4 h-4 fill-white" /> Initialize Connection
          </button>
        </motion.div>
      </div>
    );
  }

  // --- RENDER: LOADING STATE ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center text-cyan-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Establishing Uplink...</p>
      </div>
    );
  }

  const inviteProgress = Math.min((user.inviteCount / INVITES_FOR_EA) * 100, 100);

  return (
    <div className="relative w-full min-h-screen bg-[#030305] text-white overflow-hidden pb-20 selection:bg-cyan-500/30">
      
      {/* --- BACKGROUND DNA (Same as Profile) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f1016] via-[#050505] to-[#000000]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-0 left-0 w-full h-1 bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto pt-10 px-4 sm:px-6">

        {/* --- [NEW] SYSTEM HUD HEADER --- */}
        <div className="mb-10 p-4 border-y border-white/5 bg-[#0A0A0E]/50 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest">System Optimal</span>
           </div>
           <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-2 text-gray-500">
                 <Signal className="w-3 h-3" />
                 <span className="text-[10px] font-mono uppercase">Ping: 12ms</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                 <Globe className="w-3 h-3" />
                 <span className="text-[10px] font-mono uppercase">Region: EU-West</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                 <Cpu className="w-3 h-3" />
                 <span className="text-[10px] font-mono uppercase">Load: 4%</span>
              </div>
           </div>
           <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest animate-pulse">
              Aether Stream: Connected
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN: COMMAND CENTER (Referrals) --- */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xl font-cinzel font-bold text-white flex items-center gap-2">
               <UserIcon className="w-5 h-5 text-cyan-400" /> Command Center
            </h2>
            
            {/* Referral Module Wrap */}
            <div className="relative group">
               <div className="absolute -inset-0.5 bg-gradient-to-b from-cyan-500/20 to-purple-600/20 rounded-[2.1rem] blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
               <div className="relative bg-[#0A0A0E] rounded-[2rem] border border-white/10 p-1">
                  <ReferralCard referralCode={user.referralCode} inviteCount={user.inviteCount} />
               </div>
            </div>
            
            {/* Progress Module */}
            <div className="bg-[#0e0e12] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl"></div>
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-6 flex items-center gap-2 relative z-10">
                  <Zap className="w-4 h-4" /> Squadron Mobilization
               </h4>
               
               <div className="space-y-4 relative z-10">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                     <span>Recruits Assembled</span>
                     <span className="text-white">{inviteProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${inviteProgress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                     />
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase leading-relaxed text-center font-mono">
                     Target: {INVITES_FOR_EA} recruits for Phase 2 clearance.
                  </p>
               </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: MISSION STAGES --- */}
          <div className="lg:col-span-8 space-y-8 relative">
             {/* [NEW] Connecting Timeline Line */}
             <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-white/5 hidden md:block"></div>
             
             {/* STAGE 1 */}
             <div className="relative pl-0 md:pl-20">
                <StageMarker number="01" active={true} complete={true} />
                <StageCard 
                   title="Registry Entrance"
                   desc="Identity successfully bound to the neural net."
                   icon={<Globe className="w-6 h-6 text-green-400" />}
                   isComplete={true}
                   status="unlocked"
                   glow="green"
                />
             </div>

             {/* STAGE 2 */}
             <div className="relative pl-0 md:pl-20">
                <StageMarker number="02" active={user.inviteCount >= INVITES_FOR_EA} complete={user.hasPaidEarlyAccess} />
                <StageCard 
                   title="Early Access Pass"
                   desc="Secure your position in the Skylands. (Gas: ~0.05 TON)"
                   icon={<Coins className="w-6 h-6 text-yellow-400" />}
                   isComplete={user.hasPaidEarlyAccess}
                   status={user.inviteCount >= INVITES_FOR_EA ? "active" : "locked"}
                   glow="yellow"
                >
                   {user.inviteCount >= INVITES_FOR_EA && !user.hasPaidEarlyAccess && (
                      <div className="mt-6 space-y-4">
                         <div className="flex gap-3">
                            <button 
                               onClick={handlePayment} 
                               disabled={loading || isPolling} 
                               className="flex-grow py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                               {isPolling ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                               ) : loading ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                               ) : (
                                  <>
                                    <Zap className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" /> 
                                    Acquire Access (~0.05 TON)
                                  </>
                               )}
                            </button>
                            <button 
                               onClick={handleManualCheck}
                               disabled={isPolling}
                               className="w-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all text-cyan-400"
                               title="Force Re-check"
                            >
                               <RefreshCcw className={`w-5 h-5 ${isPolling ? 'animate-spin' : ''}`} />
                            </button>
                         </div>
                         <AnimatePresence>
                            {localError && (
                               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                  <p className="text-red-400 text-[10px] text-center font-bold uppercase tracking-widest bg-red-500/10 py-2 rounded-lg border border-red-500/20 flex items-center justify-center gap-2">
                                     <ShieldAlert className="w-3 h-3" /> {localError}
                                  </p>
                               </motion.div>
                            )}
                         </AnimatePresence>
                      </div>
                   )}
                </StageCard>
             </div>

             {/* STAGE 3 (LEGENDARY MINT) */}
             <div className="relative pl-0 md:pl-20">
                <StageMarker number="03" active={user.hasPaidEarlyAccess} complete={user.hasMintedNFT} />
                
                <div className={`relative rounded-[2.5rem] border transition-all overflow-hidden group ${
                   user.hasPaidEarlyAccess 
                   ? 'bg-[#0b0c15] border-purple-500/40 shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]' 
                   : 'bg-[#0A0A0E] border-white/5 opacity-50 grayscale'
                }`}>
                   {/* Background Glow */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -z-10 group-hover:bg-purple-600/20 transition-all duration-1000"></div>

                   <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
                      
                      {/* --- ARTIFACT HOLOGRAM PREVIEW --- */}
                      <div className="relative shrink-0">
                         <motion.div
                            animate={user.hasPaidEarlyAccess ? { y: [-5, 5, -5] } : {}}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="relative z-10"
                         >
                            <div className={`w-28 h-28 rounded-2xl flex items-center justify-center border backdrop-blur-md transition-all duration-500 relative overflow-hidden ${
                               user.hasMintedNFT 
                                 ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.4)]'
                                 : (user.socialsFollowed.twitter && user.socialsFollowed.telegram)
                                    ? 'bg-purple-600/10 border-purple-500 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.4)]'
                                    : 'bg-white/5 border-white/10 text-gray-600'
                            }`}>
                               {/* Scanning Line Effect */}
                               {!user.hasMintedNFT && user.hasPaidEarlyAccess && (
                                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/20 to-transparent animate-scan z-0"></div>
                               )}
                               
                               <div className="relative z-10">
                                 {user.hasMintedNFT ? (
                                    <CheckCircle2 className="w-10 h-10" />
                                 ) : (
                                    <Box className="w-10 h-10 stroke-[1.5]" />
                                 )}
                               </div>
                            </div>
                         </motion.div>
                         <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-20 h-2 bg-black/60 blur-md rounded-full"></div>
                      </div>

                      {/* --- CONTENT --- */}
                      <div className="flex-grow w-full">
                         <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-cinzel font-bold tracking-widest text-white uppercase drop-shadow-md">
                               Legendary Mint
                            </h3>
                            {user.hasPaidEarlyAccess && !user.hasMintedNFT && (
                               <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white animate-pulse">LIVE</span>
                            )}
                         </div>
                         
                         <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-6 leading-relaxed">
                            Initialize Genesis Artifact materialization. <br/>
                            <span className="text-purple-400">Rarity determined by block hash.</span>
                         </p>

                         <div className={`space-y-4 transition-all ${!user.hasPaidEarlyAccess ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                            {/* Social Tasks */}
                            <div className="flex gap-3">
                               <SocialButton 
                                  icon={<Twitter className="w-3.5 h-3.5" />} 
                                  label="Follow X" 
                                  active={user.socialsFollowed.twitter} 
                                  onClick={() => handleSocialVerify('twitter')} 
                               />
                               <SocialButton 
                                  icon={<Send className="w-3.5 h-3.5" />} 
                                  label="Join TG" 
                                  active={user.socialsFollowed.telegram} 
                                  onClick={() => handleSocialVerify('telegram')} 
                               />
                            </div>

                            {/* MINT BUTTON */}
                            <button
                               disabled={!user.socialsFollowed.twitter || !user.socialsFollowed.telegram || user.hasMintedNFT}
                               className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn ${
                                  user.hasMintedNFT 
                                  ? 'bg-green-600 text-white cursor-default border border-green-400'
                                  : (user.socialsFollowed.twitter && user.socialsFollowed.telegram)
                                     ? 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white ring-1 ring-purple-400/50'
                                     : 'bg-[#15151a] text-gray-600 border border-white/5 cursor-not-allowed'
                               }`}
                            >
                               {(user.socialsFollowed.twitter && user.socialsFollowed.telegram && !user.hasMintedNFT) && (
                                  <div className="absolute top-0 -left-full w-1/2 h-full bg-white/20 skew-x-[25deg] group-hover/btn:animate-shine" />
                               )}
                               {user.hasMintedNFT ? (
                                  <> <CheckCircle2 className="w-5 h-5" /> Artifact Secured </>
                               ) : (user.socialsFollowed.twitter && user.socialsFollowed.telegram) ? (
                                  <> <Box className="w-5 h-5" /> Materialize Artifact </>
                               ) : (
                                  <> <Lock className="w-4 h-4" /> Awaiting Social Sync </>
                               )}
                            </button>
                         </div>
                      </div>
                   </div>

                   {/* Locked Overlay */}
                   {!user.hasPaidEarlyAccess && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#050505]/70 backdrop-blur-[2px]">
                         <div className="bg-[#0A0A0E] border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
                            <Lock className="w-4 h-4 text-gray-500" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                               Locked: Complete Stage 2
                            </span>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS (Clean & Styled) ---

const StageMarker = ({ number, active, complete }: { number: string, active: boolean, complete: boolean }) => (
   <div className={`absolute left-0 top-8 hidden md:flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 transition-colors duration-500 bg-[#030305] ${
      complete 
      ? 'border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
      : active 
         ? 'border-cyan-500 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
         : 'border-white/10 text-gray-600'
   }`}>
      <span className="text-[10px] font-bold">{complete ? <CheckCircle2 className="w-5 h-5" /> : number}</span>
   </div>
);

const StageCard = ({ title, desc, icon, isComplete, status, glow, children }: any) => {
   const glowColors: Record<string, string> = {
      green: "group-hover:border-green-500/30 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]",
      yellow: "group-hover:border-yellow-500/30 group-hover:shadow-[0_0_30px_rgba(250,204,21,0.15)]",
   };

   return (
      <div className={`p-8 rounded-[2.5rem] border backdrop-blur-xl transition-all duration-300 relative overflow-hidden group ${
         status === 'locked' 
         ? 'bg-[#0A0A0E] border-white/5 opacity-40 grayscale pointer-events-none' 
         : `bg-[#0e0e12] border-white/10 ${glowColors[glow] || ''}`
      }`}>
         <div className="flex items-center gap-4 mb-3">
            <div className={`p-3 rounded-xl border ${isComplete ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
               {icon}
            </div>
            <div>
               <h3 className="text-xl font-cinzel font-bold tracking-widest text-white uppercase">{title}</h3>
               <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-1">{desc}</p>
            </div>
         </div>
         {children}
      </div>
   );
}

const SocialButton = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    disabled={active}
    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all group ${
      active 
      ? 'bg-green-900/10 border-green-500/30 text-green-400 cursor-default' 
      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30'
    }`}
  >
    {active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="group-hover:scale-110 transition-transform">{icon}</span>}
    {label}
  </button>
);

export default Dashboard;