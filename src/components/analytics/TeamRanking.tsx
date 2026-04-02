import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Award } from 'lucide-react';

interface TeamRankingProps {
  ranking: Array<{
    userId: string;
    name: string;
    team?: string;
    totalRoleplays: number;
    averageScore: number;
    bestScore: number;
  }>;
  title?: string;
}

export const TeamRanking = ({ ranking, title = "Ranking da Equipe" }: TeamRankingProps) => {
  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-orange-500" />;
    return <span className="w-5 h-5 flex items-center justify-center text-muted-foreground font-medium">{index + 1}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (ranking.length === 0) {
    return (
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Nenhum dado de ranking disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeRanking = ranking.filter(u => u.totalRoleplays > 0);

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeRanking.slice(0, 10).map((user, index) => (
          <div 
            key={user.userId} 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(index)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground truncate">{user.name}</span>
                {user.team && (
                  <Badge variant="outline" className="text-xs">
                    {user.team}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress 
                  value={user.averageScore * 10} 
                  className="h-1.5 flex-1" 
                />
                <span className="text-xs text-muted-foreground">
                  {user.totalRoleplays} roleplays
                </span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-md text-white font-bold text-sm ${getScoreColor(user.averageScore)}`}>
              {user.averageScore.toFixed(1)}
            </div>
          </div>
        ))}
        {activeRanking.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            Nenhum membro com roleplays no período
          </div>
        )}
      </CardContent>
    </Card>
  );
};
