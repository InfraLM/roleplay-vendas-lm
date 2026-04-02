import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

export interface PerformanceSnapshot {
  snapshot_date: string;
  roleplays_count: number;
  average_score: number;
  best_score: number;
  vouchers_earned: number;
  rapport_avg: number;
  escuta_avg: number;
  clareza_avg: number;
  persuasao_avg: number;
  objecoes_avg: number;
  fechamento_avg: number;
}

export interface AnalyticsReport {
  type: 'individual' | 'team' | 'comparison';
  userName?: string;
  userTeam?: string;
  organizationId?: string;
  period: { from: string; to: string };
  summary: {
    totalRoleplays?: number;
    totalMembers?: number;
    activeMembers?: number;
    averageScore?: number;
    teamAverageScore?: number;
    bestScore?: number;
    worstScore?: number;
    improvement: number;
  };
  evolution?: Array<{ date: string; score: number; roleplays: number }>;
  ranking?: Array<{
    userId: string;
    name: string;
    team?: string;
    totalRoleplays: number;
    averageScore: number;
    bestScore: number;
  }>;
  segmentAnalysis?: Array<{ segment: string; count: number; averageScore: number }>;
  profileAnalysis?: Array<{ profile: string; count: number; averageScore: number }>;
  teamAnalysis?: Array<{ team: string; members: number; totalRoleplays: number; averageScore: number }>;
  topPerformers?: Array<any>;
  needsImprovement?: Array<any>;
  recentRoleplays?: Array<any>;
  aiInsights?: string;
  competencyEvolution?: Record<string, { start: number; end: number; change: number }>;
}

export interface AnalyticsFilters {
  userId?: string;
  userIds?: string[];
  dateFrom: string;
  dateTo: string;
  segmentId?: string;
}

export const useAnalytics = () => {
  const { user, role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async (
    type: 'individual' | 'team' | 'comparison',
    filters: AnalyticsFilters,
    includeAiInsights: boolean = false
  ): Promise<AnalyticsReport | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.post<{ report: AnalyticsReport }>('/analytics/report', {
        type,
        userId: filters.userId || user?.id,
        userIds: filters.userIds,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        segmentId: filters.segmentId,
        includeAiInsights,
      });

      return data.report;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar relatório';
      setError(message);
      console.error('Error generating report:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const exportToPdf = useCallback(async (reportData: AnalyticsReport): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.post<{ html: string }>('/analytics/pdf', { reportData });

      // Criar blob e download
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Abrir em nova janela para impressão/PDF
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao exportar PDF';
      setError(message);
      console.error('Error exporting PDF:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSavedReports = useCallback(async () => {
    const data = await api.get<any[]>('/analytics/saved');
    return data || [];
  }, []);

  const canViewTeamData = role === 'admin' || role === 'coach';

  return {
    isLoading,
    error,
    generateReport,
    exportToPdf,
    fetchSavedReports,
    canViewTeamData,
  };
};
