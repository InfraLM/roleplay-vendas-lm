import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ShoppingCart, 
  Building2, 
  GraduationCap, 
  Heart, 
  Briefcase,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import SegmentForm from "./SegmentForm";
import type { Segment, SegmentFormData } from "@/hooks/useSegmentManager";

interface SegmentListProps {
  segments: Segment[];
  isLoading: boolean;
  onCreate: (data: SegmentFormData) => Promise<any>;
  onUpdate: (id: string, data: Partial<SegmentFormData>) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

const getSegmentIcon = (name: string) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('ecommerce') || nameLower.includes('varejo') || nameLower.includes('commerce')) {
    return ShoppingCart;
  }
  if (nameLower.includes('saas') || nameLower.includes('software') || nameLower.includes('b2b')) {
    return Building2;
  }
  if (nameLower.includes('educ') || nameLower.includes('curso') || nameLower.includes('escola')) {
    return GraduationCap;
  }
  if (nameLower.includes('saúde') || nameLower.includes('saude') || nameLower.includes('health')) {
    return Heart;
  }
  return Briefcase;
};

const SegmentList = ({ segments, isLoading, onCreate, onUpdate, onDelete }: SegmentListProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [deletingSegment, setDeletingSegment] = useState<Segment | null>(null);

  const handleCreate = async (data: SegmentFormData) => {
    await onCreate(data);
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: SegmentFormData) => {
    if (!editingSegment) return;
    await onUpdate(editingSegment.id, data);
    setEditingSegment(null);
  };

  const handleDelete = async () => {
    if (!deletingSegment) return;
    await onDelete(deletingSegment.id);
    setDeletingSegment(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-muted/50" />
            <CardContent className="h-16 bg-muted/30" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">
          {segments.length} segmento{segments.length !== 1 ? 's' : ''}
        </h3>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Segmento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map((segment) => {
          const Icon = getSegmentIcon(segment.name);
          return (
            <Card key={segment.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{segment.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        Ativo
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingSegment(segment)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingSegment(segment)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {segment.description || segment.prompt_context.slice(0, 100) + '...'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Segmento</DialogTitle>
          </DialogHeader>
          <SegmentForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSegment} onOpenChange={() => setEditingSegment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Segmento</DialogTitle>
          </DialogHeader>
          {editingSegment && (
            <SegmentForm
              segment={editingSegment}
              onSubmit={handleUpdate}
              onCancel={() => setEditingSegment(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSegment} onOpenChange={() => setDeletingSegment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Segmento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o segmento "{deletingSegment?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SegmentList;
