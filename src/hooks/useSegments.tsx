import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys, CACHE_TIME } from '@/lib/queryKeys';

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  promptContext: string;
  salesObjective: 'qualificacao' | 'fechamento' | 'completo';
  // Compatibility aliases
  prompt_context?: string;
  sales_objective?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  displayName: string;
  objectionStyle: string;
  toneParams: Record<string, unknown>;
  whatsappStyle: boolean;
  // Compatibility aliases
  display_name?: string;
  objection_style?: string;
  tone_params?: Record<string, unknown>;
  whatsapp_style?: boolean;
}

const fetchSegments = async (): Promise<Segment[]> => {
  return api.get<Segment[]>('/segments');
};

const fetchClientProfiles = async (): Promise<ClientProfile[]> => {
  return api.get<ClientProfile[]>('/client-profiles');
};

export const useSegments = () => {
  const segmentsQuery = useQuery({
    queryKey: queryKeys.segments,
    queryFn: fetchSegments,
    staleTime: CACHE_TIME.STATIC,
  });

  const clientProfilesQuery = useQuery({
    queryKey: queryKeys.clientProfiles,
    queryFn: fetchClientProfiles,
    staleTime: CACHE_TIME.STATIC,
  });

  const refetch = async () => {
    await Promise.all([segmentsQuery.refetch(), clientProfilesQuery.refetch()]);
  };

  return {
    segments: segmentsQuery.data ?? [],
    clientProfiles: clientProfilesQuery.data ?? [],
    isLoading: segmentsQuery.isLoading || clientProfilesQuery.isLoading,
    error: segmentsQuery.error?.message || clientProfilesQuery.error?.message || null,
    refetch,
  };
};
