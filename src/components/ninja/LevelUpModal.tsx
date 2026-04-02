import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NinjaAvatar } from "./NinjaAvatar";
import { NinjaRankBadge } from "./NinjaRankBadge";
import { ArrowRight, Sparkles, PartyPopper } from "lucide-react";
import type { NinjaRank } from "@/hooks/useNinjaRank";
import { cn } from "@/lib/utils";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousRank: NinjaRank | null;
  newRank: NinjaRank | null;
  xpGained: number;
}

export function LevelUpModal({
  isOpen,
  onClose,
  previousRank,
  newRank,
  xpGained,
}: LevelUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!newRank) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden border-2" style={{ borderColor: newRank.color }}>
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-20px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <Sparkles 
                  className="h-4 w-4" 
                  style={{ color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#9B59B6", "#3498DB"][i % 5] }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="text-center pt-4">
          <div className="flex justify-center mb-2">
            <PartyPopper className="h-8 w-8 text-yellow-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Parabéns! 🎉
          </h2>
          <p className="text-muted-foreground mt-1">Você subiu de nível!</p>
        </div>

        {/* Rank Transition */}
        <div className="flex items-center justify-center gap-4 py-6">
          {previousRank && (
            <>
              <div className="text-center opacity-50">
                <NinjaAvatar
                  level={previousRank.level}
                  emoji={previousRank.emoji}
                  color={previousRank.color}
                  size="lg"
                  showGlow={false}
                />
                <p className="text-xs text-muted-foreground mt-2">{previousRank.name}</p>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </>
          )}
          
          <div className="text-center relative">
            <div 
              className="absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse"
              style={{ backgroundColor: newRank.color }}
            />
            <NinjaAvatar
              level={newRank.level}
              emoji={newRank.emoji}
              color={newRank.color}
              size="xl"
              showGlow
              className="relative z-10"
            />
          </div>
        </div>

        {/* New Rank Info */}
        <div 
          className="text-center p-4 rounded-lg mx-4"
          style={{ backgroundColor: `${newRank.color}15` }}
        >
          <NinjaRankBadge
            level={newRank.level}
            name={newRank.name}
            emoji={newRank.emoji}
            color={newRank.color}
            variant="full"
            className="inline-flex"
          />
          {newRank.description && (
            <p className="text-sm text-muted-foreground mt-3 italic">
              "{newRank.description}"
            </p>
          )}
        </div>

        {/* XP Gained */}
        <div className="text-center text-sm text-muted-foreground">
          <span className="font-medium text-primary">+{xpGained} XP</span> ganhos neste roleplay
        </div>

        {/* Action Button */}
        <div className="px-4 pb-4">
          <Button 
            onClick={onClose} 
            className="w-full"
            style={{ 
              backgroundColor: newRank.color,
              color: "white",
            }}
          >
            Continuar Jornada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
