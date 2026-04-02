import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVouchers } from '@/hooks/useVouchers';
import { usePrizes, PrizeRedemption } from '@/hooks/usePrizes';
import { VoucherCard } from '@/components/vouchers/VoucherCard';
import { Ticket, Gift, Clock, CheckCircle, Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const redemptionStatusConfig = {
  pending: { label: 'Aguardando', variant: 'outline' as const, icon: Clock },
  approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
  delivered: { label: 'Entregue', variant: 'secondary' as const, icon: Package },
  canceled: { label: 'Cancelado', variant: 'destructive' as const, icon: Clock },
};

export default function Vouchers() {
  const navigate = useNavigate();
  const { vouchers, loading: vouchersLoading, availableCount } = useVouchers();
  const { redemptions, loading: redemptionsLoading } = usePrizes();

  const loading = vouchersLoading || redemptionsLoading;

  const issuedVouchers = vouchers.filter(v => v.status === 'issued');
  const usedVouchers = vouchers.filter(v => v.status !== 'issued');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Vouchers</h1>
            <p className="text-muted-foreground">
              Gerencie seus vouchers e resgate prêmios
            </p>
          </div>
          <Button onClick={() => navigate('/prizes')} className="gap-2">
            <Gift className="h-4 w-4" />
            Ver Catálogo de Prêmios
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{availableCount}</p>
                  <p className="text-sm text-muted-foreground">Vouchers Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Gift className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{redemptions.length}</p>
                  <p className="text-sm text-muted-foreground">Resgates Realizados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <CheckCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{vouchers.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Vouchers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available" className="gap-2">
              <Ticket className="h-4 w-4" />
              Disponíveis ({issuedVouchers.length})
            </TabsTrigger>
            <TabsTrigger value="used" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Utilizados ({usedVouchers.length})
            </TabsTrigger>
            <TabsTrigger value="redemptions" className="gap-2">
              <Gift className="h-4 w-4" />
              Meus Resgates ({redemptions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : issuedVouchers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum voucher disponível
                  </h3>
                  <p className="text-muted-foreground">
                    Complete roleplays com nota alta para ganhar vouchers!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {issuedVouchers.map(voucher => (
                  <VoucherCard key={voucher.id} voucher={voucher} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="used">
            {usedVouchers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum voucher utilizado
                  </h3>
                  <p className="text-muted-foreground">
                    Seus vouchers usados aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usedVouchers.map(voucher => (
                  <VoucherCard key={voucher.id} voucher={voucher} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="redemptions">
            {redemptions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum resgate realizado
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Visite o catálogo de prêmios para resgatar
                  </p>
                  <Button onClick={() => navigate('/prizes')}>
                    Ver Catálogo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {redemptions.map((redemption) => {
                  const config = redemptionStatusConfig[redemption.status];
                  const StatusIcon = config.icon;
                  const prize = redemption.prize as unknown as { name: string; image_url: string | null } | undefined;
                  
                  return (
                    <Card key={redemption.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            {prize?.image_url ? (
                              <img 
                                src={prize.image_url} 
                                alt={prize.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Gift className="h-8 w-8 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">
                              {prize?.name || 'Prêmio'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(redemption.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {redemption.voucher_ids.length} voucher{redemption.voucher_ids.length > 1 ? 's' : ''} utilizados
                            </p>
                          </div>
                          <Badge variant={config.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>
                        {redemption.notes && (
                          <p className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            {redemption.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
