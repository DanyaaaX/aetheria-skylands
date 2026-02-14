
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { 
  CheckCircle2, 
  Lock, 
  Zap, 
  Coins, 
  User as UserIcon, 
  LogIn, 
  RefreshCcw, 
  AlertTriangle, 
  Loader2, 
  Twitter,
  Send,
  ExternalLink,
  Box 
} from 'lucide-react';
import { User } from '../types';
import ReferralCard from '../components/ReferralCard';
import { ADMIN_WALLET, INVITES_FOR_EA, INVITES_FOR_NFT, SOCIAL_LINKS, API_BASE_URL } from '../constants';

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

  if (!wallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="p-8 bg-cyan-500/5 rounded-full mb-8 border border-cyan-500/10 shadow-2xl">
          <LogIn className="w-16 h-16 text-cyan-400" />
        </motion.div>
        <h2 className="text-4xl font-cinzel font-bold mb-4">Neural Link Required</h2>
        <p className="text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
           The Skylands registry is currently offline for your signature. Connect your TON wallet to authenticate.
        </p>
        <button onClick={() => tonConnectUI.openModal()} className="px-10 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-full transition-all shadow-lg shadow-cyan-500/30 uppercase tracking-[0.2em] text-sm">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-6" />
        <h2 className="text-xl font-cinzel font-bold tracking-widest text-cyan-400 uppercase">Fetching Cloud State...</h2>
      </div>
    );
  }

  const handleSocialVerify = async (platform: 'twitter' | 'telegram') => {
    try {
      setLoading(true);
      window.open(platform === 'twitter' ? SOCIAL_LINKS.TWITTER : SOCIAL_LINKS.TELEGRAM, '_blank');
      
      // Simulate verification delay
      await new Promise(r => setTimeout(r, 2000));
      const res = await fetch(`${API_BASE_URL}/api/auth/update-socials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: user.walletAddress, platform })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (e) {
      setLocalError("Social synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- PAYMENT VERIFICATION LOGIC (POLLING) ---
  const pollPaymentStatus = async () => {
      setIsPolling(true);
      setLocalError(null);
      
      let attempts = 0;
      const maxAttempts = 20; // 20 attempts * 3 seconds = 1 minute wait
      let verified = false;
      while (attempts < maxAttempts && !verified) {
          try {
              // Poll backend to check if payment was received
              const res = await fetch(`${API_BASE_URL}/api/auth/mint`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      walletAddress: user.walletAddress,
                      updateField: 'hasPaidEarlyAccess' // Just checking status
                  }),
              });
              const data = await res.json();

              if (data.success && data.user.hasPaidEarlyAccess) {
                  setUser(data.user);
                  // Update user state
                  verified = true;
                  break; 
              }
          } catch (e) {
              console.warn("Poll attempt failed, retrying...");
          }

          // Wait 3 seconds before next attempt
          if (!verified) await new Promise(r => setTimeout(r, 3000));
          attempts++;
      }

      setIsPolling(false);

      if (!verified) {
          setLocalError("Transaction processing... Click refresh if you paid.");
      }
  };

  // --- PAYMENT HANDLER ---
  const handlePayment = async () => {
    try {
      setLoading(true);
      setLocalError(null);

      // Fixed amount: 0.05 TON
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [{ 
            address: ADMIN_WALLET, 
            amount: "50000000" // 0.05 TON
        }],
      };
      const result = await tonConnectUI.sendTransaction(transaction);
      
      // If user signed transaction, start polling for backend confirmation
      if (result) {
          await pollPaymentStatus();
      }
    } catch (e) {
      console.error(e);
      setLocalError("Payment cancelled or failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- MANUAL CHECK HANDLER ---
  const handleManualCheck = async () => {
      setLoading(true);
      await pollPaymentStatus();
      setLoading(false);
  }

  const inviteProgress = Math.min((user.inviteCount / INVITES_FOR_EA) * 100, 100);
  
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <ReferralCard referralCode={user.referralCode} inviteCount={user.inviteCount} />
          
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Waitlist Progress
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                <span>{user.inviteCount} / {INVITES_FOR_EA} Recruits</span>
                <span>{inviteProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${inviteProgress}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                />
              </div>
              <p className="text-[10px] text-gray-500 uppercase leading-relaxed text-center">
                Invite 5 guardians to unlock Phase 2.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <StageItem 
            title="Stage 1: Registry Entrance"
            desc="Identity successfully bound to the Aetheria neural net."
            isComplete={true}
            status="unlocked"
          />

          <StageItem 
            title="Stage 2: Early Access Pass"
            desc="Unlock official entry (Gas fee only: ~0.05 TON)."
            isComplete={user.hasPaidEarlyAccess}
            status={user.inviteCount >= INVITES_FOR_EA ? "active" : "locked"}
          >
            {user.inviteCount >= INVITES_FOR_EA && !user.hasPaidEarlyAccess && (
              <>
                <div className="flex gap-3 mt-6">
                    {/* PAYMENT BUTTON */}
                    <button 
                        onClick={handlePayment} 
                        disabled={loading || isPolling} 
                        className="flex-grow py-4 bg-cyan-500 text-black font-black rounded-xl uppercase tracking-widest text-xs hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPolling ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Verifying Blockchain...</>
                        ) : loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                        ) : (
                            <>Acquire Access (~0.05 TON)</>
                        )}
                    </button>

                    {/* MANUAL CHECK BUTTON */}
                    <button 
                        onClick={handleManualCheck}
                        disabled={isPolling}
                        className="w-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all text-cyan-400"
                        title="Check Status Again"
                    >
                        <RefreshCcw className={`w-5 h-5 ${isPolling ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {localError && (
                    <motion.p 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-red-400 text-[10px] mt-3 text-center font-bold uppercase tracking-widest bg-red-500/10 py-2 rounded-lg border border-red-500/20"
                    >
                        {localError}
                    </motion.p>
                )}
              </>
            )}
          </StageItem>

          {/* --- STAGE 3: LEGENDARY MINT (ULTIMATE EDITION) --- */}
          <div className={`relative rounded-[2rem] border transition-all overflow-hidden group ${
            user.hasPaidEarlyAccess 
              ? 'bg-[#0b0c15] border-purple-500/30 shadow-[0_0_50px_-15px_rgba(168,85,247,0.2)]' 
              : 'bg-white/5 border-white/5 opacity-60 grayscale'
          }`}>
            
            {/* Фонове світіння */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -z-10 group-hover:bg-purple-600/20 transition-all duration-1000"></div>

            <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
              
              {/* --- ЛІВА ЧАСТИНА: ЛЕВІТУЮЧИЙ КУБ --- */}
              <div className="relative shrink-0">
                {/* Анімація левітації */}
                <motion.div
                  animate={user.hasPaidEarlyAccess ? { y: [-5, 5, -5], rotate: [0, 2, -2, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  {/* Іконка куба або картинка */}
                  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center border backdrop-blur-md transition-all duration-500 ${
                     user.hasMintedNFT 
                       ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.4)]'
                       : (user.socialsFollowed.twitter && user.socialsFollowed.telegram)
                         ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.5)]'
                         : 'bg-white/5 border-white/10 text-gray-600'
                  }`}>
                     {user.hasMintedNFT ? (
                       <CheckCircle2 className="w-10 h-10" />
                     ) : (
                       <Box className="w-10 h-10 stroke-[1.5]" />
                     )}
                  </div>
                </motion.div>
                
                {/* Тінь під кубом */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/50 blur-md rounded-full"></div>
              </div>

              {/* --- ПРАВА ЧАСТИНА: КОНТЕНТ --- */}
              <div className="flex-grow w-full">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-cinzel font-bold tracking-widest text-white uppercase drop-shadow-md">
                    STAGE 3: LEGENDARY MINT
                  </h3>
                  
                  {user.hasPaidEarlyAccess && !user.hasMintedNFT && (
                     <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white animate-pulse">
                       LIVE
                     </span>
                  )}
                </div>
                
                <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-6">
                  Claim your Genesis Artifact.
                  <span className="text-purple-400">Rarity revealed after mint.</span>
                </p>

                {/* Кнопки завдань */}
                <div className={`space-y-4 transition-all ${!user.hasPaidEarlyAccess ? 'blur-[2px] pointer-events-none' : ''}`}>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleSocialVerify('twitter')}
                      className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        user.socialsFollowed.twitter 
                        ? 'bg-green-900/20 border-green-500/50 text-green-400' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      {user.socialsFollowed.twitter ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Twitter className="w-3.5 h-3.5" />}
                      FOLLOW X
                    </button>

                    <button 
                      onClick={() => handleSocialVerify('telegram')}
                      className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        user.socialsFollowed.telegram 
                        ? 'bg-green-900/20 border-green-500/50 text-green-400' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      {user.socialsFollowed.telegram ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                      JOIN TG
                    </button>
                  </div>

                  {/* ГОЛОВНА КНОПКА МІНТУ */}
                  <button
                    disabled={!user.socialsFollowed.twitter || !user.socialsFollowed.telegram || user.hasMintedNFT}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn ${
                      user.hasMintedNFT 
                      ? 'bg-green-600 text-white cursor-default'
                      : (user.socialsFollowed.twitter && user.socialsFollowed.telegram)
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white ring-1 ring-purple-400/50'
                        : 'bg-[#15151a] text-gray-600 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    {/* Ефект блиску на кнопці */}
                    {(user.socialsFollowed.twitter && user.socialsFollowed.telegram && !user.hasMintedNFT) && (
                       <div className="absolute top-0 -left-full w-1/2 h-full bg-white/20 skew-x-[25deg] group-hover/btn:animate-shine" />
                    )}

                    {user.hasMintedNFT ? (
                      <> <CheckCircle2 className="w-5 h-5" /> ARTIFACT SECURED </>
                    ) : (user.socialsFollowed.twitter && user.socialsFollowed.telegram) ? (
                      <> <Zap className="w-5 h-5 fill-current" /> MINT LEGENDARY ARTIFACT </>
                    ) : (
                      <> <Lock className="w-4 h-4" /> COMPLETE TASKS TO UNLOCK </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ШТОРКА БЛОКУВАННЯ (ЯКЩО STAGE 2 НЕ КУПЛЕНО) */}
            {!user.hasPaidEarlyAccess && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#050505]/60 backdrop-blur-[3px]">
                <Lock className="w-8 h-8 text-gray-500 mb-2 opacity-80" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full bg-black/80">
                  Requires Stage 2 Access
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const SocialBtn = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    disabled={active}
    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
    }`}
  >
    {active ? <CheckCircle2 className="w-4 h-4" /> : icon}
    {label}
  </button>
);

const StageItem = ({ title, desc, status, isComplete, children }: any) => (
  <div className={`p-8 rounded-[2.5rem] border backdrop-blur-3xl transition-all relative overflow-hidden ${
    status === 'locked' ? 'opacity-30 grayscale pointer-events-none border-white/5' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
  }`}>
    <div className="flex items-center gap-4 mb-2">
      {isComplete ? <CheckCircle2 className="w-6 h-6 text-green-400" /> : status === 'locked' ? <Lock className="w-6 h-6 text-gray-600" /> : <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />}
      <h3 className="text-xl font-cinzel font-bold tracking-widest text-white uppercase">{title}</h3>
    </div>
    <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">{desc}</p>
    {children}
  </div>
);

export default Dashboard;