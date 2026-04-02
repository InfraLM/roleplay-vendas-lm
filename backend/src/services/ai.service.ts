import { env } from '../config/env';
import { AiChatMessage } from '../types';

interface AiCompletionOptions {
  messages: AiChatMessage[];
  model?: string;
  tools?: any[];
  toolChoice?: any;
}

interface AiResponse {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: Array<{
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  }>;
}

export async function callAi(options: AiCompletionOptions): Promise<AiResponse> {
  const { messages, model, tools, toolChoice } = options;

  const body: any = {
    model: model || env.AI_MODEL,
    messages,
  };

  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const response = await fetch(env.AI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);

    if (response.status === 429) {
      throw new AiError(429, 'Limite de requisições excedido. Aguarde um momento e tente novamente.');
    }
    if (response.status === 402) {
      throw new AiError(402, 'Créditos de IA esgotados. Entre em contato com o administrador.');
    }
    throw new AiError(500, 'Erro ao processar resposta da IA');
  }

  return response.json() as Promise<AiResponse>;
}

export async function callAiLite(messages: AiChatMessage[]): Promise<AiResponse> {
  return callAi({ messages, model: env.AI_MODEL_LITE });
}

export class AiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AiError';
  }
}
