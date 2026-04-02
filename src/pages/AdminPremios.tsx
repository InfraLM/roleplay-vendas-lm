import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePrizes, Prize, PrizeRedemption } from '@/hooks/usePrizes';
import { Gift, Plus, Pencil, Trash2, Ticket, Clock, CheckCircle, Package, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const redemptionStatusConfig = {
  pending: { label: 'Aguardando', variant: 'outline' as const, icon: Clock },
  approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
  delivered: { label: 'Entregue', variant: 'secondary' as const, icon: Package },
  canceled: { label: 'Cancelado', variant: 'destructive' as const, icon: X },
};

const defaultCategories = ['geral', 'experiência', 'produto', 'gift card', 'educação'];

export default function AdminPremios() {
  const { 
    prizes, 
    redemptions, 
    loading, 
    fetchAllPrizes, 
    fetchAllRedemptions,
    createPrize, 
    updatePrize, 
    deletePrize,
    updateRedemptionStatus,
  } = usePrizes();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prizeToDelete, setPrizeToDelete] = useState<Prize | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [redemptionToUpdate, setRedemptionToUpdate] = useState<PrizeRedemption | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    vouchers_required: 1,
    quantity_available: '',
    category: 'geral',
    is_active: true,
  });

  useEffect(() => {
    fetchAllPrizes();
    fetchAllRedemptions();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      vouchers_required: 1,
      quantity_available: '',
      category: 'geral',
      is_active: true,
    });
    setEditingPrize(null);
    setFormOpen(false);
  };

  const handleEdit = (prize: Prize) => {
    setFormData({
      name: prize.name,
      description: prize.description || '',
      image_url: prize.image_url || '',
      vouchers_required: prize.vouchers_required,
      quantity_available: prize.quantity_available?.toString() || '',
      category: prize.category,
      is_active: prize.is_active,
    });
    setEditingPrize(prize);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const prizeData = {
      name: formData.name,
      description: formData.description || null,
      image_url: formData.image_url || null,
      vouchers_required: formData.vouchers_required,
      quantity_available: formData.quantity_available ? parseInt(formData.quantity_available) : null,
      category: formData.category,
      is_active: formData.is_active,
    };

    if (editingPrize) {
      await updatePrize(editingPrize.id, prizeData);
    } else {
      await createPrize(prizeData);
    }
    
    resetForm();
  };

  const handleDelete = async () => {
    if (prizeToDelete) {
      await deletePrize(prizeToDelete.id);
      setDeleteDialogOpen(false);
      setPrizeToDelete(null);
    }
  };

  const handleStatusUpdate = async () => {
    if (redemptionToUpdate && newStatus) {
      await updateRedemptionStatus(
        redemptionToUpdate.id, 
        newStatus as PrizeRedemption['status'],
        statusNotes
      );
      setStatusDialogOpen(false);
      setRedemptionToUpdate(null);
      setNewStatus('');
      setStatusNotes('');
    }
  };

  const openStatusDialog = (redemption: PrizeRedemption) => {
    setRedemptionToUpdate(redemption);
    setNewStatus(redemption.status);
    setStatusNotes(redemption.notes || '');
    setStatusDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerenciar Prêmios</h1>
            <p className="text-muted-foreground">
              Crie e gerencie o catálogo de prêmios para sua equipe
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Prêmio
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{prizes.length}</p>
                  <p className="text-sm text-muted-foreground">Prêmios Cadastrados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {redemptions.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Resgates Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {redemptions.filter(r => r.status === 'delivered').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Resgates Entregues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="prizes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="prizes" className="gap-2">
              <Gift className="h-4 w-4" />
              Prêmios ({prizes.length})
            </TabsTrigger>
            <TabsTrigger value="redemptions" className="gap-2">
              <Ticket className="h-4 w-4" />
              Resgates ({redemptions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prizes">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : prizes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum prêmio cadastrado
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Crie o primeiro prêmio para o catálogo
                  </p>
                  <Button onClick={() => setFormOpen(true)}>
                    Criar Prêmio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Vouchers</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prizes.map(prize => (
                      <TableRow key={prize.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                              {prize.image_url ? (
                                <img 
                                  src={prize.image_url} 
                                  alt={prize.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Gift className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{prize.name}</p>
                              {prize.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {prize.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{prize.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Ticket className="h-4 w-4 text-primary" />
                            <span>{prize.vouchers_required}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {prize.quantity_available !== null 
                            ? prize.quantity_available 
                            : 'Ilimitado'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={prize.is_active ? 'default' : 'secondary'}>
                            {prize.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(prize)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setPrizeToDelete(prize);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="redemptions">
            {redemptions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum resgate realizado
                  </h3>
                  <p className="text-muted-foreground">
                    Os resgates da equipe aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Vouchers</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map(redemption => {
                      const config = redemptionStatusConfig[redemption.status];
                      const StatusIcon = config.icon;
                      const prize = redemption.prize as unknown as { name: string } | undefined;
                      const profile = redemption.profiles as unknown as { name: string; email: string } | undefined;

                      return (
                        <TableRow key={redemption.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {profile?.name || 'Usuário'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {profile?.email || ''}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-foreground">
                              {prize?.name || 'Prêmio'}
                            </p>
                          </TableCell>
                          <TableCell>
                            {redemption.voucher_ids.length}
                          </TableCell>
                          <TableCell>
                            {format(new Date(redemption.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openStatusDialog(redemption)}
                            >
                              Atualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Prize Form Dialog */}
        <Dialog open={formOpen} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPrize ? 'Editar Prêmio' : 'Novo Prêmio'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do prêmio
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Gift Card R$50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o prêmio..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vouchers_required">Vouchers Necessários *</Label>
                  <Input
                    id="vouchers_required"
                    type="number"
                    min={1}
                    value={formData.vouchers_required}
                    onChange={(e) => setFormData({ ...formData, vouchers_required: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity_available">Quantidade (vazio = ilimitado)</Label>
                  <Input
                    id="quantity_available"
                    type="number"
                    min={0}
                    value={formData.quantity_available}
                    onChange={(e) => setFormData({ ...formData, quantity_available: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Prêmio Ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPrize ? 'Salvar' : 'Criar Prêmio'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Prêmio</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o prêmio "{prizeToDelete?.name}"? 
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atualizar Status do Resgate</DialogTitle>
              <DialogDescription>
                Altere o status do resgate e adicione observações se necessário.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Novo Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Aguardando</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Adicione observações sobre o resgate..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleStatusUpdate}>
                Atualizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
