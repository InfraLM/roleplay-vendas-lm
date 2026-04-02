import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "./useAuth";

export interface NinjaRank {
  id: string;
  level: number;
  name: string;
  emoji: string;
  color: string;
  required_roleplays: number;
  required_avg_score: number;
  required_streak: number;
  required_vouchers: number;
  xp_to_next_level: number | null;
  description: string | null;
}

export interface NinjaProgress {
  id: string;
  user_id: string;
  current_level: number;
  current_xp: number;
  total_xp: number;
  total_roleplays: number;
  avg_score: number;
  best_streak: number;
  total_vouchers: number;
  level_up_at: string | null;
  updated_at: string;
}

export interface LevelUpResult {
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  previousRank: NinjaRank | null;
  newRank: NinjaRank | null;
  xpGained: number;
}

export const queryKeys = {
  ninjaRanks: ["ninjaRanks"] as const,
  ninjaProgress: (userId: string) => ["ninjaProgress", userId] as const,
};

export function useNinjaRank() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [levelUpResult, setLevelUpResult] = useState<LevelUpResult | null>(null);

  // Fetch all ninja ranks
  const { data: ranks = [], isLoading: ranksLoading } = useQuery({
    queryKey: queryKeys.ninjaRanks,
    queryFn: async () => {
      return api.get<NinjaRank[]>('/ninja/ranks');
    },
    staleTime: 1000 * 60 * 60, // 1 hour - ranks rarely change
  });

  // Fetch user's ninja progress
  const { data: progress, isLoading: progressLoading, refetch: refetchProgress } = useQuery({
    queryKey: queryKeys.ninjaProgress(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) return null;
      return api.get<NinjaProgress | null>('/ninja/progress');
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get current rank based on level
  const getCurrentRank = useCallback((level: number): NinjaRank | null => {
    return ranks.find(r => r.level === level) || null;
  }, [ranks]);

  // Get next rank
  const getNextRank = useCallback((level: number): NinjaRank | null => {
    return ranks.find(r => r.level === level + 1) || null;
  }, [ranks]);

  // Calculate XP for a roleplay
  const calculateXP = useCallback((score: number, messageCount: number): number => {
    const baseXP = 10;
    const scoreBonus = Math.floor(score / 10) * 5; // +5 XP for every 10 points
    const lengthBonus = Math.min(messageCount, 20); // up to +20 XP for long conversations
    return baseXP + scoreBonus + lengthBonus;
  }, []);

  // Check if user meets requirements for a rank
  const meetsRequirements = useCallback((rank: NinjaRank, stats: {
    totalRoleplays: number;
    avgScore: number;
    bestStreak: number;
    totalVouchers: number;
  }): boolean => {
    return (
      stats.totalRoleplays >= rank.required_roleplays &&
      stats.avgScore >= rank.required_avg_score &&
      stats.bestStreak >= rank.required_streak &&
      stats.totalVouchers >= rank.required_vouchers
    );
  }, []);

  // Get requirements progress for next level
  const getRequirementsProgress = useCallback((currentLevel: number, stats: {
    totalRoleplays: number;
    avgScore: number;
    bestStreak: number;
    totalVouchers: number;
  }) => {
    const nextRank = getNextRank(currentLevel);
    if (!nextRank) return null;

    return {
      roleplays: {
        current: stats.totalRoleplays,
        required: nextRank.required_roleplays,
        met: stats.totalRoleplays >= nextRank.required_roleplays,
      },
      avgScore: {
        current: stats.avgScore,
        required: nextRank.required_avg_score,
        met: stats.avgScore >= nextRank.required_avg_score,
      },
      streak: {
        current: stats.bestStreak,
        required: nextRank.required_streak,
        met: stats.bestStreak >= nextRank.required_streak,
      },
      vouchers: {
        current: stats.totalVouchers,
        required: nextRank.required_vouchers,
        met: stats.totalVouchers >= nextRank.required_vouchers,
      },
    };
  }, [getNextRank]);

  // Initialize or update ninja progress after roleplay
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      score,
      messageCount
    }: {
      score: number;
      messageCount: number;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const result = await api.post<LevelUpResult>('/ninja/progress/update', {
        score,
        messageCount,
      });

      if (result.leveledUp) {
        setLevelUpResult(result);
      }

      return result;
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.ninjaProgress(user.id) });
      }
    },
  });

  // Recalculate progress from actual data (without adding XP)
  const recalculateProgressMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      return api.post<{ totalRoleplays: number; avgScore: number; bestStreak: number; totalVouchers: number }>('/ninja/progress/recalculate');
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.ninjaProgress(user.id) });
      }
    },
  });

  // Clear level up result (after showing modal)
  const clearLevelUpResult = useCallback(() => {
    setLevelUpResult(null);
  }, []);

  // Get user's current rank
  const currentRank = progress ? getCurrentRank(progress.current_level) : getCurrentRank(1);
  const nextRank = progress ? getNextRank(progress.current_level) : getNextRank(1);

  // Calculate XP progress to next level
  const xpProgress = progress && currentRank?.xp_to_next_level
    ? (progress.current_xp / currentRank.xp_to_next_level) * 100
    : 0;

  return {
    // Data
    ranks,
    progress,
    currentRank,
    nextRank,
    xpProgress,
    levelUpResult,

    // Loading states
    isLoading: ranksLoading || progressLoading,

    // Functions
    calculateXP,
    getCurrentRank,
    getNextRank,
    getRequirementsProgress,
    updateProgress: updateProgressMutation.mutateAsync,
    isUpdating: updateProgressMutation.isPending,
    recalculateProgress: recalculateProgressMutation.mutateAsync,
    isRecalculating: recalculateProgressMutation.isPending,
    clearLevelUpResult,
    refetchProgress,
  };
}
