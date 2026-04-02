import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Download, TrendingUp, Users, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface ReportStats {
  totalRoleplays: number;
  avgScore: number;
  completionRate: number;
  topPerformers: { name: string; score: number }[];
}

interface RoleplayReport {
  id: string;
  user_name: string;
  segment_name: string;
  profile_name: string;
  score: number;
  status: string;
  created_at: string;
}

const AdminRelatorios = () => {
  const navigate = useNavigate();
  const { role, profile } = useAuth();
  const [stats, setStats] = useState<ReportStats>({
    totalRoleplays: 0,
    avgScore: 0,
    completionRate: 0,
    topPerformers: []
  });
  const [reports, setReports] = useState<RoleplayReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!profile?.organization_id) return;

      setIsLoading(true);
      try {
        // Fetch analytics report from backend (aggregated endpoint)
        const data = await api.post<any>('/analytics/report', {});

        // Build reports list from the backend response
        const roleplays: any[] = data.roleplays || [];
        const reportsList: RoleplayReport[] = roleplays.map((r: any) => ({
          id: r.id,
          user_name: r.userName || 'Usuário',
          segment_name: r.segmentName || '-',
          profile_name: r.clientProfileName || '-',
          score: r.scoreOverall || 0,
          status: r.status,
          created_at: r.createdAt
        }));

        setReports(reportsList);

        // Calculate stats
        const totalRoleplays = roleplays?.length || 0;
        const evaluatedRoleplays = reportsList.filter(r => r.status === 'evaluated');
        const avgScore = evaluatedRoleplays.length > 0
          ? Math.round(evaluatedRoleplays.reduce((acc, r) => acc + r.score, 0) / evaluatedRoleplays.length)
          : 0;
        const completionRate = totalRoleplays > 0
          ? Math.round((evaluatedRoleplays.length / totalRoleplays) * 100)
          : 0;

        // Top performers
        const userScores: Record<string, { total: number; count: number; name: string }> = {};
        evaluatedRoleplays.forEach(r => {
          if (!userScores[r.user_name]) {
            userScores[r.user_name] = { total: 0, count: 0, name: r.user_name };
          }
          userScores[r.user_name].total += r.score;
          userScores[r.user_name].count++;
        });

        const topPerformers = Object.values(userScores)
          .map(u => ({ name: u.name, score: Math.round(u.total / u.count) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        setStats({
          totalRoleplays,
          avgScore,
          completionRate,
          topPerformers
        });
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [profile?.organization_id]);

  // Check admin/coach access
  if (role !== 'admin' && role !== 'coach') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground mb-4">
              Apenas administradores e coaches podem acessar esta página.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'evaluated':
        return <Badge className="bg-green-500/20 text-green-400">Avaliado</Badge>;
      case 'finished':
        return <Badge className="bg-blue-500/20 text-blue-400">Finalizado</Badge>;
      case 'active':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Em Andamento</Badge>;
      case 'paused':
        return <Badge variant="secondary">Pausado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score > 0) return 'text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              <span className="gradient-text">Relatórios</span> e Métricas
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho da equipe
            </p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-scale-in">
          <Card className="bg-card/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalRoleplays}</p>
                  <p className="text-xs text-muted-foreground">Total Roleplays</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgScore}</p>
                  <p className="text-xs text-muted-foreground">Score Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Taxa Conclusão</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.topPerformers[0]?.score || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Melhor Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        {stats.topPerformers.length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.topPerformers.map((performer, index) => (
                  <div
                    key={performer.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold
                      ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : ''}
                      ${index === 1 ? 'bg-gray-400/20 text-gray-400' : ''}
                      ${index === 2 ? 'bg-orange-500/20 text-orange-400' : ''}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">Score médio: {performer.score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roleplays Table */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Roleplays Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-muted-foreground">Carregando...</div>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum roleplay encontrado
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Segmento</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.user_name}</TableCell>
                        <TableCell>{report.segment_name}</TableCell>
                        <TableCell>{report.profile_name}</TableCell>
                        <TableCell>
                          <span className={`font-bold ${getScoreColor(report.score)}`}>
                            {report.score > 0 ? report.score : '-'}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminRelatorios;
