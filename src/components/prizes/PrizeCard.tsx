import { Prize } from '@/hooks/usePrizes';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Ticket, Package } from 'lucide-react';

interface PrizeCardProps {
  prize: Prize;
  availableVouchers: number;
  onRedeem: (prize: Prize) => void;
}

export function PrizeCard({ prize, availableVouchers, onRedeem }: PrizeCardProps) {
  const canRedeem = availableVouchers >= prize.vouchers_required;
  const isOutOfStock = prize.quantity_available !== null && prize.quantity_available <= 0;

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {/* Image */}
      <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
        {prize.image_url ? (
          <img 
            src={prize.image_url} 
            alt={prize.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Gift className="h-16 w-16 text-primary/50" />
        )}
      </div>

      <CardContent className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-2">{prize.name}</h3>
          <Badge variant="outline" className="shrink-0">
            {prize.category}
          </Badge>
        </div>
        
        {prize.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {prize.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-primary font-semibold">
            <Ticket className="h-4 w-4" />
            <span>{prize.vouchers_required}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {prize.vouchers_required === 1 ? 'voucher' : 'vouchers'}
          </span>
        </div>

        {prize.quantity_available !== null && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Package className="h-3 w-3" />
            <span>
              {prize.quantity_available > 0 
                ? `${prize.quantity_available} disponíveis` 
                : 'Esgotado'}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          onClick={() => onRedeem(prize)}
          disabled={!canRedeem || isOutOfStock}
        >
          {isOutOfStock 
            ? 'Esgotado' 
            : canRedeem 
              ? 'Resgatar' 
              : `Faltam ${prize.vouchers_required - availableVouchers} vouchers`}
        </Button>
      </CardFooter>
    </Card>
  );
}
