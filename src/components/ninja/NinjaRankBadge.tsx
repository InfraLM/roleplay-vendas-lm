import { cn } from "@/lib/utils";

interface NinjaRankBadgeProps {
  level: number;
  name: string;
  emoji: string;
  color: string;
  variant?: "full" | "compact" | "icon";
  className?: string;
}

export function NinjaRankBadge({
  level,
  name,
  emoji,
  color,
  variant = "full",
  className,
}: NinjaRankBadgeProps) {
  if (variant === "icon") {
    return (
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-sm",
          "border transition-colors",
          className
        )}
        style={{ borderColor: color, backgroundColor: `${color}20` }}
        title={`${name} (Nível ${level})`}
      >
        {emoji}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          "border transition-colors",
          className
        )}
        style={{ 
          borderColor: color, 
          backgroundColor: `${color}15`,
          color: color,
        }}
      >
        <span>{emoji}</span>
        <span>{name}</span>
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "border transition-colors",
        className
      )}
      style={{ 
        borderColor: color, 
        backgroundColor: `${color}10`,
      }}
    >
      <span className="text-lg">{emoji}</span>
      <div className="flex flex-col">
        <span className="text-sm font-semibold" style={{ color }}>{name}</span>
        <span className="text-xs text-muted-foreground">Nível {level}</span>
      </div>
    </div>
  );
}
