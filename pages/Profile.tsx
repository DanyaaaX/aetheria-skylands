import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User as UserIcon, Wallet, Coins, Users, 
  CheckCircle2, Twitter, Send, Copy, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { User } from '../types';
import { SOCIAL_LINKS } from '../constants';

interface ProfileProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  // Логіка копіювання адреси
  const copyAddress = () => {
    if (user.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statItems = [
    { 
      icon: <Coins className="w-6 h-6 text-yellow-400" />, 
      label: "Aether Balance", 
      value: user.points.toLocaleString(), 
      sub: "PENDING AIRDROP" 
    },
    { 
      icon: <Users className="w-6 h-6 text-cyan-400" />, 
      label: "Squadron", 
      value: user.inviteCount, 
      sub: "ACTIVE RECRUITS" 
    },
    { 
      icon: <ShieldCheck className="w-6 h-6 text-purple-400" />, 
      label: "Clearance", 
      value: user.hasPaidEarlyAccess ? "ALPHA COMMANDER" : "INITIATE", 
      sub: "ACCESS LEVEL" 
    },
  ];

  return (
    <div className="relative min-h-screen w-full text-white overflow-hidden pb-20">
      
      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto pt-10 px-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          
          {/* --- MAIN IDENTITY CARD --- */}
          <div className="relative group rounded-[2.5rem] bg-[#0A0A0E] border border-white/10 overflow-hidden shadow-2xl">
            {/* Header Gradient */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-cyan-900/40 via-purple-900/40 to-indigo-900/40"></div>
            
            <div className="relative px-8 pb-10 pt-16 md:px-12 md:flex md:items-end gap-8">
              
              {/* Avatar Section */}
              <div className="relative shrink-0">
                <div className="w-36 h-36 rounded-3xl bg-[#050505] border-2 border-cyan-500/30 p-1 shadow-[0_0_40px_rgba(6,182,212,0.2)] flex items-center justify-center relative z-10">
                   <div className="w-full h-full rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center overflow-hidden relative">
                      <UserIcon className="w-16 h-16 text-gray-400" />
                      {/* Scanline Effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-scan" />
                   </div>
                </div>
                {/* Online Status */}
                <div className="absolute -bottom-3 -right-3 px-3 py-1 bg-green-500 text-black text-[10px] font-black uppercase rounded-full border-2 border-[#0A0A0E] shadow-lg">
                  Online
                </div>
              </div>

              {/* User Info Section */}
              <div className="mt-6 md:mt-0 flex-grow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h5 className="text-cyan-500 font-mono text-xs tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        Guardian Identity
                    </h5>
                    
                    <div className="flex items-center gap-4">
                       <h1 className="text-4xl md:text-6xl font-cinzel font-black text-white tracking-wide drop-shadow-lg break-all">
                           {user.username}
                       </h1>
                    </div>
                  </div>

                  {/* Wallet Copy Button */}
                  <button 
                    onClick={copyAddress}
                    className="flex items-center gap-2 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-cyan-500/50 px-5 py-3 rounded-full transition-all group/wallet cursor-pointer"
                  >
                    <Wallet className="w-4 h-4 text-gray-500 group-hover/wallet:text-cyan-400 transition-colors" />
                    <span className="font-mono text-xs text-gray-400 group-hover/wallet:text-white transition-colors">
                      {user.walletAddress?.slice(0, 4)}...{user.walletAddress?.slice(-4)}
                    </span>
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-600 group-hover/wallet:text-white" />}
                  </button>
                </div>

                {/* System ID Line (FIXED: removed telegramId, using Wallet Hash instead) */}
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 font-mono">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                    System ID: <span className="text-gray-400">UID-{user.walletAddress ? user.walletAddress.slice(-6).toUpperCase() : "UNKNOWN"}</span>
                </div>
              </div>
            </div>

            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5 border-t border-white/5 bg-black/20">
              {statItems.map((item, i) => (
                <div key={i} className="p-8 flex items-center gap-5 hover:bg-white/[0.02] transition-colors group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-white/10 transition-all shadow-inner">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{item.sub}</p>
                    <p className="text-2xl font-cinzel font-bold text-white group-hover:text-cyan-100 transition-colors">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- SOCIAL SYNC SECTION --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             
             {/* Twitter Card */}
             <div className="p-8 rounded-[2rem] bg-[#0A0A0E] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                   <Twitter className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Twitter className="w-5 h-5" /></div>
                         <h3 className="font-cinzel font-bold text-lg">Neural Uplink (X)</h3>
                      </div>
                      {user.socialsFollowed.twitter ? (
                          <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black uppercase flex items-center gap-2">
                             <CheckCircle2 className="w-3 h-3" /> Synced
                          </div>
                      ) : (
                          <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase">Disconnected</div>
                      )}
                   </div>
                   <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      Sync your profile to unlock the <span className="text-white font-bold">Legendary Mint</span> whitelist and receive atmospheric updates.
                   </p>
                   {!user.socialsFollowed.twitter && (
                      <button onClick={() => window.open(SOCIAL_LINKS.TWITTER, '_blank')} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                         Initialize Sync
                      </button>
                   )}
                </div>
             </div>

             {/* Telegram Card */}
             <div className="p-8 rounded-[2rem] bg-[#0A0A0E] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                   <Send className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400"><Send className="w-5 h-5" /></div>
                         <h3 className="font-cinzel font-bold text-lg">Command Channel</h3>
                      </div>
                      {user.socialsFollowed.telegram ? (
                          <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black uppercase flex items-center gap-2">
                             <CheckCircle2 className="w-3 h-3" /> Linked
                          </div>
                      ) : (
                          <div className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase">Disconnected</div>
                      )}
                   </div>
                   <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      Join the <span className="text-cyan-400 font-bold">Guardian Council</span> group to access real-time yield reports.
                   </p>
                   {!user.socialsFollowed.telegram && (
                      <button onClick={() => window.open(SOCIAL_LINKS.TELEGRAM, '_blank')} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/20">
                         Establish Link
                      </button>
                   )}
                </div>
             </div>
          </div>

           {/* Footer Security */}
           <div className="flex items-center justify-center gap-2 p-6 opacity-40 hover:opacity-100 transition-opacity">
             <AlertCircle className="w-4 h-4 text-gray-500" />
             <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                Identity secured by TON Blockchain • Immutable Record
             </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default Profile;