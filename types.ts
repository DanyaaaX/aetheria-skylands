
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
  referredBy?: string | null;
  inviteCount: number;
  points: number;
  hasPaidEarlyAccess: boolean;
  hasMintedNFT: boolean;
  socialsFollowed: Socials;
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
