import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Medal, User as UserIcon, Loader2, Sparkles, 
  AlertTriangle, RefreshCw, Crown, Globe, Users, Target, Shield 
} from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface LeaderboardEntry {
  username: string;
  points: number;
  inviteCount: number;
  rank: number;
}

const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'squad'>('global');

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = `${API_BASE_URL}/api/leaderboard`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error(`Registry status error: ${response.status}`);

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setPlayers(data.map((p: any, idx: number) => ({
          rank: idx + 1,
          username: p.username || "UNKNOWN_GUARDIAN",
          points: p.points || 0,
          inviteCount: p.inviteCount || 0
        })));
      } else {
        throw new Error("Registry returned invalid packet structure.");
      }
    } catch (e: any) {
      setError(e.message || "Failed to reach the Registry Cloud.");
      setPlayers([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Separate Top 3 from the rest
  const topThree = players.slice(0, 3);
  const restOfList = players.slice(3);

  return (
    <div className="relative w-full min-h-screen bg-[#030305] text-white overflow-hidden pb-20 selection:bg-cyan-500/30">
      
      {/* --- BACKGROUND DNA --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-[#000000]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 100, repeat: Infinity, ease: "linear" }} className="absolute -top-[50%] -right-[50%] w-[100%] h-[100%] border-[1px] border-white/5 rounded-full border-dashed opacity-20" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto pt-10 px-4 sm:px-6">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-12">
           <motion.div 
             initial={{ opacity: 0, y: -20 }} 
             animate={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/5 border border-yellow-500/10 mb-6 backdrop-blur-md"
           >
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-[10px] font-mono text-yellow-200 uppercase tracking-[0.2em] font-bold">Season 1: Genesis</span>
           </motion.div>

           <h1 className="text-5xl md:text-7xl font-cinzel font-black mb-4 tracking-tighter text-white uppercase drop-shadow-2xl">
              Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-600">Legends</span>
           </h1>
           <p className="text-gray-400 max-w-lg mx-auto leading-relaxed font-light text-sm">
              The elite pioneers of the Skylands. Rankings are synthesized from Aether production and tactical expansion.
           </p>
        </div>

        {/* --- TABS / CONTROLS --- */}
        <div className="flex justify-center mb-12">
            <div className="p-1 bg-[#0A0A0E] border border-white/10 rounded-xl flex gap-1 shadow-2xl">
                <button 
                  onClick={() => setActiveTab('global')}
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'global' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:text-white'}`}
                >
                    <Globe className="w-3 h-3" /> Global Sector
                </button>
                <button 
                  onClick={() => setActiveTab('squad')}
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'squad' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:text-white'}`}
                >
                    <Users className="w-3 h-3" /> My Squad
                </button>
            </div>
        </div>

        {loading ? (
           <div className="min-h-[400px] flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-6" />
              <p className="font-mono text-xs uppercase tracking-[0.3em] animate-pulse text-cyan-400">Syncing Registry Data...</p>
           </div>
        ) : error ? (
           <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-[#0A0A0E] border border-red-500/20 rounded-[2rem]">
              <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-xl font-cinzel font-bold text-white mb-2">Connection Severed</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">{error}</p>
              <button onClick={fetchLeaderboard} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs uppercase font-bold flex items-center gap-2 transition-all">
                 <RefreshCw className="w-4 h-4" /> Retry Uplink
              </button>
           </div>
        ) : (
           <>
              {/* --- THE PODIUM (TOP 3) --- */}
              {players.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-16 px-4">
                    {/* Rank 2 */}
                    <div className="order-2 md:order-1">
                       {topThree[1] && <PodiumCard player={topThree[1]} rank={2} />}
                    </div>
                    {/* Rank 1 (Center) */}
                    <div className="order-1 md:order-2 -translate-y-6 md:-translate-y-12 z-20">
                       {topThree[0] && <PodiumCard player={topThree[0]} rank={1} />}
                    </div>
                    {/* Rank 3 */}
                    <div className="order-3 md:order-3">
                       {topThree[2] && <PodiumCard player={topThree[2]} rank={3} />}
                    </div>
                </div>
              )}

              {/* --- THE LIST (RANK 4+) --- */}
              <div className="bg-[#0A0A0E]/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                  {/* Decorative Header */}
                  <div className="grid grid-cols-12 gap-4 px-8 py-5 bg-white/5 border-b border-white/5 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                     <div className="col-span-2 md:col-span-1">Rank</div>
                     <div className="col-span-6 md:col-span-6">Guardian Identity</div>
                     <div className="col-span-2 md:col-span-2 text-center hidden md:block">Invites</div>
                     <div className="col-span-4 md:col-span-3 text-right">Aether Yield</div>
                  </div>

                  <div className="divide-y divide-white/5">
                      {restOfList.length > 0 ? (
                         restOfList.map((player) => (
                            <ListRow key={player.rank} player={player} />
                         ))
                      ) : (
                         <div className="p-10 text-center text-gray-500 text-xs font-mono uppercase">
                            No additional records found in this sector.
                         </div>
                      )}
                  </div>
              </div>
           </>
        )}

      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const PodiumCard = ({ player, rank }: { player: LeaderboardEntry, rank: number }) => {
   const styles = {
      1: { color: "text-yellow-400", border: "border-yellow-500/50", bg: "bg-yellow-500/10", shadow: "shadow-[0_0_50px_-10px_rgba(234,179,8,0.3)]", icon: <Crown className="w-6 h-6 fill-yellow-400 text-yellow-600" /> },
      2: { color: "text-gray-300", border: "border-gray-400/50", bg: "bg-gray-400/10", shadow: "shadow-[0_0_30px_-10px_rgba(156,163,175,0.2)]", icon: <Medal className="w-6 h-6 text-gray-400" /> },
      3: { color: "text-amber-600", border: "border-amber-600/50", bg: "bg-amber-600/10", shadow: "shadow-[0_0_30px_-10px_rgba(217,119,6,0.2)]", icon: <Shield className="w-6 h-6 text-amber-700" /> },
   };
   
   // Fallback for types not strictly 1,2,3 (though logic prevents this)
   const style = styles[rank as 1|2|3] || styles[2];

   return (
      <motion.div 
         initial={{ opacity: 0, y: 50 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: rank * 0.2 }}
         className={`relative p-6 rounded-[2rem] border ${style.border} ${style.bg} ${style.shadow} flex flex-col items-center text-center backdrop-blur-md`}
      >
         {/* Rank Badge */}
         <div className={`absolute -top-5 w-12 h-12 rounded-xl bg-[#0A0A0E] border border-white/10 flex items-center justify-center ${style.color} shadow-lg z-20`}>
             <span className="font-black font-cinzel text-xl">{rank}</span>
         </div>

         {/* Avatar */}
         <div className="relative mt-4 mb-4">
             <div className="w-20 h-20 rounded-full bg-[#050505] border-2 border-white/5 flex items-center justify-center overflow-hidden relative z-10">
                 <UserIcon className="w-8 h-8 text-gray-500" />
                 <div className={`absolute inset-0 bg-gradient-to-t from-${rank === 1 ? 'yellow' : rank === 2 ? 'gray' : 'amber'}-500/20 to-transparent opacity-50`}></div>
             </div>
             {/* Glow behind avatar */}
             <div className={`absolute inset-0 blur-2xl opacity-40 ${style.bg} rounded-full`}></div>
             {rank === 1 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">{style.icon}</div>}
         </div>

         <h3 className="text-white font-bold font-cinzel text-lg truncate w-full mb-1">{player.username}</h3>
         <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-4">
            {player.inviteCount} Recruits
         </p>
         
         <div className={`px-4 py-1.5 rounded-lg bg-[#0A0A0E]/50 border border-white/5 text-sm font-bold font-mono ${style.color}`}>
            {player.points.toLocaleString()} PTS
         </div>
      </motion.div>
   )
}

const ListRow = ({ player }: { player: LeaderboardEntry }) => {
   return (
      <motion.div 
         initial={{ opacity: 0 }}
         whileInView={{ opacity: 1 }}
         viewport={{ once: true }}
         className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-white/[0.03] transition-colors group"
      >
          {/* Rank */}
          <div className="col-span-2 md:col-span-1">
             <span className="font-cinzel font-bold text-gray-500 group-hover:text-white transition-colors">#{player.rank}</span>
          </div>

          {/* User */}
          <div className="col-span-6 md:col-span-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 border border-white/5">
                 <UserIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-gray-300 group-hover:text-white truncate transition-colors">
                 {player.username}
              </span>
          </div>

          {/* Invites */}
          <div className="col-span-2 md:col-span-2 text-center hidden md:block">
             <span className="text-xs font-mono text-gray-500">{player.inviteCount}</span>
          </div>

          {/* Points */}
          <div className="col-span-4 md:col-span-3 text-right">
             <span className="text-sm font-mono font-bold text-cyan-500 group-hover:text-cyan-400 transition-colors drop-shadow-sm">
                {player.points.toLocaleString()}
             </span>
          </div>
      </motion.div>
   )
}

export default Leaderboard;