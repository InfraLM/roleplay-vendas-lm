import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Eye, Bot, Loader2 } from "lucide-react";
import type { PromptType, TestPromptData } from "@/hooks/usePromptManager";

interface PromptTesterProps {
  type: PromptType;
  template: string;
  onTest: (
    type: PromptType,
    template: string,
    testData: TestPromptData,
    executeAI: boolean
  ) => Promise<{ renderedPrompt: string; aiResponse: string | null }>;
  isTesting: boolean;
}

const PromptTester = ({ type, template, onTest, isTesting }: PromptTesterProps) => {
  const [testData, setTestData] = useState<TestPromptData>({
    segment: {
      name: 'E-commerce B2C',
      description: 'Loja online de varejo',
      prompt_context: 'Cliente interessado em comprar produtos online'
    },
    profile: {
      name: 'soft',
      display_name: 'Cliente Receptivo',
      objection_style: 'Faz poucas objeções e demonstra interesse genuíno'
    },
    transcript: '[VENDEDOR]: Olá, tudo bem?\n[CLIENTE]: Oi, tudo! Queria saber mais sobre...',
    userMessage: 'Olá, estou interessado em conhecer mais sobre a solução.'
  });

  const [renderedPrompt, setRenderedPrompt] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleRender = async () => {
    const result = await onTest(type, template, testData, false);
    setRenderedPrompt(result.renderedPrompt);
    setAiResponse(null);
  };

  const handleTestWithAI = async () => {
    const result = await onTest(type, template, testData, true);
    setRenderedPrompt(result.renderedPrompt);
    setAiResponse(result.aiResponse);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Testar Prompt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="variables">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="variables">Variáveis de Teste</TabsTrigger>
            <TabsTrigger value="result">Resultado</TabsTrigger>
          </TabsList>

          <TabsContent value="variables" className="space-y-4 pt-4">
            {type === 'client' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Segmento</Label>
                    <Input
                      value={testData.segment?.name || ''}
                      onChange={(e) => setTestData({
                        ...testData,
                        segment: { ...testData.segment!, name: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Perfil</Label>
                    <Input
                      value={testData.profile?.display_name || ''}
                      onChange={(e) => setTestData({
                        ...testData,
                        profile: { ...testData.profile!, display_name: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição do Segmento</Label>
                  <Textarea
                    value={testData.segment?.description || ''}
                    onChange={(e) => setTestData({
                      ...testData,
                      segment: { ...testData.segment!, description: e.target.value }
                    })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contexto do Segmento</Label>
                  <Textarea
                    value={testData.segment?.prompt_context || ''}
                    onChange={(e) => setTestData({
                      ...testData,
                      segment: { ...testData.segment!, prompt_context: e.target.value }
                    })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estilo de Objeção</Label>
                  <Textarea
                    value={testData.profile?.objection_style || ''}
                    onChange={(e) => setTestData({
                      ...testData,
                      profile: { ...testData.profile!, objection_style: e.target.value }
                    })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mensagem do Usuário (para teste com IA)</Label>
                  <Input
                    value={testData.userMessage || ''}
                    onChange={(e) => setTestData({
                      ...testData,
                      userMessage: e.target.value
                    })}
                    placeholder="Olá, estou interessado..."
                  />
                </div>
              </>
            )}

            {type === 'evaluation' && (
              <div className="space-y-2">
                <Label>Transcrição da Conversa</Label>
                <Textarea
                  value={testData.transcript || ''}
                  onChange={(e) => setTestData({
                    ...testData,
                    transcript: e.target.value
                  })}
                  rows={8}
                  placeholder="[VENDEDOR]: ...\n[CLIENTE]: ..."
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleRender}
                disabled={isTesting}
              >
                <Eye className="w-4 h-4 mr-2" />
                Renderizar
              </Button>
              <Button
                onClick={handleTestWithAI}
                disabled={isTesting}
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4 mr-2" />
                )}
                Testar com IA
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-4 pt-4">
            {renderedPrompt ? (
              <>
                <div className="space-y-2">
                  <Label>Prompt Renderizado</Label>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {renderedPrompt}
                    </pre>
                  </div>
                </div>

                {aiResponse && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" />
                      Resposta da IA
                    </Label>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Clique em "Renderizar" ou "Testar com IA" para ver o resultado</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PromptTester;
