import { useState, useEffect } from "react";
import { X, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContextualTooltip as TooltipType } from "@/hooks/useContextualTooltips";

interface ContextualTooltipProps {
  tooltip: TooltipType;
  onDismiss: (pageId: string) => void;
  progress: { total: number; visited: number };
}

export function ContextualTooltip({ tooltip, onDismiss, progress }: ContextualTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Delay appearance for smooth animation
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(tooltip.id);
    }, 300);
  };

  const Icon = tooltip.icon;

  // Parse markdown-style bold text
  const formatTip = (tip: string) => {
    const parts = tip.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-primary font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 max-w-sm transition-all duration-300 ease-out ${
        isVisible && !isExiting 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-4 scale-95'
      }`}
    >
      {/* Glass Card */}
      <div 
        className="relative rounded-2xl border border-primary/20 p-5 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px hsl(var(--primary) / 0.15), 0 0 0 1px hsl(var(--primary) / 0.1)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Animated Icon */}
          <div 
            className="p-2.5 rounded-xl bg-primary/10 border border-primary/20"
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          >
            <Icon className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="font-semibold text-foreground text-base leading-tight">
              {tooltip.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tooltip.description}
            </p>
          </div>
        </div>

        {/* Tips List */}
        <ul className="space-y-2.5 mb-4">
          {tooltip.tips.map((tip, index) => (
            <li 
              key={index}
              className="flex items-start gap-2.5 text-sm text-foreground/90"
              style={{
                animation: `fade-in 0.3s ease-out ${150 + index * 100}ms both`,
              }}
            >
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{formatTip(tip)}</span>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span>
              {progress.visited + 1}/{progress.total} páginas descobertas
            </span>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={handleDismiss}
            size="sm"
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            Entendi!
          </Button>
        </div>

        {/* Decorative glow */}
        <div 
          className="absolute -inset-px rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 50%, hsl(var(--primary) / 0.05) 100%)',
          }}
        />
      </div>
    </div>
  );
}
