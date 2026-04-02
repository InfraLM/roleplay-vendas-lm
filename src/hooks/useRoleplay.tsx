import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface RoleplayData {
  id: string;
  userId: string;
  segmentId: string;
  profileId: string;
  organizationId: string | null;
  status: 'active' | 'paused' | 'finished' | 'evaluated';
  messageCount: number;
  messageLimit: number;
  guidedMode: boolean;
  startedAt: string;
  finishedAt: string | null;
  segment?: {
    name: string;
    description: string | null;
    promptContext: string;
  };
  clientProfile?: {
    name: string;
    displayName: string;
    objectionStyle: string;
  };
  // Keep compatibility with snake_case from some responses
  segments?: { name: string; description: string | null; prompt_context: string };
  client_profiles?: { name: string; display_name: string; objection_style: string };
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  turn_number: number;
  tip?: string;
}

export interface EvaluationResult {
  success: boolean;
  report: {
    id: string;
    score_overall: number;
    close_probability: number;
    scores: {
      rapport: number;
      escuta: number;
      clareza: number;
      persuasao: number;
      objecoes: number;
      fechamento: number;
    };
    radar: string;
    pontos_fortes: string[];
    areas_melhoria: string[];
    feedback_geral: string;
    proximos_passos: string[];
    feedback_competencias?: Record<string, string>;
  };
  voucher?: {
    id: string;
    code: string;
    expires_at: string;
  } | null;
}

export const useRoleplay = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createRoleplay = async (segmentId: string, profileId: string, guidedMode: boolean = false): Promise<RoleplayData> => {
    setIsLoading(true);
    try {
      return await api.post<RoleplayData>('/roleplays', { segmentId, profileId, guidedMode });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar roleplay";
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleplay = async (roleplayId: string): Promise<RoleplayData> => {
    return api.get<RoleplayData>(`/roleplays/${roleplayId}`);
  };

  const getRoleplayMessages = async (roleplayId: string): Promise<Message[]> => {
    const data = await api.get<any[]>(`/roleplays/${roleplayId}/messages`);
    return (data || []).map(msg => ({
      id: msg.id,
      sender: msg.sender as 'user' | 'ai',
      content: msg.content,
      timestamp: new Date(msg.timestamp || msg.createdAt),
      turn_number: msg.turnNumber || msg.turn_number,
    }));
  };

  const sendMessage = async (
    roleplayId: string,
    message: string,
    turnNumber: number
  ): Promise<{ message: string; turnNumber: number; tip?: string }> => {
    setIsLoading(true);
    try {
      const data = await api.post<{ message: string; turnNumber: number; tip?: string }>(
        '/chat/send',
        { roleplayId, message, turnNumber }
      );
      return { message: data.message, turnNumber: data.turnNumber, tip: data.tip || undefined };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar mensagem";
      if (!errorMessage?.includes('Limite') && !errorMessage?.includes('Créditos')) {
        toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      } else {
        toast({ title: "Aguarde", description: errorMessage, variant: "destructive" });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const pauseRoleplay = async (roleplayId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await api.put(`/roleplays/${roleplayId}/pause`);
      toast({ title: "Roleplay pausado", description: "Você pode continuar depois de onde parou." });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao pausar roleplay";
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resumeRoleplay = async (roleplayId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await api.put(`/roleplays/${roleplayId}/resume`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao retomar roleplay";
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const finishRoleplay = async (roleplayId: string): Promise<EvaluationResult> => {
    setIsLoading(true);
    try {
      const data = await api.post<EvaluationResult>(`/evaluations/${roleplayId}`);
      toast({ title: "Avaliação concluída!", description: `Score geral: ${data.report.score_overall}/100` });
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Não foi possível avaliar o roleplay";
      toast({ title: "Erro na avaliação", description: errorMessage, variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createRoleplay, getRoleplay, getRoleplayMessages, sendMessage, pauseRoleplay, resumeRoleplay, finishRoleplay, isLoading };
};
