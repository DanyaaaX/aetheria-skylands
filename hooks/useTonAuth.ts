import { useState, useEffect, useCallback } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { User } from '../types';
import { API_BASE_URL } from '../constants';

export const useTonAuth = () => {
  // --- STATE MANAGEMENT (Merged CODE 1 & CODE 2) ---
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // From CODE 2
  const [authError, setAuthError] = useState<string | null>(null); // From CODE 1

  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  // --- CORE LOGIC (Injected CODE 2 Logic) ---
  const checkAuth = useCallback(async () => {
    // 1. If wallet is not connected
    if (!wallet) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
      return;
    }

    // 2. Optimization: If user is already loaded and address matches (From CODE 2)
    if (user && user.walletAddress === wallet.account.address) {
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      // 3. Auth Request (Updated to CODE 2's simplified flow + CODE 1's referral logic)
      const referralCode = localStorage.getItem('referralCode');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet.account.address,
          referredBy: referralCode || undefined // Integrated from CODE 1/CODE 2 suggestion
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Validation Logic from CODE 2
      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        console.log("✅ Authenticated as:", data.user.username);
      } else if (data.user) {
        // Fallback for CODE 1 backend structure compatibility
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
         // Handle case where response is ok but no user returned
         setUser(null);
         setIsAuthenticated(false);
      }

    } catch (error: any) {
      console.error("❌ Authentication error:", error);
      setAuthError(error.message || "Authentication failed.");
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [wallet, user]);

  // --- EFFECTS ---
  // Auto-sync effect from CODE 2
  useEffect(() => {
    checkAuth();
  }, [wallet]); // Only re-run when wallet changes (CODE 2 Logic)

  // --- COMPATIBILITY LAYER (Preserving CODE 1 API) ---
  
  // Adapter for manual login trigger (if needed by UI components)
  const loginOrRegister = async (username?: string) => {
    // Note: CODE 2 logic implies auto-creation/login via address. 
    // Username param is kept for signature compatibility but logic relies on checkAuth.
    await checkAuth();
    return user;
  };

  return {
    user,
    setUser,
    isAuthenticated, // Added from CODE 2
    isLoading,
    authError,       // Kept from CODE 1
    loginOrRegister, // Kept for backward compatibility
    syncIdentity: checkAuth, // Alias to checkAuth for backward compatibility
    wallet,
    walletAddress: wallet?.account.address
  };
};