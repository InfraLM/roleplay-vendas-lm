import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  prompt_context: string;
  created_at: string;
  updated_at: string;
}

export interface SegmentFormData {
  name: string;
  description?: string;
  prompt_context: string;
}

export const useSegmentManager = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSegments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<Segment[]>('/segments');
      setSegments(data || []);
    } catch (err: any) {
      console.error('Error fetching segments:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const createSegment = async (data: SegmentFormData): Promise<Segment> => {
    try {
      const newSegment = await api.post<Segment>('/segments', {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        prompt_context: data.prompt_context.trim()
      });

      toast({
        title: "Segmento criado",
        description: `${data.name} foi criado com sucesso`,
      });

      await fetchSegments();
      return newSegment;
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao criar segmento",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateSegment = async (id: string, data: Partial<SegmentFormData>): Promise<Segment> => {
    try {
      const updateData: Record<string, any> = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim() || null;
      if (data.prompt_context !== undefined) updateData.prompt_context = data.prompt_context.trim();

      const updated = await api.put<Segment>(`/segments/${id}`, updateData);

      toast({
        title: "Segmento atualizado",
        description: "Alterações salvas com sucesso",
      });

      await fetchSegments();
      return updated;
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao atualizar segmento",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteSegment = async (id: string): Promise<void> => {
    try {
      await api.delete(`/segments/${id}`);

      toast({
        title: "Segmento excluído",
        description: "Segmento removido com sucesso",
      });

      await fetchSegments();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao excluir segmento",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    segments,
    isLoading,
    error,
    createSegment,
    updateSegment,
    deleteSegment,
    refetch: fetchSegments
  };
};
