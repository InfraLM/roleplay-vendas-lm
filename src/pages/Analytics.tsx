import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics, AnalyticsReport } from '@/hooks/useAnalytics';
import { useSegments } from '@/hooks/useSegments';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { PerformanceChart } from '@/components/analytics/PerformanceChart';
import { CompetencyRadar } from '@/components/analytics/CompetencyRadar';
import { TeamRanking } from '@/components/analytics/TeamRanking';
import { SegmentBreakdown } from '@/components/analytics/SegmentBreakdown';
import { AiInsightsCard } from '@/components/analytics/AiInsightsCard';
import LiberdadeMedicaLogo from '@/components/LiberdadeMedicaLogo';
import ThemeToggle from '@/components/ThemeToggle';
import {
  BarChart3, TrendingUp, Users, Download, 
  Target, Award, ArrowLeft, RefreshCw, Sparkles
} from 'lucide-react';

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, role } = useAuth();
  const { generateReport, exportToPdf, isLoading, canViewTeamData } = useAnalytics();
  const { segments } = useSegments();

  const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>();
  const [includeAiInsights, setIncludeAiInsights] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const handleGenerateReport = async () => {
    if (!dateRange.from || !dateRange.to) return;

    const result = await generateReport(
      activeTab,
      {
        dateFrom: format(dateRange.from, 'yyyy-MM-dd'),
        dateTo: format(dateRange.to, 'yyyy-MM-dd'),
        segmentId: selectedSegmentId,
      },
      includeAiInsights
    );

    if (result) {
      setReport(result);
      toast({
        title: 'Relatório gerado',
        description: 'Os dados foram atualizados com sucesso.',
      });
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;

    const url = await exportToPdf(report);
    if (url) {
      toast({
        title: 'PDF gerado',
        description: 'Uma nova janela foi aberta para impressão.',
      });
    }
  };

  useEffect(() => {
    handleGenerateReport();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <LiberdadeMedicaLogo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleExportPdf} disabled={!report || isLoading}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            <span className="gradient-text">Analytics</span> & Relatórios
          </h1>
          <p className="text-muted-foreground">
            Análise detalhada de performance e evolução
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-card/50">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <DateRangePicker 
                date={dateRange} 
                onDateChange={(range) => setDateRange(range || { from: undefined, to: undefined })}
              />

              <Select 
                value={selectedSegmentId || 'all'} 
                onValueChange={(value) => setSelectedSegmentId(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Produtos</SelectItem>
                  {segments?.map((seg) => (
                    <SelectItem key={seg.id} value={seg.id}>
                      {seg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  id="ai-insights"
                  checked={includeAiInsights}
                  onCheckedChange={setIncludeAiInsights}
                />
                <Label htmlFor="ai-insights" className="flex items-center gap-1 cursor-pointer">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Insights IA
                </Label>
              </div>

              <Button onClick={handleGenerateReport} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'individual' | 'team')}>
          <TabsList className="mb-6">
            <TabsTrigger value="individual">
              <Target className="w-4 h-4 mr-2" />
              Individual
            </TabsTrigger>
            {canViewTeamData && (
              <TabsTrigger value="team">
                <Users className="w-4 h-4 mr-2" />
                Equipe
              </TabsTrigger>
            )}
          </TabsList>

          {/* Individual Report */}
          <TabsContent value="individual">
            {isLoading ? (
              <AnalyticsSkeleton />
            ) : report?.type === 'individual' ? (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    title="Total Roleplays" 
                    value={report.summary.totalRoleplays || 0}
                    icon={<BarChart3 className="w-5 h-5 text-primary" />}
                  />
                  <StatCard 
                    title="Média Geral" 
                    value={report.summary.averageScore || 0}
                    icon={<TrendingUp className="w-5 h-5 text-primary" />}
                  />
                  <StatCard 
                    title="Melhor Nota" 
                    value={report.summary.bestScore || 0}
                    icon={<Award className="w-5 h-5 text-green-500" />}
                  />
                  <StatCard 
                    title="Evolução" 
                    value={`${report.summary.improvement > 0 ? '+' : ''}${report.summary.improvement}`}
                    icon={<TrendingUp className="w-5 h-5 text-primary" />}
                    trend={report.summary.improvement}
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PerformanceChart data={report.evolution || []} />
                  <CompetencyRadar data={report.competencyEvolution} title="Evolução das Competências" />
                </div>

                {/* Analysis Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SegmentBreakdown 
                    data={report.segmentAnalysis || []} 
                    title="Por Produto"
                    labelKey="segment"
                  />
                  <SegmentBreakdown 
                    data={report.profileAnalysis || []} 
                    title="Por Perfil de Cliente"
                    labelKey="profile"
                  />
                </div>

                {/* AI Insights */}
                {report.aiInsights && (
                  <AiInsightsCard insights={report.aiInsights} />
                )}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          {/* Team Report */}
          <TabsContent value="team">
            {isLoading ? (
              <AnalyticsSkeleton />
            ) : report?.type === 'team' ? (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    title="Total Membros" 
                    value={report.summary.totalMembers || 0}
                    icon={<Users className="w-5 h-5 text-primary" />}
                  />
                  <StatCard 
                    title="Membros Ativos" 
                    value={report.summary.activeMembers || 0}
                    icon={<Target className="w-5 h-5 text-green-500" />}
                  />
                  <StatCard 
                    title="Total Roleplays" 
                    value={report.summary.totalRoleplays || 0}
                    icon={<BarChart3 className="w-5 h-5 text-primary" />}
                  />
                  <StatCard 
                    title="Média da Equipe" 
                    value={report.summary.teamAverageScore || 0}
                    icon={<TrendingUp className="w-5 h-5 text-primary" />}
                  />
                </div>

                {/* Ranking */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TeamRanking ranking={report.ranking || []} />
                  <SegmentBreakdown 
                    data={(report.teamAnalysis || []).map(t => ({
                      segment: t.team,
                      count: t.totalRoleplays,
                      averageScore: t.averageScore,
                    }))} 
                    title="Por Time"
                    labelKey="segment"
                  />
                </div>

                {/* AI Insights */}
                {report.aiInsights && (
                  <AiInsightsCard insights={report.aiInsights} />
                )}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Helper Components
const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode;
  trend?: number;
}) => (
  <Card className="bg-card/50">
    <CardContent className="pt-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend !== undefined && trend !== 0 && (
            <p className={`text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} vs período anterior
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-muted">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-[300px] rounded-lg" />
      <Skeleton className="h-[300px] rounded-lg" />
    </div>
  </div>
);

const EmptyState = () => (
  <Card className="bg-card/50">
    <CardContent className="py-12 text-center">
      <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">
        Nenhum dado disponível para o período selecionado
      </p>
    </CardContent>
  </Card>
);

export default Analytics;
