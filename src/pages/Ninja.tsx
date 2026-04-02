import { useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NinjaCard } from "@/components/ninja/NinjaCard";
import { NinjaAvatar } from "@/components/ninja/NinjaAvatar";
import { useNinjaRank } from "@/hooks/useNinjaRank";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Check, Lock, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Ninja() {
  const { profile } = useAuth();
  const { 
    ranks, 
    progress, 
    currentRank, 
    nextRank, 
    getRequirementsProgress,
    recalculateProgress,
    isRecalculating,
    isLoading 
  } = useNinjaRank();

  const hasAutoRecalculated = useRef(false);

  // Auto-recalculate on first visit (silent, no toast)
  useEffect(() => {
    if (!hasAutoRecalculated.current && !isLoading && !isRecalculating && progress) {
      hasAutoRecalculated.current = true;
      recalculateProgress().catch(console.error);
    }
  }, [isLoading, isRecalculating, progress, recalculateProgress]);

  const requirementsProgress = progress && currentRank
    ? getRequirementsProgress(progress.current_level, {
        totalRoleplays: progress.total_roleplays,
        avgScore: progress.avg_score,
        bestStreak: progress.best_streak,
        totalVouchers: progress.total_vouchers,
      })
    : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const handleRecalculate = async () => {
    try {
      await recalculateProgress();
      toast.success("Estatísticas recalculadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao recalcular estatísticas");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🥷 Meu Perfil Ninja</h1>
            <p className="text-muted-foreground">
              Sua jornada para se tornar uma lenda em vendas
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRecalculate}
            disabled={isRecalculating}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRecalculating && "animate-spin")} />
            Recalcular Stats
          </Button>
        </div>

        {/* Main Ninja Card */}
        <NinjaCard
          userName={profile?.name || "Ninja"}
          progress={progress}
          currentRank={currentRank}
          nextRank={nextRank}
          requirementsProgress={requirementsProgress}
          showRequirements={true}
          variant="full"
        />

        {/* Ninja Journey Timeline */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🗺️</span>
              <span>Jornada Ninja</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-border" />
              
              {/* Rank Items */}
              <div className="space-y-4">
                {ranks.map((rank, index) => {
                  const isCurrentLevel = progress?.current_level === rank.level;
                  const isUnlocked = (progress?.current_level || 1) >= rank.level;
                  const isNext = (progress?.current_level || 1) + 1 === rank.level;
                  
                  return (
                    <div
                      key={rank.id}
                      className={cn(
                        "relative flex items-center gap-4 p-3 rounded-lg transition-all",
                        isCurrentLevel && "bg-primary/10 border border-primary/30",
                        isNext && "bg-muted/50",
                        !isUnlocked && !isNext && "opacity-50"
                      )}
                    >
                      {/* Timeline Node */}
                      <div 
                        className={cn(
                          "relative z-10 flex-shrink-0",
                          isCurrentLevel && "ring-4 ring-primary/20 rounded-full"
                        )}
                      >
                        <NinjaAvatar
                          level={rank.level}
                          emoji={rank.emoji}
                          color={isUnlocked ? rank.color : "#6B7280"}
                          size="md"
                          showGlow={isCurrentLevel}
                        />
                        
                        {/* Status Icon */}
                        <div 
                          className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full",
                            "flex items-center justify-center",
                            isUnlocked ? "bg-green-500" : "bg-muted border border-border"
                          )}
                        >
                          {isUnlocked ? (
                            <Check className="h-3 w-3 text-white" />
                          ) : (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Rank Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className={cn(
                              "font-semibold",
                              isCurrentLevel && "text-primary"
                            )}
                            style={{ color: isUnlocked ? rank.color : undefined }}
                          >
                            {rank.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Nível {rank.level}
                          </span>
                          {isCurrentLevel && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Você está aqui
                            </span>
                          )}
                        </div>
                        
                        {/* Requirements Summary */}
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                          {rank.required_roleplays > 0 && (
                            <span>{rank.required_roleplays} roleplays</span>
                          )}
                          {rank.required_avg_score > 0 && (
                            <span>Média ≥{rank.required_avg_score}</span>
                          )}
                          {rank.required_streak > 0 && (
                            <span>Streak {rank.required_streak}d</span>
                          )}
                          {rank.required_vouchers > 0 && (
                            <span>{rank.required_vouchers} vouchers</span>
                          )}
                        </div>
                      </div>

                      {/* Arrow for next level */}
                      {isNext && (
                        <ChevronRight className="h-5 w-5 text-primary animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              <span>Estatísticas da Jornada</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="XP Total"
                value={progress?.total_xp || 0}
                icon="⚡"
              />
              <StatCard
                label="Níveis Conquistados"
                value={`${progress?.current_level || 1} / 12`}
                icon="🎯"
              />
              <StatCard
                label="Próximo Nível"
                value={nextRank ? `${progress?.current_xp || 0} / ${currentRank?.xp_to_next_level || 0} XP` : "Máximo!"}
                icon="📈"
              />
              <StatCard
                label="Subiu de Nível"
                value={progress?.level_up_at 
                  ? new Date(progress.level_up_at).toLocaleDateString("pt-BR")
                  : "—"
                }
                icon="🏆"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string | number; 
  icon: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/50 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
