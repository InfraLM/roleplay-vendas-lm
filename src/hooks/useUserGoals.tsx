import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import { queryKeys, CACHE_TIME } from '@/lib/queryKeys';

export interface UserGoal {
  id: string;
  user_id: string;
  organization_id: string | null;
  roleplays_per_week: number | null;
  min_score: number | null;
  vouchers_per_month: number | null;
  set_by: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  roleplays_this_week: number;
  roleplays_goal: number | null;
  avg_score_this_week: number;
  min_score_goal: number | null;
  vouchers_this_month: number;
  vouchers_goal: number | null;
  has_goals: boolean;
}

export interface SetGoalData {
  user_id: string;
  roleplays_per_week?: number | null;
  min_score?: number | null;
  vouchers_per_month?: number | null;
  notes?: string | null;
}

const fetchUserGoal = async (userId: string): Promise<UserGoal | null> => {
  const data = await api.get<UserGoal[]>(`/goals/${userId}`);
  // The API returns an array or a single goal; handle both cases
  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] : null;
  }
  return data as unknown as UserGoal | null;
};

const fetchGoalProgress = async (userId: string): Promise<GoalProgress> => {
  return api.get<GoalProgress>(`/goals/${userId}/progress`);
};

export const useUserGoals = (targetUserId?: string) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const userId = targetUserId || user?.id || '';

  const goalQuery = useQuery({
    queryKey: queryKeys.userGoals(userId),
    queryFn: () => fetchUserGoal(userId),
    enabled: !!userId,
    staleTime: CACHE_TIME.MEDIUM,
  });

  const progressQuery = useQuery({
    queryKey: queryKeys.goalProgress(userId),
    queryFn: () => fetchGoalProgress(userId),
    enabled: !!userId && goalQuery.isSuccess,
    staleTime: CACHE_TIME.SHORT,
  });

  const setGoalMutation = useMutation({
    mutationFn: async (data: SetGoalData) => {
      if (!profile?.organization_id || !user?.id) throw new Error('Missing org/user');
      await api.post('/goals', {
        user_id: data.user_id,
        roleplays_per_week: data.roleplays_per_week ?? null,
        min_score: data.min_score ?? null,
        vouchers_per_month: data.vouchers_per_month ?? null,
        notes: data.notes ?? null,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userGoals(variables.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(variables.user_id) });
    },
  });

  const clearGoalMutation = useMutation({
    mutationFn: async (targetId: string) => {
      await api.delete(`/goals/${targetId}`);
      return targetId;
    },
    onSuccess: (targetId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userGoals(targetId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(targetId) });
    },
  });

  const setUserGoal = useCallback(async (data: SetGoalData): Promise<boolean> => {
    try {
      await setGoalMutation.mutateAsync(data);
      return true;
    } catch (err) {
      console.error('Error setting user goal:', err);
      return false;
    }
  }, [setGoalMutation]);

  const clearGoal = useCallback(async (targetId: string): Promise<boolean> => {
    try {
      await clearGoalMutation.mutateAsync(targetId);
      return true;
    } catch (err) {
      console.error('Error clearing goal:', err);
      return false;
    }
  }, [clearGoalMutation]);

  return {
    goal: goalQuery.data ?? null,
    progress: progressQuery.data ?? null,
    isLoading: goalQuery.isLoading || progressQuery.isLoading,
    setUserGoal,
    clearGoal,
    refetch: goalQuery.refetch,
  };
};
