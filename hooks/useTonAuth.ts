import { useState, useCallback, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { User } from '../types';
import { API_BASE_URL } from '../constants';

export const useTonAuth = () => {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Session Synchronization
  // Structure from Code 1, Logic improved with Code 2 checks
  const syncIdentity = useCallback(async () => {
    if (!wallet?.account?.address) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet.account.address })
      });
      
      const data = await res.json();
      
      // Verification logic from Code 2 (checks both exists AND user object)
      if (data.exists && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Identity registry synchronization failed", e);
      setAuthError("Identity registry synchronization failed.");
    } finally {
      setIsLoading(false);
    }
  }, [wallet?.account?.address]);

  // Auto-sync effect
  useEffect(() => {
    syncIdentity();
  }, [syncIdentity]);

  // 2. Login/Register with Real TON Proof
  // Logic completely updated to Code 2 standards
  const loginOrRegister = async (username?: string) => {
    // Basic wallet check
    if (!wallet) {
      throw new Error("Neural link failed: Connect wallet first.");
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      // CRITICAL UPDATE FROM CODE 2: Check for TON Proof
      // If the wallet didn't provide a signature during connection, we must disconnect/reconnect
      if (!wallet.connectItems?.tonProof || !('proof' in wallet.connectItems.tonProof)) {
        await tonConnectUI.disconnect();
        const errMsg = "Session expired. Please connect wallet again to sign.";
        setAuthError(errMsg);
        setIsLoading(false);
        return;
      }

      const proof = wallet.connectItems.tonProof.proof;

      // Construct payload using Code 2's structure (Actual Proof Data)
      const payload = {
        walletAddress: wallet.account.address,
        publicKey: wallet.account.publicKey,
        signature: proof.signature,
        message: JSON.stringify({
          timestamp: proof.timestamp,
          domain: proof.domain,
          payload: proof.payload
        }), // Sending proof data as a JSON string for backend verification
        username: username || undefined,
        referredBy: localStorage.getItem('referralCode') || undefined // Updated key to 'referralCode' per Code 2
      };

      // 3. Authenticate with Backend
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Authentication rejected.");
      }

      setUser(data.user);
      return data.user;

    } catch (e: any) {
      console.error("Login error:", e);
      setAuthError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    user, 
    setUser, 
    isLoading, 
    authError, 
    loginOrRegister, 
    wallet, 
    syncIdentity 
  };
};
