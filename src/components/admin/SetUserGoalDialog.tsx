import { useState, useEffect } from 'react';
import { Target, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useUserGoals, UserGoal } from '@/hooks/useUserGoals';

interface SetUserGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  existingGoal?: UserGoal | null;
  onSuccess?: () => void;
}

export const SetUserGoalDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
  existingGoal,
  onSuccess
}: SetUserGoalDialogProps) => {
  const { setUserGoal, clearGoal } = useUserGoals();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [roleplaysPerWeek, setRoleplaysPerWeek] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(70);
  const [hasMinScore, setHasMinScore] = useState(false);
  const [vouchersPerMonth, setVouchersPerMonth] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingGoal) {
      setRoleplaysPerWeek(existingGoal.roleplays_per_week?.toString() || '');
      setMinScore(existingGoal.min_score || 70);
      setHasMinScore(!!existingGoal.min_score);
      setVouchersPerMonth(existingGoal.vouchers_per_month?.toString() || '');
      setNotes(existingGoal.notes || '');
    } else {
      setRoleplaysPerWeek('');
      setMinScore(70);
      setHasMinScore(false);
      setVouchersPerMonth('');
      setNotes('');
    }
  }, [existingGoal, open]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const success = await setUserGoal({
        user_id: userId,
        roleplays_per_week: roleplaysPerWeek ? parseInt(roleplaysPerWeek) : null,
        min_score: hasMinScore ? minScore : null,
        vouchers_per_month: vouchersPerMonth ? parseInt(vouchersPerMonth) : null,
        notes: notes || null
      });

      if (success) {
        toast({
          title: 'Metas definidas',
          description: `Metas atualizadas para ${userName}`
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error('Failed to set goal');
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível definir as metas',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    setIsSubmitting(true);
    try {
      const success = await clearGoal(userId);
      if (success) {
        toast({
          title: 'Metas removidas',
          description: `Metas removidas para ${userName}`
        });
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover as metas',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Definir Metas
          </DialogTitle>
          <DialogDescription>
            Configure metas individuais para <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Roleplays per week */}
          <div className="space-y-2">
            <Label htmlFor="roleplays">Roleplays por semana</Label>
            <Input
              id="roleplays"
              type="number"
              min="1"
              max="50"
              placeholder="Ex: 5"
              value={roleplaysPerWeek}
              onChange={(e) => setRoleplaysPerWeek(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deixe vazio para não definir meta de roleplays
            </p>
          </div>

          {/* Minimum score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Score mínimo</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setHasMinScore(!hasMinScore)}
              >
                {hasMinScore ? 'Remover' : 'Adicionar'}
              </Button>
            </div>
            {hasMinScore && (
              <div className="space-y-2">
                <Slider
                  value={[minScore]}
                  onValueChange={(v) => setMinScore(v[0])}
                  min={50}
                  max={100}
                  step={5}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50</span>
                  <span className="text-primary font-medium">{minScore}</span>
                  <span>100</span>
                </div>
              </div>
            )}
          </div>

          {/* Vouchers per month */}
          <div className="space-y-2">
            <Label htmlFor="vouchers">Vouchers por mês</Label>
            <Input
              id="vouchers"
              type="number"
              min="1"
              max="50"
              placeholder="Ex: 3"
              value={vouchersPerMonth}
              onChange={(e) => setVouchersPerMonth(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deixe vazio para não definir meta de vouchers
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Notas sobre as metas deste usuário..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingGoal && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isSubmitting}
              className="text-destructive hover:text-destructive"
            >
              Limpar Metas
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Metas
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
