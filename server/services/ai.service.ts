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

// Extract system messages from the array (Anthropic uses a separate "system" field)
function extractSystem(messages: AiChatMessage[]) {
  const systemMessages = messages.filter((m) => m.role === 'system');
  const otherMessages = messages.filter((m) => m.role !== 'system');
  return {
    system: systemMessages.map((m) => m.content).join('\n\n'),
    messages: otherMessages,
  };
}

// Convert OpenAI tools format to Anthropic format
function toAnthropicTools(tools: any[]) {
  return tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters,
  }));
}

// Convert OpenAI tool_choice to Anthropic format
function toAnthropicToolChoice(toolChoice: any) {
  if (toolChoice?.type === 'function' && toolChoice?.function?.name) {
    return { type: 'tool', name: toolChoice.function.name };
  }
  return toolChoice;
}

// Convert Anthropic response back to OpenAI-like format (so controllers don't change)
function toOpenAiResponse(anthropicRes: any): AiResponse {
  const content: any[] = anthropicRes.content || [];

  const textBlock = content.find((c: any) => c.type === 'text');
  const toolBlocks = content.filter((c: any) => c.type === 'tool_use');

  const message: any = {
    content: textBlock?.text || null,
  };

  if (toolBlocks.length > 0) {
    message.tool_calls = toolBlocks.map((tc: any) => ({
      function: {
        name: tc.name,
        arguments: JSON.stringify(tc.input),
      },
    }));
  }

  return { choices: [{ message }] };
}

export async function callAi(options: AiCompletionOptions): Promise<AiResponse> {
  const { messages, model, tools, toolChoice } = options;

  const { system, messages: userMessages } = extractSystem(messages);

  const body: any = {
    model: model || env.AI_MODEL,
    max_tokens: 4096,
    messages: userMessages,
  };

  if (system) body.system = system;
  if (tools) body.tools = toAnthropicTools(tools);
  if (toolChoice) body.tool_choice = toAnthropicToolChoice(toolChoice);

  const response = await fetch(env.AI_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': env.AI_API_KEY,
      'anthropic-version': '2023-06-01',
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

  const anthropicData = await response.json();
  return toOpenAiResponse(anthropicData);
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
