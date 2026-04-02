import { Flame, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  message: string;
  isLoading?: boolean;
}

export const StreakCard = ({ 
  currentStreak, 
  longestStreak, 
  message,
  isLoading = false 
}: StreakCardProps) => {
  const isOnFire = currentStreak >= 3;
  const isLegend = currentStreak >= 14;

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "bg-card border-border relative overflow-hidden transition-all duration-300",
      isOnFire && "border-orange-500/50",
      isLegend && "border-orange-400/70 shadow-lg shadow-orange-500/20"
    )}>
      {/* Animated fire background for high streaks */}
      {isOnFire && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent pointer-events-none" />
      )}
      
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Flame className={cn(
                "h-4 w-4",
                isOnFire ? "text-orange-500" : "text-muted-foreground"
              )} />
              Streak
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className={cn(
                "text-3xl font-bold",
                isLegend ? "text-orange-400" : isOnFire ? "text-orange-500" : "text-foreground"
              )}>
                {currentStreak}
              </h3>
              <span className="text-lg text-muted-foreground">
                {currentStreak === 1 ? "dia" : "dias"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{message}</p>
          </div>
          
          <div className={cn(
            "flex flex-col items-center justify-center rounded-full p-3 transition-all duration-300",
            isLegend 
              ? "bg-gradient-to-br from-orange-500 to-red-600 animate-pulse" 
              : isOnFire 
                ? "bg-gradient-to-br from-orange-500/80 to-orange-600/80" 
                : "bg-muted"
          )}>
            <Flame className={cn(
              "h-6 w-6 transition-all",
              isOnFire ? "text-white" : "text-muted-foreground"
            )} />
          </div>
        </div>
        
        {/* Personal record indicator */}
        {longestStreak > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
            <Trophy className="h-3 w-3 text-yellow-500" />
            <span>Recorde: <strong className="text-foreground">{longestStreak} dias</strong></span>
            {currentStreak > 0 && currentStreak >= longestStreak && (
              <span className="ml-auto text-yellow-500 font-medium">Novo recorde!</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
