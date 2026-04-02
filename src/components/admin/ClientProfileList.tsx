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
  Smile, 
  Meh, 
  Frown, 
  Angry,
  Plus,
  Pencil,
  Trash2,
  MessageSquare
} from "lucide-react";
import ClientProfileForm from "./ClientProfileForm";
import type { ClientProfile, ClientProfileFormData, ClientProfileType } from "@/hooks/useClientProfileManager";

interface ClientProfileListProps {
  profiles: ClientProfile[];
  isLoading: boolean;
  onCreate: (data: ClientProfileFormData) => Promise<any>;
  onUpdate: (id: string, data: Partial<ClientProfileFormData>) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  getTypeColor: (type: ClientProfileType) => string;
  getTypeLabel: (type: ClientProfileType) => string;
}

const getProfileIcon = (type: ClientProfileType) => {
  const icons: Record<ClientProfileType, typeof Smile> = {
    soft: Smile,
    hard: Meh,
    chato: Frown,
    ultra_hard: Angry
  };
  return icons[type] || Smile;
};

const ClientProfileList = ({ 
  profiles, 
  isLoading, 
  onCreate, 
  onUpdate, 
  onDelete,
  getTypeColor,
  getTypeLabel
}: ClientProfileListProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ClientProfile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<ClientProfile | null>(null);

  const handleCreate = async (data: ClientProfileFormData) => {
    await onCreate(data);
    setIsCreateOpen(false);
  };

  const handleUpdate = async (data: ClientProfileFormData) => {
    if (!editingProfile) return;
    await onUpdate(editingProfile.id, data);
    setEditingProfile(null);
  };

  const handleDelete = async () => {
    if (!deletingProfile) return;
    await onDelete(deletingProfile.id);
    setDeletingProfile(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted/50" />
            <CardContent className="h-24 bg-muted/30" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">
          {profiles.length} perfil{profiles.length !== 1 ? 's' : ''} de cliente
        </h3>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((profile) => {
          const Icon = getProfileIcon(profile.name);
          return (
            <Card key={profile.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{profile.display_name}</CardTitle>
                      <Badge className={`mt-1 ${getTypeColor(profile.name)}`}>
                        {getTypeLabel(profile.name)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingProfile(profile)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingProfile(profile)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {profile.objection_style}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="w-3 h-3" />
                  {profile.whatsapp_style ? 'Estilo WhatsApp' : 'Estilo Formal'}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Perfil de Cliente</DialogTitle>
          </DialogHeader>
          <ClientProfileForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          {editingProfile && (
            <ClientProfileForm
              profile={editingProfile}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProfile(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProfile} onOpenChange={() => setDeletingProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o perfil "{deletingProfile?.display_name}"? 
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

export default ClientProfileList;
