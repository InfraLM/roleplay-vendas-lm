import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer
} from 'recharts';
import { Target, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CompetencyRadarProps {
  data?: Record<string, { start: number; end: number; change: number }>;
  title?: string;
}

const competencyLabels: Record<string, string> = {
  rapportBuilding: 'Rapport',
  objectionHandling: 'Objeções',
  closingSkills: 'Fechamento',
  productKnowledge: 'Produto',
  emotionalIntelligence: 'Inteligência Emocional',
  rapport: 'Rapport',
  escuta: 'Escuta',
  clareza: 'Clareza',
  persuasao: 'Persuasão',
  objecoes: 'Objeções',
  fechamento: 'Fechamento',
};

export const CompetencyRadar = ({ data, title = "Competências" }: CompetencyRadarProps) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Dados insuficientes para o radar
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(data).map(([key, values]) => ({
    competency: competencyLabels[key] || key,
    atual: typeof values === 'object' ? values.end : values,
    anterior: typeof values === 'object' ? values.start : 0,
    fullMark: 10,
  }));

  // Encontrar competência com maior evolução positiva
  const bestEvolution = Object.entries(data).reduce((best, [key, values]) => {
    const change = typeof values === 'object' ? values.change : 0;
    if (change > best.change) {
      return { key, change, label: competencyLabels[key] || key };
    }
    return best;
  }, { key: '', change: 0, label: '' });

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
          
          {bestEvolution.change > 0 && (
            <Badge 
              variant="outline" 
              className="bg-green-500/10 text-green-500 border-green-500/30 flex items-center gap-1"
            >
              <TrendingUp className="w-3 h-3" />
              {bestEvolution.label}: +{bestEvolution.change.toFixed(1)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="competency" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <PolarRadiusAxis 
              domain={[0, 10]} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <Radar
              name="Período Atual"
              dataKey="atual"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
            {chartData[0]?.anterior > 0 && (
              <Radar
                name="Período Anterior"
                dataKey="anterior"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.1}
              />
            )}
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
