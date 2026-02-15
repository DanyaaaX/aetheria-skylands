export interface Socials {
  twitter: boolean;
  telegram: boolean;
}

export interface User {
  id: string;
  username: string;
  walletAddress: string;
  publicKey: string;
  referralCode: string;
  referredBy?: string | null; // Може бути undefined або null
  inviteCount: number;
  points: number;
  
  // 🔥 НОВІ ПОЛЯ (Додані для виправлення помилок)
  telegramHandle?: string;
  twitterHandle?: string;
  telegramId?: string;        // Виправляє помилку в Profile.tsx
  
  nftReferralsCount?: number; // Виправляє помилку в Dashboard.tsx (VIP система)
  isVip?: boolean;            // Виправляє помилку в Dashboard.tsx (VIP статус)
  // -----------------------

  hasPaidEarlyAccess: boolean;
  
  // Об'єднано: hasMintedNFT та hasNft. 
  // Використовуємо це поле для бейджа "Genesis Owner"
  hasMintedNFT: boolean; 

  socialsFollowed: Socials;
  
  // Використовується для перевірки "Early Adopter" (наприклад, if createdAt < TGE Date)
  createdAt: string; 
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  inviteCount: number;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string; // Future-proofing for JWT
  error?: string;
}

export interface ApiError {
  error: string;
  path?: string;
  timestamp?: string;
}