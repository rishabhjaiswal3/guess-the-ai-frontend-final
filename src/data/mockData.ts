 // Mock data for leaderboard and user profile
 
 export interface LeaderboardEntry {
   rank: number;
   username: string;
   correct: number;
   streak: number;
   best: number;
   level: string;
 }
 
 export interface UserProfile {
   username: string;
   walletAddress: string;
   rank: string;
   bestStreak: number;
   currentStreak: number;
   correctAnswers: number;
   level: string;
   avatarBadge: string;
 }
 
export const LEADERBOARD_ALL_TIME: LeaderboardEntry[] = [
  { rank: 1, username: "Acex", correct: 1263, streak: 32, best: 121, level: "S+" },
  { rank: 2, username: "mokobili", correct: 386, streak: 1, best: 24, level: "A" },
  { rank: 3, username: "Kishu", correct: 367, streak: 0, best: 15, level: "A" },
  { rank: 4, username: "Ankur Gan...", correct: 228, streak: 3, best: 48, level: "A" },
  { rank: 5, username: "CryptoMaster", correct: 198, streak: 5, best: 22, level: "B" },
  { rank: 6, username: "AIHunter", correct: 156, streak: 2, best: 18, level: "B" },
  { rank: 7, username: "PixelPro", correct: 134, streak: 0, best: 12, level: "B" },
  { rank: 8, username: "DetectorX", correct: 98, streak: 4, best: 9, level: "C" },
];

export const LEADERBOARD_GATE: LeaderboardEntry[] = [
  { rank: 1, username: "GateGuru", correct: 540, streak: 18, best: 60, level: "A" },
  { rank: 2, username: "WalletWhiz", correct: 420, streak: 10, best: 42, level: "A" },
  { rank: 3, username: "KeyKeeper", correct: 300, streak: 8, best: 30, level: "B" },
  { rank: 4, username: "PortalPilot", correct: 260, streak: 6, best: 27, level: "B" },
  { rank: 5, username: "Locksmith", correct: 190, streak: 4, best: 20, level: "C" },
  { rank: 6, username: "GateRunner", correct: 150, streak: 3, best: 18, level: "C" },
];

export const MOCK_USER: UserProfile = {
   username: "Player",
   walletAddress: "0x128ad98580fa5635a8cb426b2408968d75a3b54c",
   rank: "D",
   bestStreak: 14,
   currentStreak: 0,
   correctAnswers: 28,
   level: "NEWBIE",
   avatarBadge: "🎮",
 };
 
 export const RANK_COLORS: Record<string, string> = {
   "S+": "bg-gradient-to-r from-yellow-400 to-amber-500 text-primary-foreground",
   "S": "bg-gradient-to-r from-yellow-300 to-orange-400 text-primary-foreground",
   "A": "bg-gradient-to-r from-purple-500 to-violet-600 text-foreground",
   "B": "bg-gradient-to-r from-blue-500 to-cyan-500 text-foreground",
   "C": "bg-gradient-to-r from-green-500 to-emerald-500 text-foreground",
   "D": "bg-gradient-to-r from-gray-400 to-gray-500 text-foreground",
 };
