import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { queryKeys, CACHE_TIME } from '@/lib/queryKeys';

export interface Voucher {
  id: string;
  code: string;
  status: 'issued' | 'redeemed' | 'expired' | 'canceled';
  metadata: unknown;
  expires_at: string | null;
  created_at: string;
  roleplay_id: string;
}

const fetchVouchers = async (): Promise<Voucher[]> => {
  return api.get<Voucher[]>('/vouchers');
};

const markAsRedeemed = async (voucherIds: string[]): Promise<void> => {
  await api.put('/vouchers/redeem', { voucherIds });
};

export function useVouchers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const vouchersQuery = useQuery({
    queryKey: queryKeys.vouchers(user?.id ?? ''),
    queryFn: () => fetchVouchers(),
    enabled: !!user,
    staleTime: CACHE_TIME.MEDIUM,
  });

  const markAsRedeemedMutation = useMutation({
    mutationFn: markAsRedeemed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vouchers(user!.id) });
    },
    onError: () => {
      toast.error('Erro ao atualizar vouchers');
    },
  });

  const vouchers = vouchersQuery.data ?? [];
  const availableVouchers = vouchers.filter(v => v.status === 'issued');

  return {
    vouchers,
    loading: vouchersQuery.isLoading,
    availableVouchers,
    availableCount: availableVouchers.length,
    fetchVouchers: vouchersQuery.refetch,
    markVouchersAsRedeemed: async (voucherIds: string[]) => {
      try {
        await markAsRedeemedMutation.mutateAsync(voucherIds);
        return true;
      } catch {
        return false;
      }
    },
  };
}
