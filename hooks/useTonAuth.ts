import { useState, useEffect, useCallback } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
// Переконайся, що шляхи до types та constants правильні
// Якщо файли в інших місцях, зміни '../types' на правильний шлях
import { User } from '../types'; 
import { API_BASE_URL } from '../constants';

export const useTonAuth = () => {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  // --- 1. CHECK LOGIN STATUS (GET /login) ---
  const checkAuth = useCallback(async () => {
    if (!wallet) {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet.account.address
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth check failed: ${errorText}`);
      }

      const data = await response.json();

      // Обробка відповіді
      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      return data; // Повертаємо дані, щоб App.tsx бачив needsRegistration

    } catch (error: any) {
      console.error("❌ Auth check error:", error);
      setAuthError(error.message || "Authentication failed.");
      setIsAuthenticated(false);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  // --- 2. REGISTER USER (POST /register) ---
  const register = useCallback(async (username: string, referralCode?: string | null) => {
    if (!wallet) return;

    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet.account.address,
          username: username,
          referralCode: referralCode || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        console.log("✅ Registered successfully as:", data.user.username);
        return data.user;
      }
      
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      setAuthError(error.message || "Registration failed.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  // --- HYBRID FUNCTION (Compatibility) ---
  const loginOrRegister = useCallback(async (username?: string) => {
    if (username) {
      const refCode = localStorage.getItem('referralCode');
      return register(username, refCode);
    } else {
      return checkAuth();
    }
  }, [checkAuth, register]);

  // --- EFFECTS ---
  useEffect(() => {
    checkAuth();
  }, [wallet]);

  return {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    authError,
    loginOrRegister,
    syncIdentity: checkAuth,
    register, // ЦЕ ВИПРАВЛЯЄ ПОМИЛКУ В App.tsx
    wallet,
    walletAddress: wallet?.account.address
  };
};