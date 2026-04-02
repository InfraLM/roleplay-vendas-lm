import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Rocket, X, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingCelebrationProps {
  onClose: () => void;
}

export function OnboardingCelebration({ onClose }: OnboardingCelebrationProps) {
  const navigate = useNavigate();
  const { profile, role } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  const firstName = profile?.name?.split(' ')[0] || 'Usuário';
  const isAdmin = role === 'admin';

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getMessage = () => {
    if (isAdmin) {
      return "Você está pronto para gerenciar sua equipe e acompanhar o desempenho de todos!";
    }
    return "Você está pronto para treinar suas habilidades e conquistar vouchers!";
  };

  const handleCtaClick = () => {
    onClose();
    if (isAdmin) {
      navigate('/admin/equipe');
    } else {
      navigate('/roleplay');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="confetti-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: [
                'hsl(var(--primary))', 
                'hsl(var(--success))', 
                'hsl(38 92% 50%)', 
                'hsl(280 100% 70%)',
                'hsl(var(--achievement))'
              ][Math.floor(Math.random() * 5)]
            }}
          />
        ))}
      </div>

      {/* Floating stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <Star
            key={i}
            className="absolute text-primary/40 animate-pulse"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              width: `${12 + Math.random() * 16}px`,
              height: `${12 + Math.random() * 16}px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div 
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-500 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        <div className="relative bg-gradient-to-br from-primary/20 via-card to-success/10 border-2 border-primary/50 rounded-2xl p-8 shadow-2xl shadow-primary/20">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Sparkle decorations */}
          <div className="absolute -top-3 -left-3">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="absolute -top-3 -right-3">
            <Sparkles className="w-8 h-8 text-success animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="absolute -bottom-3 -left-3">
            <Sparkles className="w-6 h-6 text-achievement animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="absolute -bottom-3 -right-3">
            <Sparkles className="w-6 h-6 text-warning animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>

          {/* Icon with celebration animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div 
                className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-success flex items-center justify-center animate-celebrate-bounce"
                style={{
                  boxShadow: '0 0 40px hsl(var(--primary) / 0.5), 0 0 80px hsl(var(--success) / 0.3)'
                }}
              >
                {isAdmin ? (
                  <Trophy className="w-14 h-14 text-primary-foreground" />
                ) : (
                  <Rocket className="w-14 h-14 text-primary-foreground" />
                )}
              </div>
              {/* Orbiting stars */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
                <Star className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 text-warning fill-warning" />
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
                <Star className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 text-achievement fill-achievement" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              🎉 Tutorial Concluído!
            </h2>
            <p className="text-lg font-medium text-primary mb-2">
              Parabéns, {firstName}!
            </p>
            <p className="text-muted-foreground">
              {getMessage()}
            </p>
          </div>

          {/* Quick tips */}
          <div className="bg-background/50 border border-border rounded-xl p-4 mb-6">
            <p className="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wider">
              Próximos passos
            </p>
            <ul className="text-sm text-foreground space-y-2">
              {isAdmin ? (
                <>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">1</span>
                    Convide membros da sua equipe
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">2</span>
                    Configure os produtos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">3</span>
                    Acompanhe o desempenho nos relatórios
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">1</span>
                    Inicie seu primeiro roleplay
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">2</span>
                    Receba feedback detalhado da IA
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">3</span>
                    Conquiste vouchers com bom desempenho
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={handleCtaClick}
            className="w-full gap-2 bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-primary-foreground font-semibold h-12 text-base"
            style={{
              boxShadow: '0 4px 20px hsl(var(--primary) / 0.4)'
            }}
          >
            {isAdmin ? (
              <>
                <Trophy className="w-5 h-5" />
                Gerenciar Equipe
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Começar a Treinar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
