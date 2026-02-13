
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { RefreshCw, Power } from 'lucide-react';

interface NavbarProps {
  user: User | null;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const location = useLocation();
  const [tonConnectUI] = useTonConnectUI();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Profile', path: '/profile', private: true },
  ];

  // Manual Connection Guard
  const handleManualReset = async () => {
    try {
      if (tonConnectUI.connected) {
        await tonConnectUI.disconnect();
      }
    } catch (e) {
      console.warn('Manual disconnect warning:', e);
    }
    
    // NUCLEAR CLEAR: Wipe all potential corrupted keys
    const keysToWipe = [
      'ton-connect-storage_bridge-connection',
      'ton-connect-storage_http-bridge-connection',
      'ton-connect-storage_wallet',
      'ton-connect-ui_preferred-wallet'
    ];
    
    keysToWipe.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 px-6 py-4 backdrop-blur-lg border-b border-white/10 bg-black/40">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
            <span className="font-cinzel font-bold text-xl text-white">A</span>
          </div>
          <span className="font-cinzel font-bold text-xl hidden sm:block tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            AETHERIA
          </span>
        </Link>

        <div className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => {
            if (item.private && !user) return null;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${
                  location.pathname === item.path ? 'text-cyan-400' : 'text-gray-500 hover:text-white'
                }`}
              >
                {item.name}
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-400"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Guard Button */}
          <button 
            onClick={handleManualReset}
            className="p-2 bg-red-500/5 hover:bg-red-500/20 hover:text-red-400 text-gray-500 rounded-full transition-all border border-transparent hover:border-red-500/30"
            title="Emergency Disconnect & Cache Clear"
          >
            <Power className="w-4 h-4" />
          </button>
          
          <TonConnectButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
