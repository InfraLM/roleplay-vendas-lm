import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrizes } from '@/hooks/usePrizes';
import { useVouchers } from '@/hooks/useVouchers';
import { PrizeCard } from '@/components/prizes/PrizeCard';
import { RedeemModal } from '@/components/prizes/RedeemModal';
import { Gift, Ticket, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Prize } from '@/hooks/usePrizes';

export default function PrizeCatalog() {
  const navigate = useNavigate();
  const { prizes, loading, redeemPrize } = usePrizes();
  const { availableVouchers, availableCount, fetchVouchers } = useVouchers();
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Get unique categories
  const categories = ['all', ...new Set(prizes.map(p => p.category))];

  // Filter prizes by category
  const filteredPrizes = categoryFilter === 'all' 
    ? prizes 
    : prizes.filter(p => p.category === categoryFilter);

  const handleRedeem = (prize: Prize) => {
    setSelectedPrize(prize);
    setModalOpen(true);
  };

  const handleConfirmRedeem = async (prize: Prize, voucherIds: string[]) => {
    const success = await redeemPrize(prize, voucherIds);
    if (success) {
      await fetchVouchers();
    }
    return success;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vouchers')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Catálogo de Prêmios</h1>
              <p className="text-muted-foreground">
                Troque seus vouchers por prêmios exclusivos
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-2 text-lg py-2 px-4">
            <Ticket className="h-5 w-5" />
            {availableCount} voucher{availableCount !== 1 ? 's' : ''} disponíve{availableCount !== 1 ? 'is' : 'l'}
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.filter(c => c !== 'all').map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {filteredPrizes.length} prêmio{filteredPrizes.length !== 1 ? 's' : ''} encontrado{filteredPrizes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Prizes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPrizes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum prêmio disponível
              </h3>
              <p className="text-muted-foreground">
                {categoryFilter !== 'all' 
                  ? 'Tente outra categoria'
                  : 'Aguarde novos prêmios serem adicionados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPrizes.map(prize => (
              <PrizeCard
                key={prize.id}
                prize={prize}
                availableVouchers={availableCount}
                onRedeem={handleRedeem}
              />
            ))}
          </div>
        )}

        {/* Redeem Modal */}
        <RedeemModal
          prize={selectedPrize}
          availableVouchers={availableVouchers}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onConfirm={handleConfirmRedeem}
        />
      </div>
    </DashboardLayout>
  );
}
