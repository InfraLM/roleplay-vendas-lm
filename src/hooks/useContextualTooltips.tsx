import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Play, BarChart3, Ticket, Gift, LucideIcon } from "lucide-react";

export interface ContextualTooltip {
  id: string;
  page: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tips: string[];
}

const PAGE_TOOLTIPS: Record<string, ContextualTooltip> = {
  roleplay: {
    id: 'roleplay',
    page: '/roleplay',
    title: '🎯 Iniciando um Roleplay',
    description: 'Aqui você escolhe como será seu treinamento!',
    icon: Play,
    tips: [
      'Escolha um **produto** para o contexto da venda',
      'Selecione o **perfil do cliente** para definir a dificuldade',
      'Ative o **Modo Guiado** para receber dicas em tempo real durante o roleplay',
    ],
  },
  analytics: {
    id: 'analytics',
    page: '/analytics',
    title: '📊 Analytics & Relatórios',
    description: 'Acompanhe sua evolução com dados detalhados!',
    icon: BarChart3,
    tips: [
      'Use os **filtros de período** para analisar diferentes intervalos de tempo',
      'Ative **Insights de IA** para recomendações personalizadas',
      'Exporte relatórios em **PDF** para compartilhar seu progresso',
    ],
  },
  vouchers: {
    id: 'vouchers',
    page: '/vouchers',
    title: '🎫 Seus Vouchers',
    description: 'Gerencie seus vouchers conquistados!',
    icon: Ticket,
    tips: [
      'Ganhe vouchers ao atingir **nota 75+** em roleplays',
      'Acumule vouchers para trocar por **prêmios exclusivos**',
      'Acompanhe o **status** de cada voucher (ativo, resgatado, expirado)',
    ],
  },
  prizes: {
    id: 'prizes',
    page: '/prizes',
    title: '🎁 Catálogo de Prêmios',
    description: 'Troque seus vouchers por prêmios incríveis!',
    icon: Gift,
    tips: [
      'Cada prêmio exige uma **quantidade específica** de vouchers',
      'Verifique a **disponibilidade** antes de resgatar',
      'Clique em **Resgatar** para trocar seus vouchers pelo prêmio desejado',
    ],
  },
};

const STORAGE_KEY = 'sales-arena-visited-pages';

export function useContextualTooltips() {
  const { user } = useAuth();
  const [visitedPages, setVisitedPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load visited pages from localStorage and database
  useEffect(() => {
    const loadVisitedPages = async () => {
      // First, load from localStorage for instant response
      const localData = localStorage.getItem(STORAGE_KEY);
      const localPages = localData ? JSON.parse(localData) : [];
      setVisitedPages(localPages);

      // Then sync with database if user is logged in
      if (user?.id) {
        try {
          const profile = await api.get<{ visitedPages: string[] | null }>('/users/profile');
          if (profile?.visitedPages) {
            const dbPages = profile.visitedPages;
            const mergedPages = [...new Set([...localPages, ...dbPages])];
            setVisitedPages(mergedPages);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedPages));
          }
        } catch (error) {
          console.error('Error loading visited pages:', error);
        }
      }

      setIsLoading(false);
    };

    loadVisitedPages();
  }, [user?.id]);

  // Get tooltip for current page (if not visited)
  const getTooltipForPage = useCallback((pathname: string): ContextualTooltip | null => {
    if (isLoading) return null;

    // Find matching tooltip
    const tooltipEntry = Object.entries(PAGE_TOOLTIPS).find(([_, tooltip]) => 
      pathname.startsWith(tooltip.page)
    );

    if (!tooltipEntry) return null;

    const [pageId, tooltip] = tooltipEntry;

    // Check if already visited
    if (visitedPages.includes(pageId)) return null;

    return tooltip;
  }, [visitedPages, isLoading]);

  // Mark page as visited
  const markPageAsVisited = useCallback(async (pageId: string) => {
    if (visitedPages.includes(pageId)) return;

    const newVisitedPages = [...visitedPages, pageId];
    setVisitedPages(newVisitedPages);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newVisitedPages));

    // Save to database if user is logged in
    if (user?.id) {
      try {
        await api.put('/users/visited-pages', { visitedPages: newVisitedPages });
      } catch (error) {
        console.error('Error saving visited pages:', error);
      }
    }
  }, [visitedPages, user?.id]);

  // Check if a specific page has been visited
  const hasSeenPage = useCallback((pageId: string): boolean => {
    return visitedPages.includes(pageId);
  }, [visitedPages]);

  // Get total pages and visited count for progress
  const getProgress = useCallback(() => {
    const totalPages = Object.keys(PAGE_TOOLTIPS).length;
    const visitedCount = visitedPages.filter(p => PAGE_TOOLTIPS[p]).length;
    return { total: totalPages, visited: visitedCount };
  }, [visitedPages]);

  return {
    getTooltipForPage,
    markPageAsVisited,
    hasSeenPage,
    getProgress,
    isLoading,
  };
}
