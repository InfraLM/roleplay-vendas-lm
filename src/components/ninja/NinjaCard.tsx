import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NinjaAvatar } from "./NinjaAvatar";
import { NinjaProgressBar } from "./NinjaProgressBar";
import { NinjaRankBadge } from "./NinjaRankBadge";
import { cn } from "@/lib/utils";
import { Target, TrendingUp, Flame, Gift, Check, X } from "lucide-react";
import type { NinjaRank, NinjaProgress } from "@/hooks/useNinjaRank";

interface NinjaCardProps {
  userName: string;
  progress: NinjaProgress | null;
  currentRank: NinjaRank | null;
  nextRank: NinjaRank | null;
  requirementsProgress?: {
    roleplays: { current: number; required: number; met: boolean };
    avgScore: { current: number; required: number; met: boolean };
    streak: { current: number; required: number; met: boolean };
    vouchers: { current: number; required: number; met: boolean };
  } | null;
  showRequirements?: boolean;
  variant?: "full" | "compact";
  className?: string;
  onClick?: () => void;
}

export function NinjaCard({
  userName,
  progress,
  currentRank,
  nextRank,
  requirementsProgress,
  showRequirements = true,
  variant = "full",
  className,
  onClick,
}: NinjaCardProps) {
  const rank = currentRank || {
    level: 1,
    name: "Aspirante",
    emoji: "🔰",
    color: "#9CA3AF",
    xp_to_next_level: 100,
    description: "Você deu o primeiro passo na jornada ninja.",
  };

  if (variant === "compact") {
    return (
      <Card 
        className={cn(
          "border-border/50", 
          onClick && "cursor-pointer hover:border-primary/30 transition-colors",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <NinjaAvatar
              level={rank.level}
              emoji={rank.emoji}
              color={rank.color}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold truncate">{userName}</span>
                <NinjaRankBadge
                  level={rank.level}
                  name={rank.name}
                  emoji={rank.emoji}
                  color={rank.color}
                  variant="compact"
                />
              </div>
              <NinjaProgressBar
                currentXp={progress?.current_xp || 0}
                xpToNextLevel={rank.xp_to_next_level}
                color={rank.color}
                nextRankName={nextRank?.name}
                size="sm"
                showLabel={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <Card className={cn("border-border/50 overflow-hidden", className)}>
      {/* Header with gradient */}
      <CardHeader 
        className="pb-0 pt-6"
        style={{ 
          background: `linear-gradient(135deg, ${rank.color}15 0%, transparent 100%)` 
        }}
      >
        <div className="flex items-start gap-4">
          <NinjaAvatar
            level={rank.level}
            emoji={rank.emoji}
            color={rank.color}
            size="lg"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold">{userName}</h3>
            <NinjaRankBadge
              level={rank.level}
              name={rank.name}
              emoji={rank.emoji}
              color={rank.color}
              variant="full"
              className="mt-2"
            />
            {rank.description && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                "{rank.description}"
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* XP Progress */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Progresso de XP</span>
          </div>
          <NinjaProgressBar
            currentXp={progress?.current_xp || 0}
            xpToNextLevel={rank.xp_to_next_level}
            color={rank.color}
            nextRankName={nextRank?.name}
            size="lg"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <StatItem
            icon={<Target className="h-4 w-4" />}
            label="Roleplays"
            value={progress?.total_roleplays || 0}
          />
          <StatItem
            icon={<TrendingUp className="h-4 w-4" />}
            label="Média"
            value={`${(progress?.avg_score || 0).toFixed(1)}`}
          />
          <StatItem
            icon={<Flame className="h-4 w-4" />}
            label="Melhor Streak"
            value={progress?.best_streak || 0}
          />
          <StatItem
            icon={<Gift className="h-4 w-4" />}
            label="Vouchers"
            value={progress?.total_vouchers || 0}
          />
        </div>

        {/* Requirements for Next Level */}
        {showRequirements && nextRank && requirementsProgress && (
          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span>Para se tornar</span>
              <NinjaRankBadge
                level={nextRank.level}
                name={nextRank.name}
                emoji={nextRank.emoji}
                color={nextRank.color}
                variant="compact"
              />
            </h4>
            <div className="space-y-2">
              <RequirementRow
                label="Roleplays"
                current={requirementsProgress.roleplays.current}
                required={requirementsProgress.roleplays.required}
                met={requirementsProgress.roleplays.met}
              />
              <RequirementRow
                label="Nota Média"
                current={requirementsProgress.avgScore.current}
                required={requirementsProgress.avgScore.required}
                met={requirementsProgress.avgScore.met}
                isDecimal
              />
              <RequirementRow
                label="Dias de Streak"
                current={requirementsProgress.streak.current}
                required={requirementsProgress.streak.required}
                met={requirementsProgress.streak.met}
              />
              <RequirementRow
                label="Vouchers"
                current={requirementsProgress.vouchers.current}
                required={requirementsProgress.vouchers.required}
                met={requirementsProgress.vouchers.met}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number | string;
}) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/50">
      <div className="flex justify-center text-muted-foreground mb-1">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function RequirementRow({
  label,
  current,
  required,
  met,
  isDecimal = false,
}: {
  label: string;
  current: number;
  required: number;
  met: boolean;
  isDecimal?: boolean;
}) {
  const displayCurrent = isDecimal ? current.toFixed(1) : current;
  const displayRequired = isDecimal ? required.toFixed(0) : required;

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        {met ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={met ? "text-green-500" : "text-muted-foreground"}>
          {label}
        </span>
      </div>
      <span className={cn(
        "font-medium",
        met ? "text-green-500" : "text-foreground"
      )}>
        {displayCurrent} / {displayRequired}
      </span>
    </div>
  );
}
