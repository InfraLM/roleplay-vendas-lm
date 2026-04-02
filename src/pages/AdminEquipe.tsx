import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Layers, UserCircle, Settings, Building, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/DashboardLayout";
import TeamMemberTable from "@/components/admin/TeamMemberTable";
import CreateUserForm, { CreateUserData } from "@/components/admin/CreateUserForm";
import { useTeamManagement, UserRole } from "@/hooks/useTeamManagement";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AdminEquipe = () => {
  const navigate = useNavigate();
  const { role, profile, user } = useAuth();
  const { toast } = useToast();
  const [segmentsCount, setSegmentsCount] = useState(0);
  const [clientProfilesCount, setClientProfilesCount] = useState(0);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [registrationSettingsId, setRegistrationSettingsId] = useState<string | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  
  const {
    members,
    isLoading,
    updateUserRole,
    removeUser,
    getRoleCounts,
    refetch
  } = useTeamManagement();

  const counts = getRoleCounts();

  // Fetch additional counts and registration settings
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [segments, profiles] = await Promise.all([
          api.get<any[]>('/segments'),
          api.get<any[]>('/client-profiles'),
        ]);
        setSegmentsCount(segments?.length || 0);
        setClientProfilesCount(profiles?.length || 0);
      } catch { /* ignore */ }
    };

    const fetchRegistrationSettings = async () => {
      try {
        const data = await api.get<{ id?: string; registrationEnabled?: boolean }>('/system/settings');
        if (data) {
          setRegistrationSettingsId(data.id || null);
          setRegistrationEnabled(data.registrationEnabled ?? true);
        }
      } catch { /* ignore */ }
    };

    fetchCounts();
    fetchRegistrationSettings();
  }, []);

  const handleToggleRegistration = async (checked: boolean) => {
    setRegistrationLoading(true);
    try {
      await api.put('/system/settings', { registrationEnabled: checked });

      setRegistrationEnabled(checked);
      toast({
        title: checked ? "Registro habilitado" : "Registro desabilitado",
        description: checked
          ? "Novos usuários podem se cadastrar na plataforma."
          : "Novos cadastros foram bloqueados.",
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao atualizar configuração",
        variant: "destructive",
      });
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Check admin access
  if (role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground mb-4">
              Apenas administradores podem acessar esta página.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleCreateUser = async (data: CreateUserData) => {
    try {
      await api.post('/team/invite', {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
        phone: data.phone,
        team: data.team,
        notes: data.notes,
      });

      toast({
        title: "Usuário criado!",
        description: `${data.name} foi adicionado à equipe como ${data.role === "admin" ? "Administrador" : "Closer"}.`,
      });

      refetch();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao criar usuário",
        variant: "destructive",
      });
      throw err;
    }
  };

  const stats = [
    { 
      label: "Total de Usuários", 
      value: counts.total, 
      subtitle: `${counts.active} ativos • ${counts.pending} pendentes`,
      icon: Users, 
      color: "text-primary" 
    },
    { 
      label: "Segmentos", 
      value: segmentsCount, 
      subtitle: "Configurados",
      icon: Layers, 
      color: "text-blue-400" 
    },
    { 
      label: "Perfis de Cliente", 
      value: clientProfilesCount, 
      subtitle: "Configurados",
      icon: UserCircle, 
      color: "text-green-400" 
    },
    { 
      label: "Configurações", 
      value: 4, 
      subtitle: "Seções ativas",
      icon: Settings, 
      color: "text-purple-400" 
    },
  ];

  const userName = profile?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Admin";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerenciar Equipe</h1>
            <p className="text-muted-foreground">
              Gerencie todos os aspectos da sua organização
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 w-fit px-3 py-1.5">
            <Building className="h-4 w-4" />
            Organização de {userName}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-card/50 border-border/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                      <p className="text-xs text-muted-foreground/70 truncate">{stat.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Registration Toggle */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex items-center justify-between pt-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <Label htmlFor="registration-toggle" className="text-sm font-medium cursor-pointer">
                  Permitir novos cadastros
                </Label>
                <p className="text-xs text-muted-foreground">
                  {registrationEnabled
                    ? "Novos usuários podem se registrar na plataforma"
                    : "Cadastros bloqueados — apenas convites do admin"}
                </p>
              </div>
            </div>
            <Switch
              id="registration-toggle"
              checked={registrationEnabled}
              onCheckedChange={handleToggleRegistration}
              disabled={registrationLoading}
            />
          </CardContent>
        </Card>

        {/* Create User Card */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Gerenciamento de Equipe</CardTitle>
            <CardDescription>Convide e gerencie membros da sua organização</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateUserForm onSubmit={handleCreateUser} />
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Membros da Equipe</CardTitle>
            <CardDescription>Lista de todos os membros da sua organização</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMemberTable
              members={members}
              isLoading={isLoading}
              onUpdateRole={updateUserRole}
              onRemoveUser={removeUser}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminEquipe;
