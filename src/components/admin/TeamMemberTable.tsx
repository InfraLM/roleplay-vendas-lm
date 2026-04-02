import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreVertical, 
  Shield, 
  UserCog, 
  User, 
  Target,
  Trash2,
  Loader2,
  Goal
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { SetUserGoalDialog } from "./SetUserGoalDialog";
import type { TeamMember, UserRole } from "@/hooks/useTeamManagement";
import type { UserGoal } from "@/hooks/useUserGoals";

interface TeamMemberTableProps {
  members: TeamMember[];
  isLoading: boolean;
  onUpdateRole: (userId: string, newRole: UserRole) => Promise<void>;
  onRemoveUser: (userId: string) => Promise<void>;
}

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  coach: { label: 'Coach', icon: UserCog, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  vendedor: { label: 'Vendedor', icon: User, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  sdr: { label: 'SDR', icon: Target, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

const TeamMemberTable = ({ members, isLoading, onUpdateRole, onRemoveUser }: TeamMemberTableProps) => {
  const { user } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberGoals, setMemberGoals] = useState<Record<string, UserGoal>>({});

  // Fetch goals for all members
  useEffect(() => {
    const fetchGoals = async () => {
      const userIds = members.map(m => m.user_id);
      if (userIds.length === 0) return;

      try {
        const data = await api.get<any[]>('/team/members/goals');

        if (data) {
          const goalsMap: Record<string, UserGoal> = {};
          data.forEach((g: any) => {
            const goal: UserGoal = {
              ...g,
              user_id: g.userId,
              is_active: g.isActive,
              created_at: g.createdAt,
              updated_at: g.updatedAt,
            };
            goalsMap[g.userId] = goal;
          });
          setMemberGoals(goalsMap);
        }
      } catch (error) {
        console.error('Error fetching member goals:', error);
      }
    };
    fetchGoals();
  }, [members]);

  const handleOpenGoalDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setGoalDialogOpen(true);
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      await onUpdateRole(userId, newRole);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async () => {
    if (!removingMember) return;
    setUpdatingId(removingMember.user_id);
    try {
      await onRemoveUser(removingMember.user_id);
    } finally {
      setUpdatingId(null);
      setRemovingMember(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum membro encontrado
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => {
                const role = roleConfig[member.role];
                const RoleIcon = role.icon;
                const isSelf = member.user_id === user?.id;
                const isUpdating = updatingId === member.user_id;

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={role.color}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {role.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {member.team || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status === 'active' ? 'Ativo' : member.status === 'pending' ? 'Pendente' : member.status || 'Ativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!isSelf && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreVertical className="w-4 h-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={member.role === 'admin'}
                              onClick={() => handleUpdateRole(member.user_id, 'admin')}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Tornar Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={member.role === 'coach'}
                              onClick={() => handleUpdateRole(member.user_id, 'coach')}
                            >
                              <UserCog className="w-4 h-4 mr-2" />
                              Tornar Coach
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={member.role === 'vendedor'}
                              onClick={() => handleUpdateRole(member.user_id, 'vendedor')}
                            >
                              <User className="w-4 h-4 mr-2" />
                              Tornar Vendedor
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={member.role === 'sdr'}
                              onClick={() => handleUpdateRole(member.user_id, 'sdr')}
                            >
                              <Target className="w-4 h-4 mr-2" />
                              Tornar SDR
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenGoalDialog(member)}>
                              <Goal className="w-4 h-4 mr-2" />
                              Definir Metas
                              {memberGoals[member.user_id] && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Ativo
                                </Badge>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setRemovingMember(member)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover da Equipe
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Remove Confirmation */}
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{removingMember?.name}" da equipe? 
              O usuário perderá acesso à organização.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Goal Dialog */}
      {selectedMember && (
        <SetUserGoalDialog
          open={goalDialogOpen}
          onOpenChange={setGoalDialogOpen}
          userId={selectedMember.user_id}
          userName={selectedMember.name}
          existingGoal={memberGoals[selectedMember.user_id] || null}
          onSuccess={() => {
            // Refresh goals
            const fetchGoals = async () => {
              try {
                const data = await api.get<any[]>('/team/members/goals');

                if (data) {
                  const goalsMap: Record<string, UserGoal> = {};
                  data.forEach((g: any) => {
                    const goal: UserGoal = {
                      ...g,
                      user_id: g.userId,
                      is_active: g.isActive,
                      created_at: g.createdAt,
                      updated_at: g.updatedAt,
                    };
                    goalsMap[g.userId] = goal;
                  });
                  setMemberGoals(goalsMap);
                }
              } catch (error) {
                console.error('Error fetching member goals:', error);
              }
            };
            fetchGoals();
          }}
        />
      )}
    </>
  );
};

export default TeamMemberTable;
