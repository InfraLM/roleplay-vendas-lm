import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface OnboardingHighlightProps {
  targetSelector: string | null;
  isActive: boolean;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingHighlight({ 
  targetSelector, 
  isActive, 
  children,
  position = 'right'
}: OnboardingHighlightProps) {
  const [targetRect, setTargetRect] = useState<HighlightRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || !targetSelector) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = 8;
        
        setTargetRect({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        // Calculate tooltip position based on target
        const tooltipWidth = 380;
        const tooltipHeight = 200;
        const gap = 16;

        let top = 0;
        let left = 0;

        switch (position) {
          case 'right':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + gap;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - gap;
            break;
          case 'top':
            top = rect.top - tooltipHeight - gap;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'bottom':
            top = rect.bottom + gap;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          default:
            top = window.innerHeight / 2 - tooltipHeight / 2;
            left = window.innerWidth / 2 - tooltipWidth / 2;
        }

        // Keep tooltip in viewport
        top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

        setTooltipPosition({ top, left });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, targetSelector, position]);

  if (!isActive) return null;

  // For center position (no target), render modal in center
  if (!targetSelector || position === 'center') {
    return createPortal(
      <div className="fixed inset-0 z-[100]">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        {/* Centered Content */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-md animate-scale-in">
            {children}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (!targetRect) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* SVG Overlay with soft-edge cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          {/* Gradient for softer edges */}
          <linearGradient id="spotlight-edge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="black" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>
          <filter id="spotlight-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect 
              x={targetRect.left - 2} 
              y={targetRect.top - 2} 
              width={targetRect.width + 4} 
              height={targetRect.height + 4}
              rx="10"
              fill="black"
              filter="url(#spotlight-blur)"
            />
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="rgba(0, 0, 0, 0.8)" 
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Inner glow - gradient overlay inside spotlight */}
      <div 
        className="absolute rounded-xl pointer-events-none"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          background: `linear-gradient(135deg, hsl(188 94% 43% / 0.08) 0%, transparent 50%, hsl(188 94% 43% / 0.04) 100%)`,
          border: '1px solid hsl(188 94% 43% / 0.2)',
        }}
      />

      {/* Luminous glow border with pulsing animation */}
      <div 
        className="absolute rounded-xl animate-spotlight-pulse"
        style={{
          top: targetRect.top - 2,
          left: targetRect.left - 2,
          width: targetRect.width + 4,
          height: targetRect.height + 4,
        }}
      />

      {/* Tooltip */}
      <div 
        className="absolute w-[380px] pointer-events-auto animate-fade-in"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
