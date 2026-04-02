import { cn } from "@/lib/utils";

interface NinjaAvatarProps {
  level: number;
  emoji: string;
  color: string;
  size?: "sm" | "md" | "lg" | "xl";
  showGlow?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10 text-lg",
  md: "w-14 h-14 text-2xl",
  lg: "w-20 h-20 text-3xl",
  xl: "w-28 h-28 text-5xl",
};

export function NinjaAvatar({ 
  level, 
  emoji, 
  color, 
  size = "md", 
  showGlow = true,
  className 
}: NinjaAvatarProps) {
  const isHighLevel = level >= 7;
  const isLegendary = level >= 11;

  return (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center",
        "bg-gradient-to-br from-background to-muted",
        "border-2 transition-all duration-300",
        sizeClasses[size],
        showGlow && isHighLevel && "shadow-lg",
        isLegendary && "animate-pulse",
        className
      )}
      style={{ 
        borderColor: color,
        boxShadow: showGlow && isHighLevel 
          ? `0 0 20px ${color}40, 0 0 40px ${color}20` 
          : undefined 
      }}
    >
      {/* Background glow for high levels */}
      {showGlow && isHighLevel && (
        <div 
          className="absolute inset-0 rounded-full opacity-20 blur-md"
          style={{ backgroundColor: color }}
        />
      )}
      
      {/* Emoji */}
      <span className="relative z-10 select-none">{emoji}</span>
      
      {/* Level badge for larger sizes */}
      {(size === "lg" || size === "xl") && (
        <div 
          className={cn(
            "absolute -bottom-1 -right-1 rounded-full",
            "flex items-center justify-center font-bold text-white",
            size === "xl" ? "w-8 h-8 text-sm" : "w-6 h-6 text-xs"
          )}
          style={{ backgroundColor: color }}
        >
          {level}
        </div>
      )}
    </div>
  );
}
