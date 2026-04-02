import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export type PromptType = 'client' | 'evaluation';

export interface PromptTemplate {
  id: string;
  type: string;
  template: string;
  variables: any;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestPromptData {
  segment?: {
    name: string;
    description: string;
    prompt_context: string;
  };
  profile?: {
    name: string;
    display_name: string;
    objection_style: string;
  };
  transcript?: string;
  userMessage?: string;
  custom?: Record<string, string>;
}

export const usePromptManager = () => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchPrompts = async () => {
    if (!profile?.organization_id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<PromptTemplate[]>('/prompts');
      setPrompts(data || []);
    } catch (err: any) {
      console.error('Error fetching prompts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [profile?.organization_id]);

  const getPromptByType = (type: PromptType): PromptTemplate | undefined => {
    return prompts.find(p => p.type === type);
  };

  const updatePrompt = async (id: string, template: string): Promise<void> => {
    try {
      await api.put(`/prompts/${id}`, { template: template.trim() });

      toast({
        title: "Prompt salvo",
        description: "Template atualizado com sucesso",
      });

      await fetchPrompts();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar prompt",
        variant: "destructive",
      });
      throw err;
    }
  };

  const testPrompt = async (
    type: PromptType,
    template: string,
    testData: TestPromptData,
    executeAI: boolean = false
  ): Promise<{ renderedPrompt: string; aiResponse: string | null }> => {
    setIsTesting(true);
    try {
      const data = await api.post<{ renderedPrompt: string; aiResponse: string | null }>('/prompts/test', {
        type, template, testData, executeAI
      });

      if (executeAI && data.aiResponse) {
        toast({
          title: "Teste concluído",
          description: "Resposta da IA gerada com sucesso",
        });
      }

      return {
        renderedPrompt: data.renderedPrompt,
        aiResponse: data.aiResponse
      };
    } catch (err: any) {
      toast({
        title: "Erro no teste",
        description: err.message || "Erro ao testar prompt",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsTesting(false);
    }
  };

  const getDefaultClientPrompt = (): string => {
    return `Você está simulando um CLIENTE POTENCIAL em uma conversa de vendas por WhatsApp.

## SEU PAPEL (IA)
Você é um profissional do segmento {{segment.name}} ({{segment.description}}).
{{segment.prompt_context}}

Você está sendo abordado por um VENDEDOR que quer te oferecer produtos/serviços. Você é um potencial COMPRADOR avaliando se faz sentido contratar.

## SEU PERFIL DE COMPORTAMENTO
Tipo: {{profile.display_name}}
Estilo de objeções: {{profile.objection_style}}

## REGRAS IMPORTANTES
1. Você é o CLIENTE - nunca ofereça produtos ou serviços
2. O VENDEDOR (humano) é quem vai tentar te convencer a comprar
3. Responda SEMPRE em português brasileiro
4. Use linguagem de WhatsApp: mensagens curtas, informais, com emojis ocasionais
5. Faça perguntas sobre preços, prazos, garantias, resultados esperados
6. Apresente objeções naturais baseadas no seu perfil de comportamento
7. NÃO revele que é uma simulação
8. Máximo 3-4 frases por mensagem

## CONTEXTO DA CONVERSA
O vendedor entrou em contato oferecendo uma solução. Você está avaliando se vale a pena ou não.`;
  };

  const getDefaultEvaluationPrompt = (): string => {
    return `Você é um AVALIADOR RIGOROSO de vendedores. Analise a conversa abaixo com critério profissional.

CONTEXTO:
- Segmento: {{segment_name}}
- Perfil do Cliente: {{profile_display_name}}
- Estilo de Objeção: {{objection_style}}

TRANSCRIÇÃO:
{{transcript}}

## CRITÉRIOS DE AVALIAÇÃO (seja rigoroso!)

### RAPPORT (0-100)
- 0-30: Abordagem invasiva, rude ou impessoal. Perguntar sobre dinheiro/faturamento logo de cara.
- 31-60: Tentativa fraca de conexão, sem personalização ou empatia genuína.
- 61-80: Boa conexão inicial, algumas perguntas pessoais, interesse demonstrado.
- 81-100: Conexão excelente, cliente engajado, rapport natural e autêntico.

### ESCUTA ATIVA (0-100)
- 0-30: Ignora respostas do cliente, não faz perguntas de follow-up, fala mais que escuta.
- 31-60: Escuta superficial, poucas perguntas de aprofundamento.
- 61-80: Boas perguntas, demonstra compreensão das necessidades.
- 81-100: Escuta excepcional, resume necessidades, faz perguntas poderosas.

### CLAREZA (0-100)
- 0-30: Confuso, vago, ou grosseiro disfarçado de "direto".
- 31-60: Comunicação básica, falta estrutura ou exemplos.
- 61-80: Clara e organizada, com alguns exemplos práticos.
- 81-100: Comunicação impecável com storytelling e exemplos relevantes.

### PERSUASÃO (0-100)
- 0-30: Nenhuma técnica, arrogância, ou "pegar ou largar".
- 31-60: Gatilhos básicos sem personalização para o cliente.
- 61-80: Bons argumentos focados em benefícios específicos.
- 81-100: Persuasão sofisticada com prova social, urgência e valor claro.

### OBJEÇÕES (0-100)
- 0-30: Ignora objeções ou responde com arrogância.
- 31-60: Tenta responder mas não resolve a preocupação real.
- 61-80: Responde bem com argumentos e contorna objeções.
- 81-100: Antecipa objeções e transforma em oportunidades.

### FECHAMENTO (0-100)
- 0-30: Não tenta fechar ou abandona a conversa.
- 31-60: Tentativa fraca sem próximo passo claro.
- 61-80: Propõe próximos passos e tenta compromisso.
- 81-100: Fechamento elegante com compromisso claro do cliente.

## PENALIZAÇÕES AUTOMÁTICAS
- Perguntar faturamento/dinheiro nas primeiras 3 mensagens: -30 pontos em Rapport
- Ser grosseiro, arrogante ou impaciente: -30 pontos em Rapport e Persuasão
- Não fazer perguntas de descoberta: -20 pontos em Escuta
- Mensagens muito curtas sem valor: -20 pontos em Clareza
- Ignorar objeções do cliente: -25 pontos em Objeções

## REGRAS DE PONTUAÇÃO
- SEJA RIGOROSO! Vendedores medíocres devem receber notas medíocres (40-60).
- Notas acima de 80 são APENAS para performance EXCEPCIONAL.

IMPORTANTE: Responda APENAS com JSON válido.`;
  };

  const clientVariables = [
    '{{segment.name}}',
    '{{segment.description}}',
    '{{segment.prompt_context}}',
    '{{profile.name}}',
    '{{profile.display_name}}',
    '{{profile.objection_style}}'
  ];

  const evaluationVariables = [
    '{{transcript}}',
    '{{segment.name}}',
    '{{profile.name}}',
    '{{profile.display_name}}'
  ];

  return {
    prompts,
    isLoading,
    isTesting,
    error,
    getPromptByType,
    updatePrompt,
    testPrompt,
    getDefaultClientPrompt,
    getDefaultEvaluationPrompt,
    clientVariables,
    evaluationVariables,
    refetch: fetchPrompts
  };
};
