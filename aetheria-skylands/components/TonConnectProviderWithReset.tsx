import React, { useEffect, useState, useCallback } from 'react';
import { TonConnectUIProvider, useTonConnectUI, THEME } from '@tonconnect/ui-react';
import { ShieldAlert, Unplug, WifiOff } from 'lucide-react';
import { MANIFEST_URL } from '../constants';

// CRITICAL: These keys cause the infinite "Wallet info not found" loop if corrupted.
const STORAGE_KEYS_TO_WIPE = [
  'ton-connect-storage_bridge-connection',
  'ton-connect-storage_http-bridge-connection',
  'ton-connect-storage_wallet',
  'ton-connect-ui_preferred-wallet'
];

/**
 * SessionWatchdog Component
 * Monitors the SDK state. If localStorage implies a session but the SDK hangs,
 * it forces a cleanup to prevent the "Spinning Wheel of Death".
 */
const SessionWatchdog: React.FC = () => {
  const [tonConnectUI] = useTonConnectUI();
  const [status, setStatus] = useState<'healthy' | 'stuck' | 'offline'>('healthy');

  const performHardReset = useCallback(() => {
    console.warn('[SessionWatchdog] EXECUTING EMERGENCY RESET...');
    
    // 1. Attempt graceful disconnect
    if (tonConnectUI.connected) {
      tonConnectUI.disconnect().catch(err => console.warn('SDK Disconnect failed (expected):', err));
    }

    // 2. Nuclear Option: Wipe all TON Connect storage
    STORAGE_KEYS_TO_WIPE.forEach(key => localStorage.removeItem(key));

    // 3. Force Browser Reload
    window.location.reload();
  }, [tonConnectUI]);

  useEffect(() => {
    const handleOnline = () => setStatus('healthy');
    const handleOffline = () => setStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Watchdog Logic
    const checkSessionIntegrity = () => {
      if (!navigator.onLine) {
        setStatus('offline');
        return;
      }

      const hasSessionKeys = STORAGE_KEYS_TO_WIPE.some(key => localStorage.getItem(key));
      
      // If keys exist but SDK is not connected after 4 seconds, we are likely stuck.
      if (hasSessionKeys && !tonConnectUI.connected) {
        const timer = setTimeout(() => {
          const stillHasKeys = STORAGE_KEYS_TO_WIPE.some(key => localStorage.getItem(key));
          if (!tonConnectUI.connected && stillHasKeys && navigator.onLine) {
            console.error('[SessionWatchdog] ZOMBIE SESSION DETECTED. User intervention required.');
            setStatus('stuck');
          }
        }, 4000); 
        return () => clearTimeout(timer);
      }
    };

    checkSessionIntegrity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tonConnectUI]);

  if (status === 'offline') {
    return (
      <div className="fixed top-0 left-0 w-full z-[9999] bg-gray-900/95 backdrop-blur-md text-gray-400 px-4 py-2 flex items-center justify-center gap-2 border-b border-white/10 text-xs font-bold uppercase tracking-widest">
        <WifiOff className="w-4 h-4" />
        <span>Network Offline</span>
      </div>
    );
  }

  if (status === 'stuck') {
    return (
      <div className="fixed top-0 left-0 w-full z-[9999] bg-red-600/95 backdrop-blur-md shadow-2xl border-b border-red-400/30 text-white px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-full animate-pulse">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-widest">Connection Sync Error</span>
            <span className="text-[10px] opacity-80 font-mono">Local storage desynchronized from Registry.</span>
          </div>
        </div>
        
        <button 
          onClick={performHardReset}
          className="group flex items-center gap-2 bg-white text-red-600 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all shadow-lg active:scale-95"
        >
          <Unplug className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Reset Connection
        </button>
      </div>
    );
  }

  return null;
};

export const TonConnectProviderWithReset: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manifestUrl, setManifestUrl] = useState('');

  useEffect(() => {
    // Set manifest URL only on client-side to ensure access to window object
    setManifestUrl(MANIFEST_URL);
  }, []);

  if (!manifestUrl) return null;

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      uiPreferences={{ theme: THEME.DARK }}
      actionsConfiguration={{
          twaReturnUrl: 'https://t.me/AetheriaBot/game' 
      }}
    >
      <SessionWatchdog />
      {children}
    </TonConnectUIProvider>
  );
};
