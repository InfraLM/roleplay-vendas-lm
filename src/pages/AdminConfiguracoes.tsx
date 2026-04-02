import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import PromptEditor from "@/components/admin/PromptEditor";
import PromptTester from "@/components/admin/PromptTester";
import { usePromptManager } from "@/hooks/usePromptManager";
import { useAuth } from "@/hooks/useAuth";

const AdminConfiguracoes = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    prompts,
    isLoading,
    isTesting,
    getPromptByType,
    updatePrompt,
    testPrompt,
    getDefaultClientPrompt,
    getDefaultEvaluationPrompt,
    clientVariables,
    evaluationVariables
  } = usePromptManager();

  const clientPrompt = getPromptByType('client');
  const evaluationPrompt = getPromptByType('evaluation');

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

  const handleSaveClientPrompt = async (template: string) => {
    if (!clientPrompt) return;
    setIsSaving(true);
    try {
      await updatePrompt(clientPrompt.id, template);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEvaluationPrompt = async (template: string) => {
    if (!evaluationPrompt) return;
    setIsSaving(true);
    try {
      await updatePrompt(evaluationPrompt.id, template);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Carregando prompts...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <span className="gradient-text">Configurações</span> de Prompts
          </h1>
          <p className="text-muted-foreground">
            Personalize os prompts de IA para simulações e avaliações
          </p>
        </div>

        <Tabs defaultValue="client" className="animate-scale-in">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="client" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Prompt do Cliente
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Prompt de Avaliação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <PromptEditor
                  template={clientPrompt?.template || getDefaultClientPrompt()}
                  defaultTemplate={getDefaultClientPrompt()}
                  variables={clientVariables}
                  onSave={handleSaveClientPrompt}
                  isSaving={isSaving}
                />
              </div>
              <div>
                <PromptTester
                  type="client"
                  template={clientPrompt?.template || getDefaultClientPrompt()}
                  onTest={testPrompt}
                  isTesting={isTesting}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evaluation" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <PromptEditor
                  template={evaluationPrompt?.template || getDefaultEvaluationPrompt()}
                  defaultTemplate={getDefaultEvaluationPrompt()}
                  variables={evaluationVariables}
                  onSave={handleSaveEvaluationPrompt}
                  isSaving={isSaving}
                />
              </div>
              <div>
                <PromptTester
                  type="evaluation"
                  template={evaluationPrompt?.template || getDefaultEvaluationPrompt()}
                  onTest={testPrompt}
                  isTesting={isTesting}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminConfiguracoes;
