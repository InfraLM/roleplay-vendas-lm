import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Target, 
  TrendingUp, 
  Trophy, 
  Ticket,
  Clock,
  Calendar,
  MessageSquare,
  Eye,
  Trash2,
  Filter,
  X,
  Users,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useAuth } from "@/hooks/useAuth";
import { useStreak } from "@/hooks/useStreak";
import { useUserGoals } from "@/hooks/useUserGoals";
import { useNinjaRank } from "@/hooks/useNinjaRank";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StreakCard } from "@/components/StreakCard";
import { GoalProgressCard } from "@/components/goals/GoalProgressCard";
import { NinjaCard } from "@/components/ninja/NinjaCard";
import { NinjaRankBadge } from "@/components/ninja/NinjaRankBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalRoleplays: number;
  averageScore: number;
  bestScore: number;
  vouchersCount: number;
  recentRoleplays: Array<{
    id: string;
    segment_name: string;
    created_at: string;
    score: number | null;
  }>;
}

interface MemberRoleplayData {
  id: string;
  created_at: string;
  segment_id: string;
  profile_id: string;
  score: number | null;
}

interface TeamMember {
  user_id: string;
  name: string;
  roleplays: MemberRoleplayData[];
  roleplay_count: number;
  avg_score: number;
  best_score: number;
  ninja_level?: number;
}

interface NinjaRank {
  level: number;
  name: string;
  emoji: string;
  color: string;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
}

interface HistoryRoleplay {
  id: string;
  segment_name: string;
  segment_description: string | null;
  client_name: string;
  created_at: string;
  message_count: number;
  message_limit: number;
  status: "active" | "finished" | "aborted" | "paused";
  score: number | null;
}

interface ClientProfile {
  id: string;
  display_name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();
  const { currentStreak, longestStreak, isLoading: streakLoading, getStreakMessage } = useStreak();
  const { progress: goalProgress, isLoading: goalsLoading } = useUserGoals();
  const { progress: ninjaProgress, currentRank, nextRank, isLoading: ninjaLoading } = useNinjaRank();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRoleplays: 0,
    averageScore: 0,
    bestScore: 0,
    vouchersCount: 0,
    recentRoleplays: [],
  });
  const [teamRanking, setTeamRanking] = useState<TeamMember[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [periodFilter, setPeriodFilter] = useState("7d");
  
  // Histórico
  const [allRoleplays, setAllRoleplays] = useState<HistoryRoleplay[]>([]);
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  
  // Paginação do histórico
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Ranking filters
  const [rankingPeriodFilter, setRankingPeriodFilter] = useState("all");
  const [rankingSegmentFilter, setRankingSegmentFilter] = useState("all");
  const [rankingClientFilter, setRankingClientFilter] = useState("all");
  const [rankingMemberFilter, setRankingMemberFilter] = useState("all");

  // Ninja ranks data
  const [ninjaRanks, setNinjaRanks] = useState<NinjaRank[]>([]);

  // Helper function to get ninja rank by level
  const getNinjaRank = (level: number) => {
    return ninjaRanks.find(r => r.level === level) || null;
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, periodFilter]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch data from API endpoints in parallel
      const [
        roleplaysData,
        vouchersData,
        segmentsData,
        clientProfilesData,
        ninjaRanksData,
      ] = await Promise.all([
        api.get<any[]>('/roleplays/mine'),
        api.get<any[]>('/vouchers'),
        api.get<any[]>('/segments'),
        api.get<any[]>('/client-profiles'),
        api.get<any[]>('/ninja/ranks'),
      ]);

      const roleplays = roleplaysData || [];

      // Build scoresMap from roleplays that include report data
      const scoresMap = new Map<string, number>();
      roleplays.forEach((r: any) => {
        if (r.report?.scoreOverall != null) {
          scoresMap.set(r.id, Number(r.report.scoreOverall));
        }
      });

      // Map history roleplays with scores
      const historyRoleplays: HistoryRoleplay[] = roleplays.map((r: any) => ({
        id: r.id,
        segment_name: r.segmentName || r.segment?.name || "Segmento",
        segment_description: r.segmentDescription || r.segment?.description || null,
        client_name: r.clientProfileName || r.clientProfile?.displayName || "Cliente",
        created_at: r.createdAt,
        message_count: r.messageCount,
        message_limit: r.messageLimit,
        status: r.status as HistoryRoleplay["status"],
        score: scoresMap.get(r.id) || null,
      }));

      setAllRoleplays(historyRoleplays);
      setClientProfiles((clientProfilesData || []).map((cp: any) => ({
        id: cp.id,
        display_name: cp.displayName || cp.display_name,
      })));

      // Map ninja ranks
      setNinjaRanks((ninjaRanksData || []).map((nr: any) => ({
        level: nr.level,
        name: nr.name,
        emoji: nr.emoji,
        color: nr.color,
      })));

      // Fetch team ranking if admin/coach
      if ((role === "admin" || role === "coach") && profile?.organization_id) {
        try {
          const teamMembersData = await api.get<any[]>('/team/members');
          const ninjaProgressData = await api.get<any[]>('/ninja/progress');

          const ninjaProgressMap = new Map(
            (ninjaProgressData || []).map((p: any) => [p.userId, p.currentLevel])
          );

          if (teamMembersData) {
            const teamStats: TeamMember[] = teamMembersData.map((member: any) => {
              const memberRoleplays: MemberRoleplayData[] = (member.roleplays || []).map((r: any) => ({
                id: r.id,
                created_at: r.createdAt,
                segment_id: r.segmentId,
                profile_id: r.profileId,
                score: r.scoreOverall != null ? Number(r.scoreOverall) : null,
              }));

              const scores = memberRoleplays.map(r => r.score).filter((s): s is number => s !== null && s > 0);
              const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
              const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

              return {
                user_id: member.userId,
                name: member.name,
                roleplays: memberRoleplays,
                roleplay_count: memberRoleplays.length,
                avg_score: Math.round(avgScore * 10) / 10,
                best_score: Math.round(bestScore * 10) / 10,
                ninja_level: ninjaProgressMap.get(member.userId) || undefined,
              };
            });

            setTeamRanking(teamStats.sort((a, b) => b.avg_score - a.avg_score));
          }
        } catch (teamError) {
          console.error("Error fetching team data:", teamError);
        }
      }

      // Calculate stats using the scoresMap
      const allScores = Array.from(scoresMap.values()).filter(s => s > 0);
      const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
      const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0;

      const recentRoleplays = roleplays.slice(0, 5).map((r: any) => ({
        id: r.id,
        segment_name: r.segmentName || r.segment?.name || "Segmento",
        created_at: r.createdAt,
        score: scoresMap.get(r.id) || null,
      }));

      setStats({
        totalRoleplays: roleplays.length,
        averageScore: Math.round(avgScore * 10) / 10,
        bestScore: Math.round(bestScore * 10) / 10,
        vouchersCount: vouchersData?.length || 0,
        recentRoleplays,
      });

      setSegments((segmentsData || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || null,
      })));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statsCards = [
    { 
      label: "Total Roleplays", 
      value: stats.totalRoleplays, 
      icon: Target, 
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    { 
      label: "Média Geral", 
      value: stats.averageScore, 
      icon: TrendingUp, 
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    { 
      label: "Melhor Nota", 
      value: stats.bestScore, 
      icon: Trophy, 
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    { 
      label: "Vouchers", 
      value: stats.vouchersCount, 
      icon: Ticket, 
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    },
  ];

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}º`;
  };

  // Status labels with styles
  const statusLabels: Record<string, { label: string; className: string }> = {
    active: { label: "Em Andamento", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    finished: { label: "Finalizado", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    aborted: { label: "Cancelado", className: "bg-destructive/20 text-destructive border-destructive/30" },
    paused: { label: "Pausado", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  };

  // Filter history roleplays
  const filteredRoleplays = allRoleplays.filter(roleplay => {
    if (statusFilter !== "all" && roleplay.status !== statusFilter) return false;
    if (segmentFilter !== "all" && roleplay.segment_name !== segmentFilter) return false;
    if (clientFilter !== "all" && roleplay.client_name !== clientFilter) return false;
    return true;
  });

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, segmentFilter, clientFilter]);

  const clearFilters = () => {
    setStatusFilter("all");
    setSegmentFilter("all");
    setClientFilter("all");
    setCurrentPage(1);
  };

  // Paginação
  const totalPages = Math.ceil(filteredRoleplays.length / ITEMS_PER_PAGE);
  const paginatedRoleplays = filteredRoleplays.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Gerar números de página com ellipsis
  const generatePageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    if (current <= 3) {
      return [1, 2, 3, 4, 5, 'ellipsis', total];
    }
    
    if (current >= total - 2) {
      return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
    }
    
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
  };

  const handleDeleteRoleplay = async (roleplayId: string) => {
    if (!confirm("Tem certeza que deseja excluir este roleplay?")) return;

    try {
      await api.delete(`/roleplays/${roleplayId}`);
      setAllRoleplays(prev => prev.filter(r => r.id !== roleplayId));
    } catch (error) {
      console.error("Error deleting roleplay:", error);
    }
  };

  // Get unique segments for filter
  const uniqueSegments = [...new Set(allRoleplays.map(r => r.segment_name))];
  const uniqueClients = [...new Set(allRoleplays.map(r => r.client_name))];

  // Helper function to filter by period
  const filterByPeriod = (dateStr: string, period: string): boolean => {
    if (period === "all") return true;
    
    const roleplayDate = new Date(dateStr);
    const now = new Date();
    
    const daysMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90
    };
    
    const days = daysMap[period];
    if (!days) return true;
    
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return roleplayDate >= cutoffDate;
  };

  // Helper functions to calculate stats from roleplays
  const calculateAvgScore = (roleplays: MemberRoleplayData[]): number => {
    const scores = roleplays.map(r => r.score).filter((s): s is number => s !== null && s > 0);
    return scores.length > 0 
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 
      : 0;
  };

  const calculateBestScore = (roleplays: MemberRoleplayData[]): number => {
    const scores = roleplays.map(r => r.score).filter((s): s is number => s !== null && s > 0);
    return scores.length > 0 ? Math.round(Math.max(...scores) * 10) / 10 : 0;
  };

  // Filter ranking with all filters applied and recalculate stats
  const filteredTeamRanking = useMemo(() => {
    return teamRanking
      .map(member => {
        // Apply filters to each member's roleplays
        const filteredRoleplays = member.roleplays.filter(roleplay => {
          // Period filter
          if (!filterByPeriod(roleplay.created_at, rankingPeriodFilter)) return false;
          
          // Segment filter
          if (rankingSegmentFilter !== "all" && roleplay.segment_id !== rankingSegmentFilter) return false;
          
          // Client (profile) filter
          if (rankingClientFilter !== "all" && roleplay.profile_id !== rankingClientFilter) return false;
          
          return true;
        });

        // Recalculate stats based on filtered roleplays
        return {
          user_id: member.user_id,
          name: member.name,
          roleplays: filteredRoleplays,
          roleplay_count: filteredRoleplays.filter(r => r.score !== null).length,
          avg_score: calculateAvgScore(filteredRoleplays),
          best_score: calculateBestScore(filteredRoleplays),
          ninja_level: member.ninja_level,
        };
      })
      // Filter by specific member
      .filter(member => {
        if (rankingMemberFilter !== "all" && member.user_id !== rankingMemberFilter) return false;
        return true;
      })
      // Only show members with roleplays in the filtered period
      .filter(m => m.roleplay_count > 0)
      // Sort by average score
      .sort((a, b) => b.avg_score - a.avg_score);
  }, [teamRanking, rankingPeriodFilter, rankingSegmentFilter, rankingClientFilter, rankingMemberFilter]);

  const clearRankingFilters = () => {
    setRankingPeriodFilter("all");
    setRankingSegmentFilter("all");
    setRankingClientFilter("all");
    setRankingMemberFilter("all");
  };

  const hasRankingFilters = rankingPeriodFilter !== "all" || rankingSegmentFilter !== "all" ||
    rankingClientFilter !== "all" || rankingMemberFilter !== "all";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-background">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-background">
                Histórico
              </TabsTrigger>
              <TabsTrigger value="ranking" className="data-[state=active]:bg-background">
                Ranking da Equipe
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[140px] bg-muted/50 border-border/50">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="all">Todo período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Stats Cards - 5 columns on large screens */}
            <div data-onboarding="stats-cards" className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {statsCards.map((stat, index) => (
                <Card key={index} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          {stat.label}
                        </p>
                        {isLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        )}
                      </div>
                      <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* Streak Card */}
              <StreakCard
                currentStreak={currentStreak}
                longestStreak={longestStreak}
                message={getStreakMessage()}
                isLoading={streakLoading}
              />
            </div>

            {/* Goal Progress Card - only shows if user has goals */}
            <GoalProgressCard progress={goalProgress} isLoading={goalsLoading} />

            {/* Ninja Progress Card */}
            {!ninjaLoading && (
              <NinjaCard
                userName={profile?.name || "Usuário"}
                progress={ninjaProgress}
                currentRank={currentRank}
                nextRank={nextRank}
                variant="compact"
                onClick={() => navigate("/ninja")}
              />
            )}

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Roleplays */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Roleplays Recentes</CardTitle>
                      <CardDescription>Seus últimos treinamentos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : stats.recentRoleplays.length > 0 ? (
                    <div className="space-y-2">
                      {stats.recentRoleplays.map((roleplay) => (
                        <div
                          key={roleplay.id}
                          onClick={() => navigate(`/roleplay/${roleplay.id}/results`)}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {roleplay.segment_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(roleplay.created_at), "dd MMM yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          {roleplay.score !== null && (
                            <Badge 
                              variant="outline" 
                              className={`ml-2 ${
                                roleplay.score >= 8 
                                  ? "text-green-500 border-green-500/30" 
                                  : roleplay.score >= 6 
                                  ? "text-yellow-500 border-yellow-500/30" 
                                  : "text-red-500 border-red-500/30"
                              }`}
                            >
                              {roleplay.score}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">
                      Nenhum roleplay realizado ainda
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Team Ranking */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <div>
                      <CardTitle className="text-lg">Ranking da Equipe</CardTitle>
                      <CardDescription>Top performers desta semana</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : teamRanking.length > 0 ? (
                    <div className="space-y-2">
                      {teamRanking.map((member, index) => (
                        <div
                          key={member.user_id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getMedalEmoji(index)}</span>
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{member.name}</p>
                                {member.ninja_level && getNinjaRank(member.ninja_level) && (
                                  <NinjaRankBadge
                                    level={getNinjaRank(member.ninja_level)!.level}
                                    name={getNinjaRank(member.ninja_level)!.name}
                                    emoji={getNinjaRank(member.ninja_level)!.emoji}
                                    color={getNinjaRank(member.ninja_level)!.color}
                                    variant="icon"
                                  />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {member.roleplay_count} roleplay{member.roleplay_count !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-primary border-primary/30">
                            {member.avg_score}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">
                      Dados de ranking não disponíveis
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Start Training Section */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Iniciar Novo Treinamento</CardTitle>
                <CardDescription>
                  Escolha um segmento e perfil de cliente para praticar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : segments.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segments.slice(0, 6).map((segment, index) => {
                      const colors = [
                        "border-l-yellow-500",
                        "border-l-blue-500",
                        "border-l-pink-500",
                        "border-l-green-500",
                        "border-l-purple-500",
                        "border-l-orange-500",
                      ];
                      return (
                        <Card
                          key={segment.id}
                          onClick={() => navigate("/roleplay")}
                          className={`cursor-pointer bg-muted/30 border-l-4 ${colors[index % colors.length]} hover:bg-muted/50 transition-colors`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Target className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium text-foreground">{segment.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {segment.description || "Clique para iniciar"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6">
                    Nenhum segmento disponível
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0 space-y-4">
            {/* Filters */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filtros</span>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px] bg-muted/50 border-border/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="active">Em Andamento</SelectItem>
                      <SelectItem value="finished">Finalizado</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="aborted">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                    <SelectTrigger className="w-[180px] bg-muted/50 border-border/50">
                      <SelectValue placeholder="Segmentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Segmentos</SelectItem>
                      {uniqueSegments.map(segment => (
                        <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className="w-[180px] bg-muted/50 border-border/50">
                      <SelectValue placeholder="Clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Clientes</SelectItem>
                      {uniqueClients.map(client => (
                        <SelectItem key={client} value={client}>{client}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(statusFilter !== "all" || segmentFilter !== "all" || clientFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Roleplay List */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredRoleplays.length > 0 ? (
              <div className="space-y-3">
                {paginatedRoleplays.map((roleplay) => (
                  <Card key={roleplay.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {roleplay.segment_name}
                              {roleplay.segment_description && (
                                <span className="text-muted-foreground font-normal"> - {roleplay.segment_description}</span>
                              )}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={statusLabels[roleplay.status]?.className}
                            >
                              {statusLabels[roleplay.status]?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Cliente: {roleplay.client_name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(roleplay.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {roleplay.message_count}/{roleplay.message_limit} mensagens
                            </span>
                            {roleplay.score !== null && (
                              <Badge 
                                variant="outline" 
                                className={`${
                                  roleplay.score >= 80 
                                    ? "text-green-500 border-green-500/30" 
                                    : roleplay.score >= 60 
                                    ? "text-yellow-500 border-yellow-500/30" 
                                    : "text-red-500 border-red-500/30"
                                }`}
                              >
                                Nota: {roleplay.score}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {(roleplay.status === "paused" || roleplay.status === "active") && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => navigate(`/roleplay/${roleplay.id}`)}
                              className="bg-primary hover:bg-primary/90"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Continuar
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                          onClick={() => navigate(`/roleplay/${roleplay.id}/results`)}
                            className="text-primary border-primary/30 hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Conversa
                          </Button>
                          {role === "admin" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRoleplay(roleplay.id)}
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredRoleplays.length)} de {filteredRoleplays.length} roleplays
                    </p>
                    
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {generatePageNumbers(currentPage, totalPages).map((page, idx) => (
                          <PaginationItem key={idx}>
                            {page === 'ellipsis' ? (
                              <PaginationEllipsis />
                            ) : (
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            ) : (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="py-12">
                  <p className="text-muted-foreground text-center">
                    {allRoleplays.length === 0 
                      ? "Nenhum roleplay realizado ainda" 
                      : "Nenhum roleplay encontrado com os filtros selecionados"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ranking" className="mt-0 space-y-4">
            {/* Filters */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filtros</span>
                  </div>
                  
                  <Select value={rankingPeriodFilter} onValueChange={setRankingPeriodFilter}>
                    <SelectTrigger className="w-[150px] bg-muted/50 border-border/50">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo Período</SelectItem>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="90d">Últimos 90 dias</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={rankingSegmentFilter} onValueChange={setRankingSegmentFilter}>
                    <SelectTrigger className="w-[180px] bg-muted/50 border-border/50">
                      <SelectValue placeholder="Segmentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Segmentos</SelectItem>
                      {segments.map(segment => (
                        <SelectItem key={segment.id} value={segment.id}>{segment.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={rankingClientFilter} onValueChange={setRankingClientFilter}>
                    <SelectTrigger className="w-[180px] bg-muted/50 border-border/50">
                      <SelectValue placeholder="Clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Clientes</SelectItem>
                      {clientProfiles.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={rankingMemberFilter} onValueChange={setRankingMemberFilter}>
                    <SelectTrigger className="w-[180px] bg-muted/50 border-border/50">
                      <SelectValue placeholder="Membros" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Membros</SelectItem>
                      {teamRanking.map(member => (
                        <SelectItem key={member.user_id} value={member.user_id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasRankingFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRankingFilters}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ranking Card */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-yellow-500" />
                  <div>
                    <CardTitle className="text-lg">Ranking Completo da Equipe</CardTitle>
                    <CardDescription>Performance de todos os membros da equipe</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredTeamRanking.length > 0 ? (
                  <div className="space-y-2">
                    {filteredTeamRanking.map((member, index) => (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            index < 3 ? "bg-yellow-500/20" : "bg-muted"
                          }`}>
                            {index < 3 ? (
                              <Trophy className={`h-5 w-5 ${
                                index === 0 ? "text-yellow-500" : 
                                index === 1 ? "text-gray-400" : 
                                "text-orange-500"
                              }`} />
                            ) : (
                              <span className="text-muted-foreground font-medium">{index + 1}º</span>
                            )}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-primary">{member.name}</p>
                              {member.ninja_level && getNinjaRank(member.ninja_level) && (
                                <NinjaRankBadge
                                  level={getNinjaRank(member.ninja_level)!.level}
                                  name={getNinjaRank(member.ninja_level)!.name}
                                  emoji={getNinjaRank(member.ninja_level)!.emoji}
                                  color={getNinjaRank(member.ninja_level)!.color}
                                  variant="compact"
                                />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Melhor: {member.best_score} • {member.roleplay_count} roleplay{member.roleplay_count !== 1 ? "s" : ""} completado{member.roleplay_count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            member.avg_score >= 80 ? "bg-green-500/20" :
                            member.avg_score >= 60 ? "bg-yellow-500/20" :
                            "bg-red-500/20"
                          }`}>
                            <span className={`text-xl font-bold ${
                              member.avg_score >= 80 ? "text-green-500" :
                              member.avg_score >= 60 ? "text-yellow-500" :
                              "text-red-500"
                            }`}>
                              {member.avg_score}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">média</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-12">
                    {role === "admin" || role === "coach" 
                      ? hasRankingFilters 
                        ? "Nenhum membro encontrado com os filtros selecionados"
                        : "Nenhum membro com roleplays realizados" 
                      : "Disponível apenas para administradores e coaches"}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
