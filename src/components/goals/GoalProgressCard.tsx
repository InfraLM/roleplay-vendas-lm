import { Target, TrendingUp, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GoalProgress } from '@/hooks/useUserGoals';

interface GoalProgressCardProps {
  progress: GoalProgress | null;
  isLoading?: boolean;
}

interface GoalItemProps {
  icon: React.ReactNode;
  label: string;
  current: number;
  goal: number | null;
  suffix?: string;
  isScoreGoal?: boolean;
}

const GoalItem = ({ icon, label, current, goal, suffix = '', isScoreGoal = false }: GoalItemProps) => {
  if (goal === null) return null;

  const percentage = isScoreGoal 
    ? (current >= goal ? 100 : (current / goal) * 100)
    : Math.min((current / goal) * 100, 100);
  
  const isAchieved = isScoreGoal ? current >= goal : current >= goal;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {isScoreGoal ? (
            <span className="text-sm">
              <span className={isAchieved ? 'text-green-500' : 'text-muted-foreground'}>
                {current}
              </span>
              <span className="text-muted-foreground"> (meta: {goal})</span>
            </span>
          ) : (
            <span className="text-sm">
              <span className={isAchieved ? 'text-green-500' : 'text-foreground'}>
                {current}
              </span>
              <span className="text-muted-foreground">/{goal}{suffix}</span>
            </span>
          )}
          {isAchieved ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${isAchieved ? '[&>div]:bg-green-500' : ''}`}
      />
    </div>
  );
};

export const GoalProgressCard = ({ progress, isLoading }: GoalProgressCardProps) => {
  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Minhas Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress?.has_goals) {
    return null;
  }

  const achievedCount = [
    progress.roleplays_goal && progress.roleplays_this_week >= progress.roleplays_goal,
    progress.min_score_goal && progress.avg_score_this_week >= progress.min_score_goal,
    progress.vouchers_goal && progress.vouchers_this_month >= progress.vouchers_goal
  ].filter(Boolean).length;

  const totalGoals = [
    progress.roleplays_goal,
    progress.min_score_goal,
    progress.vouchers_goal
  ].filter(g => g !== null).length;

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Minhas Metas
          </CardTitle>
          <Badge 
            variant={achievedCount === totalGoals ? 'default' : 'secondary'}
            className={achievedCount === totalGoals ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
          >
            {achievedCount}/{totalGoals} atingidas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoalItem
          icon={<Target className="h-4 w-4 text-primary" />}
          label="Roleplays esta semana"
          current={progress.roleplays_this_week}
          goal={progress.roleplays_goal}
        />
        <GoalItem
          icon={<TrendingUp className="h-4 w-4 text-secondary" />}
          label="Score mínimo"
          current={progress.avg_score_this_week}
          goal={progress.min_score_goal}
          isScoreGoal
        />
        <GoalItem
          icon={<Ticket className="h-4 w-4 text-yellow-500" />}
          label="Vouchers este mês"
          current={progress.vouchers_this_month}
          goal={progress.vouchers_goal}
        />
      </CardContent>
    </Card>
  );
};
