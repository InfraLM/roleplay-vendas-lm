import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AiInsightsCardProps {
  insights: string;
}

export const AiInsightsCard = ({ insights }: AiInsightsCardProps) => {
  if (!insights) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-primary">
          <Sparkles className="w-4 h-4" />
          Insights da IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReactMarkdown 
          className="text-foreground leading-relaxed space-y-3"
          components={{
            h2: ({children}) => <h2 className="text-lg font-semibold text-primary mt-4 mb-2">{children}</h2>,
            h3: ({children}) => <h3 className="text-base font-semibold text-primary mt-3 mb-1">{children}</h3>,
            strong: ({children}) => <strong className="font-semibold text-primary">{children}</strong>,
            ul: ({children}) => <ul className="list-disc list-inside space-y-1 ml-2">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal list-inside space-y-1 ml-2">{children}</ol>,
            li: ({children}) => <li className="text-foreground">{children}</li>,
            p: ({children}) => <p className="mb-2 text-foreground">{children}</p>,
          }}
        >
          {insights}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
};
