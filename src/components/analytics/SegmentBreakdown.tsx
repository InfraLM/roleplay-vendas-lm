import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface SegmentBreakdownProps {
  data: Array<{
    segment?: string;
    profile?: string;
    count: number;
    averageScore: number;
  }>;
  title?: string;
  labelKey?: 'segment' | 'profile';
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)', // green
  'hsl(38, 92%, 50%)', // yellow
  'hsl(0, 84%, 60%)', // red
  'hsl(262, 83%, 58%)', // purple
  'hsl(199, 89%, 48%)', // cyan
];

export const SegmentBreakdown = ({ 
  data, 
  title = "Distribuição",
  labelKey = 'segment' 
}: SegmentBreakdownProps) => {
  const chartData = data.map((item, index) => ({
    name: item[labelKey] || 'Desconhecido',
    value: item.count,
    score: item.averageScore,
    color: COLORS[index % COLORS.length],
  }));

  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  if (data.length === 0) {
    return (
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Sem dados disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Pie Chart */}
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  `${value} (${((value / totalCount) * 100).toFixed(0)}%)`,
                  props.payload.name
                ]}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{
                color: 'hsl(var(--foreground))',
              }}
              itemStyle={{
                color: 'hsl(var(--foreground))',
              }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* List with scores */}
          <div className="space-y-2">
            {data.slice(0, 5).map((item, index) => (
              <div key={item[labelKey] || index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-foreground truncate max-w-[100px]">
                      {item[labelKey] || 'Desconhecido'}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">
                    {item.averageScore.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={item.averageScore * 10} className="h-1 flex-1" />
                  <span className="text-xs text-muted-foreground w-12">
                    {item.count} rp
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
