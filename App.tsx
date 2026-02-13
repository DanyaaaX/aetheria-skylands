import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { motion, AnimatePresence } from 'framer-motion';

// Core Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingIslands from './components/FloatingIslands';
import ProtectedRoute from './components/ProtectedRoute';

// Registry Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Docs from './pages/Docs';
import FAQ from './pages/FAQ';
import Roadmap from './pages/Roadmap';
import Legal from './pages/Legal';

// Hooks & Logic
import { useTonAuth } from './hooks/useTonAuth';
import { Loader2, UserCheck, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Integrated from Code 2
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI(); 
  const { user, setUser, isLoading, authError, loginOrRegister, syncIdentity } = useTonAuth();
  
  const [showRegModal, setShowRegModal] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState('');

  // --- REFERRAL LOGIC (Integrated from Code 2) ---
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Save friend's code to storage for use during registration
      localStorage.setItem('referralCode', refCode);
      console.log("🔗 Referral detected:", refCode);
    }
  }, [searchParams]);

  // --- TON PROOF CONFIGURATION ---
  useEffect(() => {
      // This setting forces the wallet to generate ton_proof upon connection
      // Critical for backend validation
      tonConnectUI.setConnectRequestParameters({
          state: 'ready',
          value: {
              tonProof: 'AETHERIA_CONNECT_PAYLOAD' // Payload for initialization
          }
      });
  }, [tonConnectUI]);
  // ------------------------------------------------

  // Auto-trigger identity binding if wallet connected but no registry record exists
  useEffect(() => {
    if (!isLoading && wallet && !user) {
      setShowRegModal(true);
    } else {
      setShowRegModal(false);
    }
  }, [isLoading, wallet, user]);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = regUsername.trim().toUpperCase();
    // NUCLEAR ALPHANUMERIC ENFORCEMENT: A-Z, 0-9 only, 3-15 length
    if (!/^[A-Z0-9]{3,15}$/.test(cleanUsername)) {
      setRegError("Handle must be 3-15 characters (A-Z and 0-9 only).");
      return;
    }

    setIsRegistering(true);
    setRegError('');

    try {
      await loginOrRegister(cleanUsername);
      setShowRegModal(false);
      navigate('/dashboard');
    } catch (e: any) {
      setRegError(e.message || "Identity synchronization failed.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white selection:bg-cyan-500/30 text-inter">
      <FloatingIslands />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar user={user} />
        
        {authError && (
          <motion.div 
            initial={{ height: 0 }} animate={{ height: 'auto' }}
            className="bg-red-500/10 border-b border-red-500/20 py-2 px-4 flex items-center justify-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-widest"
          >
            <AlertCircle className="w-3 h-3" /> Grid Warning: {authError}
          </motion.div>
        )}

        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            {/* PUBLIC NAVIGATION MAP */}
            <Route path="/" element={<Landing />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/legal" element={<Legal />} />
            
            {/* PROTECTED SECTORS */}
            <Route path="/dashboard" element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoading}>
                <Dashboard user={user} setUser={setUser} error={authError} retry={syncIdentity} />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoading}>
                <Profile user={user} setUser={setUser} />
              </ProtectedRoute>
            } />

            {/* UNIVERSAL FALLBACK */}
            <Route path="*" element={<Landing />} />
          </Routes>
        </main>
        
        <Footer />
      </div>

      {/* IDENTITY BINDING MODAL */}
      <AnimatePresence>
        {showRegModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-[#0a0a0a] border border-cyan-500/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600" />
              
              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-cyan-500/10 rounded-full mb-4 border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                  <UserCheck className="w-8 h-8 text-cyan-400" />
                </div>
                <h2 className="text-3xl font-cinzel font-bold text-white uppercase tracking-widest text-center">Identity Signature</h2>
                <p className="text-gray-400 text-[10px] mt-2 uppercase tracking-widest font-bold text-center">Bind your unique identifier to the Aetheria Registry.</p>
              </div>

              <form onSubmit={handleRegistration} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Guardian Handle</label>
                  <input 
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    placeholder="ALPHANUMERIC_ONLY"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-cinzel tracking-widest text-center outline-none focus:border-cyan-500 transition-all placeholder:text-gray-800"
                    maxLength={15}
                    required
                  />
                  <p className="text-[8px] text-gray-600 text-center uppercase tracking-widest font-bold">A-Z and 0-9 characters only. 3 characters min.</p>
                </div>
                
                {regError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 text-center font-bold uppercase tracking-widest"
                  >
                    {regError}
                  </motion.p>
                )}

                <button 
                  type="submit"
                  disabled={isRegistering || regUsername.length < 3}
                  className="group w-full py-4 bg-gradient-to-r from-cyan-600 to-indigo-700 hover:brightness-110 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
                >
                  {isRegistering ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>Binding Identity...</span></>
                  ) : (
                    <span>Sign Registry</span>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
