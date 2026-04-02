import { Voucher } from '@/hooks/useVouchers';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VoucherCardProps {
  voucher: Voucher;
  selected?: boolean;
  onSelect?: (voucher: Voucher) => void;
  selectable?: boolean;
}

const statusConfig = {
  issued: { label: 'Disponível', variant: 'default' as const, icon: Ticket, color: 'text-primary' },
  redeemed: { label: 'Resgatado', variant: 'secondary' as const, icon: CheckCircle, color: 'text-muted-foreground' },
  expired: { label: 'Expirado', variant: 'outline' as const, icon: Clock, color: 'text-muted-foreground' },
  canceled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle, color: 'text-destructive' },
};

export function VoucherCard({ voucher, selected, onSelect, selectable }: VoucherCardProps) {
  const config = statusConfig[voucher.status];
  const StatusIcon = config.icon;

  return (
    <Card 
      className={`transition-all cursor-pointer ${
        selected 
          ? 'border-primary bg-primary/5 ring-2 ring-primary' 
          : selectable && voucher.status === 'issued'
            ? 'hover:border-primary/50'
            : 'opacity-60'
      }`}
      onClick={() => selectable && voucher.status === 'issued' && onSelect?.(voucher)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-primary/10 ${config.color}`}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono font-bold text-foreground">{voucher.code}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(voucher.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        </div>
        {voucher.expires_at && (
          <p className="text-xs text-muted-foreground mt-2">
            Expira em: {format(new Date(voucher.expires_at), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        )}
        {selected && (
          <div className="mt-2 flex items-center gap-1 text-primary text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Selecionado</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
