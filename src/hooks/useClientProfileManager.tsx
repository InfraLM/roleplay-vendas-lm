import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export type ClientProfileType = 'soft' | 'hard' | 'chato' | 'ultra_hard';

export interface ClientProfile {
  id: string;
  name: ClientProfileType;
  display_name: string;
  objection_style: string;
  tone_params: any;
  whatsapp_style: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientProfileFormData {
  name: ClientProfileType;
  display_name: string;
  objection_style: string;
  tone_params?: Record<string, any>;
  whatsapp_style?: boolean;
}

export const useClientProfileManager = () => {
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<ClientProfile[]>('/client-profiles');
      setProfiles(data || []);
    } catch (err: any) {
      console.error('Error fetching client profiles:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const createProfile = async (data: ClientProfileFormData): Promise<ClientProfile> => {
    try {
      const newProfile = await api.post<ClientProfile>('/client-profiles', {
        name: data.name,
        display_name: data.display_name.trim(),
        objection_style: data.objection_style.trim(),
        tone_params: data.tone_params || {},
        whatsapp_style: data.whatsapp_style ?? true
      });

      toast({
        title: "Perfil criado",
        description: `${data.display_name} foi criado com sucesso`,
      });

      await fetchProfiles();
      return newProfile;
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao criar perfil",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateProfile = async (id: string, data: Partial<ClientProfileFormData>): Promise<ClientProfile> => {
    try {
      const updateData: Record<string, any> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.display_name !== undefined) updateData.display_name = data.display_name.trim();
      if (data.objection_style !== undefined) updateData.objection_style = data.objection_style.trim();
      if (data.tone_params !== undefined) updateData.tone_params = data.tone_params;
      if (data.whatsapp_style !== undefined) updateData.whatsapp_style = data.whatsapp_style;

      const updated = await api.put<ClientProfile>(`/client-profiles/${id}`, updateData);

      toast({
        title: "Perfil atualizado",
        description: "Alterações salvas com sucesso",
      });

      await fetchProfiles();
      return updated;
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao atualizar perfil",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteProfile = async (id: string): Promise<void> => {
    try {
      await api.delete(`/client-profiles/${id}`);

      toast({
        title: "Perfil excluído",
        description: "Perfil removido com sucesso",
      });

      await fetchProfiles();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao excluir perfil",
        variant: "destructive",
      });
      throw err;
    }
  };

  const getProfileTypeColor = (type: ClientProfileType): string => {
    const colors: Record<ClientProfileType, string> = {
      soft: 'bg-green-500/20 text-green-400 border-green-500/30',
      hard: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      chato: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      ultra_hard: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[type] || colors.soft;
  };

  const getProfileTypeLabel = (type: ClientProfileType): string => {
    const labels: Record<ClientProfileType, string> = {
      soft: 'Fácil',
      hard: 'Médio',
      chato: 'Difícil',
      ultra_hard: 'Expert'
    };
    return labels[type] || type;
  };

  return {
    profiles,
    isLoading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfileTypeColor,
    getProfileTypeLabel,
    refetch: fetchProfiles
  };
};
