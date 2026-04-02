import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { queryKeys, CACHE_TIME } from '@/lib/queryKeys';
import { useCallback } from 'react';

export type UserRole = 'admin' | 'coach' | 'vendedor' | 'closer' | 'sdr';

export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  team: string | null;
  status: string | null;
  created_at: string;
}

export interface InviteUserData {
  email: string;
  name: string;
  role: UserRole;
  team?: string;
}

const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  return api.get<TeamMember[]>('/team/members');
};

export const useTeamManagement = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id ?? '';

  const membersQuery = useQuery({
    queryKey: queryKeys.teamMembers(orgId),
    queryFn: () => fetchTeamMembers(),
    enabled: !!orgId,
    staleTime: CACHE_TIME.SHORT,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      return api.put<{ message: string }>(`/team/${userId}/role`, { role: newRole });
    },
    onSuccess: (data) => {
      toast({ title: 'Sucesso', description: data.message || 'Role atualizado com sucesso' });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers(orgId) });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message || 'Erro ao atualizar role', variant: 'destructive' });
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete<{ message: string }>(`/team/${userId}`);
    },
    onSuccess: (data) => {
      toast({ title: 'Sucesso', description: data.message || 'Usuário removido com sucesso' });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers(orgId) });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message || 'Erro ao remover usuário', variant: 'destructive' });
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserData) => {
      const result = await api.post<{ message: string }>('/team/invite', data);
      return { result, email: data.email };
    },
    onSuccess: ({ result, email }) => {
      toast({ title: 'Convite enviado!', description: result.message || `Convite enviado para ${email}` });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers(orgId) });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message || 'Erro ao enviar convite', variant: 'destructive' });
    },
  });

  const updateUserRole = useCallback(async (userId: string, newRole: UserRole): Promise<void> => {
    await updateRoleMutation.mutateAsync({ userId, newRole });
  }, [updateRoleMutation]);

  const removeUser = useCallback(async (userId: string): Promise<void> => {
    await removeUserMutation.mutateAsync(userId);
  }, [removeUserMutation]);

  const inviteUser = useCallback(async (data: InviteUserData): Promise<void> => {
    await inviteUserMutation.mutateAsync(data);
  }, [inviteUserMutation]);

  const getRoleCounts = useCallback(() => {
    const members = membersQuery.data || [];
    const counts = {
      total: members.length,
      admin: 0,
      coach: 0,
      vendedor: 0,
      sdr: 0,
      active: 0,
      pending: 0
    };

    members.forEach(m => {
      counts[m.role]++;
      if (m.status === 'active') counts.active++;
      if (m.status === 'pending') counts.pending++;
    });

    return counts;
  }, [membersQuery.data]);

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error?.message ?? null,
    updateUserRole,
    removeUser,
    inviteUser,
    getRoleCounts,
    refetch: membersQuery.refetch
  };
};
