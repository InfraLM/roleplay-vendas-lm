import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import { queryKeys, CACHE_TIME } from '@/lib/queryKeys';
import { useCallback } from 'react';

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

const fetchStreak = async (): Promise<StreakResult> => {
  return api.get<StreakResult>('/streaks');
};

export const useStreak = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const streakQuery = useQuery({
    queryKey: queryKeys.streak(user?.id ?? ''),
    queryFn: () => fetchStreak(),
    enabled: !!user,
    staleTime: CACHE_TIME.SHORT,
  });

  const refreshStreak = useCallback(async () => {
    if (user) {
      // Call the update endpoint to recalculate, then invalidate cache
      try {
        await api.post('/streaks/update');
      } catch {
        // ignore errors on refresh
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.streak(user.id) });
    }
  }, [user, queryClient]);

  const getStreakMessage = useCallback(() => {
    const currentStreak = streakQuery.data?.currentStreak ?? 0;
    if (currentStreak === 0) return 'Comece seu streak hoje!';
    if (currentStreak === 1) return 'Primeiro dia! Continue!';
    if (currentStreak <= 3) return 'Continue assim!';
    if (currentStreak <= 7) return 'Você está pegando fogo! 🔥';
    if (currentStreak <= 14) return 'Incrível dedicação!';
    if (currentStreak <= 30) return 'Você é imparável!';
    return 'Lenda do treinamento! 🏆';
  }, [streakQuery.data?.currentStreak]);

  return {
    currentStreak: streakQuery.data?.currentStreak ?? 0,
    longestStreak: streakQuery.data?.longestStreak ?? 0,
    lastActivityDate: streakQuery.data?.lastActivityDate ?? null,
    isLoading: streakQuery.isLoading,
    refreshStreak,
    getStreakMessage,
  };
};
