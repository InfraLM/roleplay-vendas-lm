import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface NinjaProgressBarProps {
  currentXp: number;
  xpToNextLevel: number | null;
  color: string;
  nextRankName?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function NinjaProgressBar({
  currentXp,
  xpToNextLevel,
  color,
  nextRankName,
  showLabel = true,
  size = "md",
  className,
}: NinjaProgressBarProps) {
  // If no next level (max level), show full bar
  const isMaxLevel = xpToNextLevel === null;
  const progress = isMaxLevel ? 100 : Math.min((currentXp / xpToNextLevel) * 100, 100);
  const xpRemaining = isMaxLevel ? 0 : xpToNextLevel - currentXp;

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {isMaxLevel ? (
              <span className="text-primary font-medium">Nível Máximo Alcançado!</span>
            ) : (
              <>
                <span className="font-medium text-foreground">{currentXp}</span>
                <span className="mx-1">/</span>
                <span>{xpToNextLevel} XP</span>
              </>
            )}
          </span>
          {!isMaxLevel && nextRankName && (
            <span>
              Faltam <span className="font-medium text-foreground">{xpRemaining} XP</span> para {nextRankName}
            </span>
          )}
        </div>
      )}
      
      <div className={cn("relative w-full rounded-full bg-muted overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isMaxLevel && "animate-pulse"
          )}
          style={{ 
            width: `${progress}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}
