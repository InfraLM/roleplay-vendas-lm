import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Trophy, Target, TrendingUp, CheckCircle, AlertCircle, Lightbulb, RotateCcw, Home, RefreshCw, Ticket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import SalesArenaLogo from "@/components/SalesArenaLogo";
import ThemeToggle from "@/components/ThemeToggle";
import VoucherCelebration from "@/components/vouchers/VoucherCelebration";
import { LevelUpModal } from "@/components/ninja/LevelUpModal";
import { NinjaRankBadge } from "@/components/ninja/NinjaRankBadge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNinjaRank } from "@/hooks/useNinjaRank";
import type { EvaluationResult } from "@/hooks/useRoleplay";
interface ReportData {
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
  pontos_fortes?: string[];
  areas_melhoria?: string[];
  feedback_geral?: string;
  proximos_passos?: string[];
  feedback_competencias?: {
    rapport?: string;
    escuta?: string;
    clareza?: string;
    persuasao?: string;
    objecoes?: string;
    fechamento?: string;
  };
}

const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
};

const getProgressColor = (score: number) => {
  if (score >= 70) return 'bg-success';
  if (score >= 50) return 'bg-warning';
  return 'bg-destructive';
};

const competenceLabels: Record<string, string> = {
  rapport: 'Rapport',
  escuta: 'Escuta Ativa',
  clareza: 'Clareza',
  persuasao: 'Persuasão',
  objecoes: 'Objeções',
  fechamento: 'Fechamento'
};

const RoleplayResults = () => {
  const navigate = useNavigate();
  const { id: roleplayId } = useParams<{ id: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const { 
    updateProgress, 
    levelUpResult, 
    clearLevelUpResult,
    currentRank,
    isUpdating 
  } = useNinjaRank();
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [showVoucherCelebration, setShowVoucherCelebration] = useState(false);
  const [earnedVoucher, setEarnedVoucher] = useState<{ id: string; code: string; expires_at: string } | null>(null);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [ninjaUpdated, setNinjaUpdated] = useState(false);
  
  // Tentar pegar dados passados via state (do finishRoleplay)
  const evaluationFromState = location.state?.evaluation as EvaluationResult | undefined;
  const messageCountFromState = location.state?.messageCount as number | undefined;

  const handleReevaluate = async () => {
    if (!roleplayId) return;
    
    setIsReevaluating(true);
    try {
      await api.post(`/evaluations/${roleplayId}`);

      toast({
        title: "Reavaliação concluída!",
        description: "O relatório foi atualizado com feedbacks detalhados.",
      });

      // Recarregar a página para buscar os novos dados
      window.location.reload();
    } catch (error) {
      console.error('Error reevaluating:', error);
      toast({
        title: "Erro ao reavaliar",
        description: "Não foi possível reavaliar o roleplay. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsReevaluating(false);
    }
  };

  // Verificar se precisa de reavaliação (sem feedback qualitativo)
  const needsReevaluation = report && (
    !report.feedback_competencias || 
    Object.keys(report.feedback_competencias).length === 0 ||
    !report.pontos_fortes || 
    report.pontos_fortes.length === 0
  );

  // Update ninja progress after report loads
  useEffect(() => {
    const updateNinja = async () => {
      if (!report || ninjaUpdated) return;
      
      try {
        // Get message count from state or fetch from database
        let messageCount = messageCountFromState;
        if (!messageCount && roleplayId) {
          const roleplayData = await api.get<{ messageCount?: number }>(`/roleplays/${roleplayId}`);
          messageCount = roleplayData?.messageCount || 10;
        }
        
        const result = await updateProgress({
          score: report.score_overall,
          messageCount: messageCount || 10,
        });
        
        setXpGained(result.xpGained);
        setNinjaUpdated(true);
      } catch (error) {
        console.error('Error updating ninja progress:', error);
      }
    };
    
    updateNinja();
  }, [report, ninjaUpdated, roleplayId, messageCountFromState, updateProgress]);

  useEffect(() => {
    const loadReport = async () => {
      // Se temos dados do state, usar diretamente
      if (evaluationFromState?.report) {
        setReport(evaluationFromState.report);
        // Verificar se ganhou voucher
        if (evaluationFromState.voucher) {
          setEarnedVoucher(evaluationFromState.voucher);
          setShowVoucherCelebration(true);
        }
        setIsLoading(false);
        return;
      }

      // Caso contrário, buscar do banco
      if (!roleplayId) return;

      try {
        const roleplay = await api.get<{ report?: any }>(`/roleplays/${roleplayId}`);
        const data = roleplay?.report;

        if (data) {
          setReport({
            id: data.id,
            score_overall: Number(data.scoreOverall || data.score_overall),
            close_probability: data.closeProbability || data.close_probability,
            scores: data.scores as ReportData['scores'],
            pontos_fortes: (data.pontosFortes || data.pontos_fortes || []) as string[],
            areas_melhoria: (data.areasMelhoria || data.areas_melhoria || []) as string[],
            feedback_geral: data.feedbackGeral || data.feedback_geral || '',
            proximos_passos: (data.proximosPassos || data.proximos_passos || []) as string[],
            feedback_competencias: (data.feedbackCompetencias || data.feedback_competencias || {}) as ReportData['feedback_competencias'],
          });
        }
      } catch (error) {
        console.error('Error loading report:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [roleplayId, evaluationFromState]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-10 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Relatório não encontrado</p>
          <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Voucher Celebration Modal */}
      {showVoucherCelebration && earnedVoucher && (
        <VoucherCelebration 
          voucher={earnedVoucher} 
          onClose={() => setShowVoucherCelebration(false)} 
        />
      )}

      {/* Level Up Modal */}
      {levelUpResult?.leveledUp && (
        <LevelUpModal
          isOpen={true}
          onClose={clearLevelUpResult}
          previousRank={levelUpResult.previousRank}
          newRank={levelUpResult.newRank}
          xpGained={levelUpResult.xpGained}
        />
      )}

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <SalesArenaLogo variant="header" />
          </div>
          <div className="flex items-center gap-4">
            {/* XP Gained Badge */}
            {xpGained && (
              <Badge 
                variant="outline" 
                className="gap-1 border-primary/50 bg-primary/10 text-primary animate-pulse"
              >
                <Zap className="w-3 h-3" />
                +{xpGained} XP
              </Badge>
            )}
            {/* Ninja Rank Badge */}
            {currentRank && (
              <NinjaRankBadge
                level={currentRank.level}
                name={currentRank.name}
                emoji={currentRank.emoji}
                color={currentRank.color}
                variant="compact"
              />
            )}
            {/* Badge de voucher ganho (após fechar modal) */}
            {earnedVoucher && !showVoucherCelebration && (
              <Badge 
                variant="outline" 
                className="gap-1 border-achievement/50 bg-achievement/10 text-achievement cursor-pointer hover:bg-achievement/20"
                onClick={() => setShowVoucherCelebration(true)}
              >
                <Ticket className="w-3 h-3" />
                Voucher ganho!
              </Badge>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Score Principal */}
        <Card className="bg-gradient-card border-primary/20 animate-scale-in">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center bg-primary/5">
                  <div className="text-center">
                    <Trophy className={`w-8 h-8 mx-auto mb-1 ${getScoreColor(report.score_overall)}`} />
                    <span className={`text-4xl font-bold ${getScoreColor(report.score_overall)}`}>
                      {report.score_overall}
                    </span>
                    <span className="text-muted-foreground text-sm">/100</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Resultado do Roleplay
                </h1>
                <p className="text-muted-foreground mb-4">
                  {report.feedback_geral || 'Veja seu desempenho detalhado abaixo'}
                </p>
                
                <div className="flex items-center gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="text-sm">
                      <span className="font-medium">{report.close_probability}%</span>
                      <span className="text-muted-foreground ml-1">prob. de fechamento</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competências */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Competências Avaliadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(report.scores).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{competenceLabels[key] || key}</span>
                  <span className={`text-sm font-bold ${getScoreColor(value)}`}>{value}/100</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getProgressColor(value)}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                {/* Feedback qualitativo por competência */}
                {report.feedback_competencias?.[key as keyof typeof report.feedback_competencias] && (
                  <p className="text-xs text-muted-foreground italic pl-3 border-l-2 border-primary/30 mt-2">
                    {report.feedback_competencias[key as keyof typeof report.feedback_competencias]}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Feedback Detalhado */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pontos Fortes */}
          {report.pontos_fortes && report.pontos_fortes.length > 0 && (
            <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  Pontos Fortes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.pontos_fortes.map((ponto, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{ponto}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Áreas de Melhoria */}
          {report.areas_melhoria && report.areas_melhoria.length > 0 && (
            <Card className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertCircle className="w-5 h-5" />
                  Áreas de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.areas_melhoria.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Próximos Passos */}
        {report.proximos_passos && report.proximos_passos.length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Lightbulb className="w-5 h-5" />
                Próximos Passos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.proximos_passos.map((passo, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">{passo}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Botão Reavaliar - aparece se não há feedbacks qualitativos */}
        {needsReevaluation && (
          <Card className="animate-fade-in border-warning/30 bg-warning/5" style={{ animationDelay: '0.35s' }}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-foreground">Feedback detalhado indisponível</h3>
                  <p className="text-sm text-muted-foreground">
                    Este relatório foi gerado antes da atualização. Clique para reavaliar com feedbacks qualitativos.
                  </p>
                </div>
                <Button 
                  onClick={handleReevaluate} 
                  disabled={isReevaluating}
                  className="gap-2 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isReevaluating ? 'animate-spin' : ''}`} />
                  {isReevaluating ? 'Reavaliando...' : 'Reavaliar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button 
            size="lg"
            className="btn-primary gap-2"
            onClick={() => navigate('/roleplay')}
          >
            <RotateCcw className="w-4 h-4" />
            Nova Simulação
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default RoleplayResults;
