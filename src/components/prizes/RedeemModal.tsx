import { useState } from 'react';
import { Prize } from '@/hooks/usePrizes';
import { Voucher } from '@/hooks/useVouchers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoucherCard } from '@/components/vouchers/VoucherCard';
import { Gift, Ticket, CheckCircle, Loader2 } from 'lucide-react';

interface RedeemModalProps {
  prize: Prize | null;
  availableVouchers: Voucher[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (prize: Prize, voucherIds: string[]) => Promise<boolean>;
}

export function RedeemModal({ 
  prize, 
  availableVouchers, 
  open, 
  onOpenChange, 
  onConfirm 
}: RedeemModalProps) {
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedVouchers([]);
      setSuccess(false);
    }
    onOpenChange(newOpen);
  };

  const toggleVoucher = (voucher: Voucher) => {
    if (!prize) return;
    
    setSelectedVouchers(prev => {
      if (prev.includes(voucher.id)) {
        return prev.filter(id => id !== voucher.id);
      }
      if (prev.length < prize.vouchers_required) {
        return [...prev, voucher.id];
      }
      return prev;
    });
  };

  const handleConfirm = async () => {
    if (!prize || selectedVouchers.length < prize.vouchers_required) return;

    setLoading(true);
    const result = await onConfirm(prize, selectedVouchers);
    setLoading(false);

    if (result) {
      setSuccess(true);
    }
  };

  if (!prize) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="text-2xl mb-2">Resgate Solicitado!</DialogTitle>
            <DialogDescription className="text-base">
              Seu pedido de resgate foi enviado com sucesso. 
              Aguarde a aprovação do administrador.
            </DialogDescription>
            <Button onClick={() => handleOpenChange(false)} className="mt-6">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Resgatar Prêmio
              </DialogTitle>
              <DialogDescription>
                Selecione {prize.vouchers_required} voucher{prize.vouchers_required > 1 ? 's' : ''} para trocar por este prêmio.
              </DialogDescription>
            </DialogHeader>

            {/* Prize Info */}
            <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                {prize.image_url ? (
                  <img src={prize.image_url} alt={prize.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Gift className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{prize.name}</h3>
                <div className="flex items-center gap-1 text-primary text-sm">
                  <Ticket className="h-4 w-4" />
                  <span>{prize.vouchers_required} voucher{prize.vouchers_required > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Voucher Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Selecionar Vouchers</p>
                <p className="text-sm text-muted-foreground">
                  {selectedVouchers.length}/{prize.vouchers_required} selecionados
                </p>
              </div>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {availableVouchers.map(voucher => (
                    <VoucherCard
                      key={voucher.id}
                      voucher={voucher}
                      selected={selectedVouchers.includes(voucher.id)}
                      onSelect={toggleVoucher}
                      selectable
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={selectedVouchers.length < prize.vouchers_required || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resgatando...
                  </>
                ) : (
                  'Confirmar Resgate'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
