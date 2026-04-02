import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Ticket, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VoucherCelebrationProps {
  voucher: {
    id: string;
    code: string;
    expires_at: string;
  };
  onClose: () => void;
}

const VoucherCelebration = ({ voucher, onClose }: VoucherCelebrationProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleGoToCatalog = () => {
    onClose();
    navigate('/prizes');
  };

  const formattedExpiry = format(new Date(voucher.expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="confetti-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(38 92% 50%)', 'hsl(280 100% 70%)'][Math.floor(Math.random() * 4)]
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
        <div className="relative bg-gradient-to-br from-achievement/20 via-card to-primary/10 border-2 border-achievement/50 rounded-2xl p-8 shadow-2xl shadow-achievement/20">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Sparkle decorations */}
          <div className="absolute -top-3 -left-3">
            <Sparkles className="w-8 h-8 text-achievement animate-pulse" />
          </div>
          <div className="absolute -top-3 -right-3">
            <Sparkles className="w-8 h-8 text-achievement animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-achievement to-warning flex items-center justify-center animate-celebrate-bounce">
                <Gift className="w-12 h-12 text-achievement-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center border-2 border-background">
                <Ticket className="w-4 h-4 text-success-foreground" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              🎉 Parabéns!
            </h2>
            <p className="text-muted-foreground">
              Você ganhou um voucher por seu excelente desempenho!
            </p>
          </div>

          {/* Voucher code */}
          <div className="bg-background/50 border border-border rounded-xl p-4 mb-6">
            <p className="text-xs text-muted-foreground text-center mb-2">Seu código de voucher</p>
            <p className="text-2xl font-mono font-bold text-center text-primary tracking-wider">
              {voucher.code}
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Válido até {formattedExpiry}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleGoToCatalog}
              className="w-full gap-2 bg-gradient-to-r from-achievement to-warning hover:from-achievement/90 hover:to-warning/90 text-achievement-foreground"
            >
              <Gift className="w-4 h-4" />
              Ver Catálogo de Prêmios
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherCelebration;
