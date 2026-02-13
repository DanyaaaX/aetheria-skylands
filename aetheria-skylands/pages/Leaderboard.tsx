
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, User as UserIcon, Loader2, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
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

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Absolute path ensures reliability in proxy environments
      const apiUrl = `${API_BASE_URL}/api/leaderboard`;
      console.log("[Aetheria Hall] Handshaking with Master Registry:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error(`[Aetheria Hall] Sync Break: ${response.status}`);
        throw new Error(`Registry status error: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setPlayers(data.map((p: any, idx: number) => ({
          rank: idx + 1,
          username: p.username || "UNKNOWN_GUARDIAN",
          points: p.points || 0,
          inviteCount: p.inviteCount || 0
        })));
        console.log(`[Aetheria Hall] Synced ${data.length} elite records.`);
      } else {
        throw new Error("Registry returned invalid packet structure.");
      }
    } catch (e: any) {
      console.error("[Aetheria Hall] Registry Sync Failure:", e);
      setError(e.message || "Failed to reach the Registry Cloud.");
      setPlayers([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-16">
        <motion.div
           initial={{ scale: 0, rotate: -45 }}
           animate={{ scale: 1, rotate: 0 }}
           className="inline-block p-6 bg-yellow-500/10 rounded-[2.5rem] mb-8 border border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.2)]"
        >
           <Trophy className="w-16 h-16 text-yellow-500" />
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-cinzel font-bold mb-6 tracking-tighter text-white uppercase text-center">Hall of Records</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed font-light text-center">
          The elite pioneers of the Skylands. Rank is synthesized from Aether synthesis and successfully verified expansions.
        </p>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl relative min-h-[500px]">
        {/* Atmosphere Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="grid grid-cols-12 gap-4 px-10 py-6 bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] border-b border-white/5 relative z-10">
          <div className="col-span-1">Rank</div>
          <div className="col-span-7">Guardian Handle</div>
          <div className="col-span-1 text-center">Inv</div>
          <div className="col-span-3 text-right">Synthesis</div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 relative z-10">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-6" />
            <p className="text-gray-600 font-cinzel tracking-[0.3em] text-[10px] uppercase font-bold animate-pulse text-center">Establishing Registry Link...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-40 relative z-10 text-center px-6">
            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 mb-6">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-red-400 font-cinzel font-bold text-lg uppercase tracking-widest mb-2">Registry Re-synchronizing</h3>
            <p className="text-gray-600 text-[9px] max-w-xs mx-auto mb-8 leading-relaxed uppercase tracking-[0.2em] font-bold">
              The Hall of Records is currently offline for maintenance or inaccessible. Error coordinate: {error}
            </p>
            <button 
              onClick={fetchLeaderboard}
              className="group flex items-center gap-3 px-10 py-4 bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 text-white rounded-full transition-all uppercase tracking-[0.3em] text-[10px] font-black"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
              Reconnect to Grid
            </button>
          </div>
        ) : (
          <div className="relative z-10">
            {players.length === 0 ? (
              <div className="py-40 text-center">
                <p className="text-gray-600 uppercase tracking-[0.4em] text-[10px] font-bold">The Registry is void.</p>
                <p className="text-gray-700 text-[8px] mt-2 uppercase tracking-widest font-black">Scanning for initial arrivals...</p>
              </div>
            ) : (
              players.map((player) => (
                <motion.div 
                  key={player.rank}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: player.rank * 0.02 }}
                  className="grid grid-cols-12 gap-4 px-10 py-6 border-b border-white/5 hover:bg-white/[0.04] transition-colors items-center group"
                >
                  <div className="col-span-1">
                    {player.rank <= 3 ? (
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-lg 
                        ${player.rank === 1 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 
                          player.rank === 2 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30' : 
                          'bg-amber-600/20 text-amber-600 border border-amber-600/30'}
                      `}>
                        <Medal className="w-4 h-4" />
                      </div>
                    ) : (
                      <span className="text-xs font-bold font-cinzel text-gray-600 ml-2 text-center block">
                        #{player.rank}
                      </span>
                    )}
                  </div>
                  <div className="col-span-7 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-cyan-500/30 transition-all shrink-0">
                      <UserIcon className="w-5 h-5 text-gray-500" />
                    </div>
                    <span className="text-sm font-bold text-white uppercase tracking-widest truncate flex items-center gap-2">
                      {player.username}
                      {player.rank === 1 && <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />}
                    </span>
                  </div>
                  <div className="col-span-1 text-center text-[10px] text-gray-500 font-mono font-bold">
                    {player.inviteCount}
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-sm font-cinzel font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                      {player.points.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
      
      <div className="mt-8 flex items-center justify-center gap-2 text-gray-600 text-[9px] font-black uppercase tracking-[0.4em]">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 animate-pulse" />
        Records are synced in real-time with the Aetheria Registry
      </div>
    </div>
  );
};

export default Leaderboard;
