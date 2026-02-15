import { useState, useEffect, useCallback, useRef } from 'react'; // Додав useRef
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
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
  
  // 🔥 FIX 1: Використовуємо ref, щоб знати, чи йде запит прямо зараз
  const isFetchingRef = useRef(false);

  // --- 1. CHECK LOGIN STATUS (GET /login) ---
  const checkAuth = useCallback(async () => {
    // Якщо немає гаманця АБО запит вже йде -> виходимо
    if (!wallet || isFetchingRef.current) return;

    // Якщо ми вже авторизовані саме під цим гаманцем -> виходимо (економія запитів)
    if (user?.walletAddress === wallet.account.address) return;

    isFetchingRef.current = true; // Блокуємо повторні запити
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

      // Спеціальна обробка 429, щоб зупинити цикл, якщо він все ж станеться
      if (response.status === 429) {
        throw new Error("Too many requests. Please wait a moment.");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth check failed: ${errorText}`);
      }

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        // Якщо юзера немає (потрібна реєстрація), ми НЕ ставимо помилку,
        // просто скидаємо юзера, щоб UI показав кнопку реєстрації
        setUser(null);
        setIsAuthenticated(false);
      }

      return data;

    } catch (error: any) {
      console.error("❌ Auth check error:", error);
      setAuthError(error.message || "Authentication failed.");
      setIsAuthenticated(false);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false; // Розблокуємо
    }
  }, [wallet, user?.walletAddress]); // Додали user?.walletAddress для перевірки

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

  // --- HYBRID FUNCTION ---
  const loginOrRegister = useCallback(async (username?: string) => {
    if (username) {
      const refCode = localStorage.getItem('referralCode');
      return register(username, refCode);
    } else {
      return checkAuth();
    }
  }, [checkAuth, register]);

  // --- 🔥 FIX 2: EFFECTS ---
  // Слідкуємо ТІЛЬКИ за зміною адреси гаманця (рядок), а не всього об'єкта
  const walletAddress = wallet?.account?.address;

  useEffect(() => {
    if (walletAddress) {
      checkAuth();
    } else {
      // Якщо гаманець відключили - очищаємо стейт
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [walletAddress]); // <--- ТУТ БУЛА ГОЛОВНА ПРОБЛЕМА. Тепер ми слідкуємо за рядком.

  return {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    authError,
    loginOrRegister,
    syncIdentity: checkAuth,
    register,
    wallet,
    walletAddress: wallet?.account.address
  };
};