import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import SegmentList from "@/components/admin/SegmentList";
import ClientProfileList from "@/components/admin/ClientProfileList";
import { useSegmentManager } from "@/hooks/useSegmentManager";
import { useClientProfileManager } from "@/hooks/useClientProfileManager";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const AdminCenarios = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const {
    segments,
    isLoading: segmentsLoading,
    createSegment,
    updateSegment,
    deleteSegment
  } = useSegmentManager();

  const {
    profiles,
    isLoading: profilesLoading,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfileTypeColor,
    getProfileTypeLabel
  } = useClientProfileManager();

  // Check admin access
  if (role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground mb-4">
              Apenas administradores podem acessar esta página.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <span className="gradient-text">Cenários</span> de Roleplay
          </h1>
          <p className="text-muted-foreground">
            Gerencie segmentos de mercado e perfis de cliente
          </p>
        </div>

        <Tabs defaultValue="segments" className="animate-scale-in">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="segments">Segmentos</TabsTrigger>
            <TabsTrigger value="profiles">Perfis de Cliente</TabsTrigger>
          </TabsList>

          <TabsContent value="segments" className="mt-6">
            <SegmentList
              segments={segments}
              isLoading={segmentsLoading}
              onCreate={createSegment}
              onUpdate={updateSegment}
              onDelete={deleteSegment}
            />
          </TabsContent>

          <TabsContent value="profiles" className="mt-6">
            <ClientProfileList
              profiles={profiles}
              isLoading={profilesLoading}
              onCreate={createProfile}
              onUpdate={updateProfile}
              onDelete={deleteProfile}
              getTypeColor={getProfileTypeColor}
              getTypeLabel={getProfileTypeLabel}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminCenarios;
