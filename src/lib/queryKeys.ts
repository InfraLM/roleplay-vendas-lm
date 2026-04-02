// Centralized React Query keys for cache management

export const queryKeys = {
  // Static data (long cache)
  segments: ['segments'] as const,
  clientProfiles: ['clientProfiles'] as const,
  
  // User-specific data
  vouchers: (userId: string) => ['vouchers', userId] as const,
  streak: (userId: string) => ['streak', userId] as const,
  userGoals: (userId: string) => ['userGoals', userId] as const,
  goalProgress: (userId: string) => ['goalProgress', userId] as const,
  
  // Organization data
  prizes: (orgId: string) => ['prizes', orgId] as const,
  allPrizes: (orgId: string) => ['allPrizes', orgId] as const,
  redemptions: (userId: string) => ['redemptions', userId] as const,
  allRedemptions: (orgId: string) => ['allRedemptions', orgId] as const,
  teamMembers: (orgId: string) => ['teamMembers', orgId] as const,
  
  // Roleplay specific
  roleplay: (id: string) => ['roleplay', id] as const,
  roleplayMessages: (id: string) => ['roleplayMessages', id] as const,
  userRoleplays: (userId: string) => ['userRoleplays', userId] as const,
  
  // Dashboard
  dashboardStats: (userId: string) => ['dashboardStats', userId] as const,
  teamRanking: (orgId: string) => ['teamRanking', orgId] as const,
} as const;

// Cache time constants
export const CACHE_TIME = {
  STATIC: 30 * 60 * 1000,      // 30 minutes - segments, client profiles
  MEDIUM: 5 * 60 * 1000,       // 5 minutes - prizes, vouchers, goals
  SHORT: 2 * 60 * 1000,        // 2 minutes - streak, team data
  REALTIME: 30 * 1000,         // 30 seconds - actively changing data
} as const;
