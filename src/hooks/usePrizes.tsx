import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { queryKeys, CACHE_TIME } from '@/lib/queryKeys';

export interface Prize {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  vouchers_required: number;
  quantity_available: number | null;
  category: string;
  is_active: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface PrizeRedemption {
  id: string;
  user_id: string;
  prize_id: string;
  voucher_ids: string[];
  status: 'pending' | 'approved' | 'delivered' | 'canceled';
  notes: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
  prize?: Prize;
  profiles?: { name: string; email: string };
}

// Query functions
const fetchActivePrizes = async (): Promise<Prize[]> => {
  return api.get<Prize[]>('/prizes');
};

const fetchAllPrizes = async (): Promise<Prize[]> => {
  return api.get<Prize[]>('/prizes?all=true');
};

const fetchUserRedemptions = async (): Promise<PrizeRedemption[]> => {
  return api.get<PrizeRedemption[]>('/prizes/redemptions');
};

const fetchOrgRedemptions = async (): Promise<PrizeRedemption[]> => {
  return api.get<PrizeRedemption[]>('/prizes/redemptions/all');
};

export function usePrizes() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id ?? '';

  // Queries
  const prizesQuery = useQuery({
    queryKey: queryKeys.prizes(orgId),
    queryFn: () => fetchActivePrizes(),
    enabled: !!user && !!orgId,
    staleTime: CACHE_TIME.MEDIUM,
  });

  const allPrizesQuery = useQuery({
    queryKey: queryKeys.allPrizes(orgId),
    queryFn: () => fetchAllPrizes(),
    enabled: !!user && !!orgId,
    staleTime: CACHE_TIME.MEDIUM,
  });

  const redemptionsQuery = useQuery({
    queryKey: queryKeys.redemptions(user?.id ?? ''),
    queryFn: () => fetchUserRedemptions(),
    enabled: !!user,
    staleTime: CACHE_TIME.MEDIUM,
  });

  const allRedemptionsQuery = useQuery({
    queryKey: queryKeys.allRedemptions(orgId),
    queryFn: () => fetchOrgRedemptions(),
    enabled: !!user && !!orgId,
    staleTime: CACHE_TIME.MEDIUM,
  });

  // Mutations
  const createPrizeMutation = useMutation({
    mutationFn: async (prizeData: Omit<Prize, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
      return api.post<Prize>('/prizes', prizeData);
    },
    onSuccess: () => {
      toast.success('Prêmio criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: queryKeys.allPrizes(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.prizes(orgId) });
    },
    onError: () => toast.error('Erro ao criar prêmio'),
  });

  const updatePrizeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Prize> }) => {
      return api.put(`/prizes/${id}`, data);
    },
    onSuccess: () => {
      toast.success('Prêmio atualizado!');
      queryClient.invalidateQueries({ queryKey: queryKeys.allPrizes(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.prizes(orgId) });
    },
    onError: () => toast.error('Erro ao atualizar prêmio'),
  });

  const deletePrizeMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/prizes/${id}`);
    },
    onSuccess: () => {
      toast.success('Prêmio excluído!');
      queryClient.invalidateQueries({ queryKey: queryKeys.allPrizes(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.prizes(orgId) });
    },
    onError: () => toast.error('Erro ao excluir prêmio'),
  });

  const redeemPrizeMutation = useMutation({
    mutationFn: async ({ prize, voucherIds }: { prize: Prize; voucherIds: string[] }) => {
      if (voucherIds.length < prize.vouchers_required) {
        throw new Error('Vouchers insuficientes');
      }

      return api.post(`/prizes/${prize.id}/redeem`, { voucherIds });
    },
    onSuccess: () => {
      toast.success('Resgate solicitado com sucesso!');
      queryClient.invalidateQueries({ queryKey: queryKeys.prizes(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.redemptions(user!.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vouchers(user!.id) });
    },
    onError: () => toast.error('Erro ao resgatar prêmio'),
  });

  const updateRedemptionMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: PrizeRedemption['status']; notes?: string }) => {
      return api.put(`/prizes/redemptions/${id}`, { status, notes: notes || null });
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: queryKeys.allRedemptions(orgId) });
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  return {
    prizes: prizesQuery.data ?? [],
    redemptions: redemptionsQuery.data ?? [],
    loading: prizesQuery.isLoading,
    fetchPrizes: prizesQuery.refetch,
    fetchAllPrizes: async () => { await allPrizesQuery.refetch(); },
    fetchRedemptions: redemptionsQuery.refetch,
    fetchAllRedemptions: async () => { await allRedemptionsQuery.refetch(); },
    createPrize: async (data: Omit<Prize, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
      try {
        await createPrizeMutation.mutateAsync(data);
        return true;
      } catch { return null; }
    },
    updatePrize: async (id: string, data: Partial<Prize>) => {
      try {
        await updatePrizeMutation.mutateAsync({ id, data });
        return true;
      } catch { return false; }
    },
    deletePrize: async (id: string) => {
      try {
        await deletePrizeMutation.mutateAsync(id);
        return true;
      } catch { return false; }
    },
    redeemPrize: async (prize: Prize, voucherIds: string[]) => {
      try {
        await redeemPrizeMutation.mutateAsync({ prize, voucherIds });
        return true;
      } catch { return false; }
    },
    updateRedemptionStatus: async (id: string, status: PrizeRedemption['status'], notes?: string) => {
      try {
        await updateRedemptionMutation.mutateAsync({ id, status, notes });
        return true;
      } catch { return false; }
    },
  };
}
