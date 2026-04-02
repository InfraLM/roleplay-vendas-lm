import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { callAi, callAiLite, AiError } from '../services/ai.service';

const SALES_OBJECTIVE_CONTEXT: Record<string, { vendedorLabel: string; objetivoCliente: string }> = {
  qualificacao: {
    vendedorLabel: 'SDR (pré-vendedor)',
    objetivoCliente: 'O vendedor está tentando AGENDAR UMA REUNIÃO e qualificar você como lead. Ele NÃO deve tentar fechar a venda agora — o objetivo dele é despertar seu interesse e marcar uma conversa mais aprofundada com um closer. Comporte-se como alguém que está sendo abordado pela primeira vez e ainda não conhece bem o produto.',
  },
  fechamento: {
    vendedorLabel: 'Closer (fechador)',
    objetivoCliente: 'O vendedor é um closer tentando FECHAR A VENDA com você. Você já teve um contato inicial (com um SDR) e já demonstrou algum interesse. Agora o closer vai apresentar a proposta completa, negociar valores e condições. Faça perguntas sobre preço, condições, garantias e compare com concorrentes.',
  },
  completo: {
    vendedorLabel: 'Vendedor',
    objetivoCliente: 'O vendedor está conduzindo todo o processo de venda — desde a qualificação até o fechamento. Comporte-se naturalmente, começando com pouco conhecimento do produto e evoluindo conforme a conversa avança.',
  },
};

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { roleplayId, message, turnNumber } = req.body;

    if (!roleplayId || !message || turnNumber === undefined) {
      throw new AppError(400, 'Dados incompletos');
    }

    if (message.length > 2000) {
      throw new AppError(400, 'Mensagem muito longa (máx 2000 caracteres)');
    }

    const roleplay = await prisma.roleplay.findFirst({
      where: { id: roleplayId, userId },
      include: {
        segment: true,
        clientProfile: true,
      },
    });

    if (!roleplay) throw new AppError(404, 'Roleplay não encontrado');
    if (roleplay.status !== 'active') throw new AppError(400, 'Este roleplay já foi finalizado');

    const isGuidedMode = roleplay.guidedMode === true;
    const segment = roleplay.segment;
    const profile = roleplay.clientProfile;

    // Determine sales objective context based on product config + user role
    const productObjective = segment?.salesObjective || 'completo';
    let effectiveObjective = productObjective;
    if (productObjective === 'completo') {
      // If product supports both, use user's role to determine
      if (userRole === 'sdr') effectiveObjective = 'qualificacao';
      else if (userRole === 'closer') effectiveObjective = 'fechamento';
    }
    const objContext = SALES_OBJECTIVE_CONTEXT[effectiveObjective] || SALES_OBJECTIVE_CONTEXT.completo;

    const messageHistory = await prisma.message.findMany({
      where: { roleplayId },
      orderBy: { turnNumber: 'asc' },
      select: { sender: true, content: true },
    });

    let systemPrompt = '';
    const promptTemplate = await prisma.promptTemplate.findFirst({
      where: { type: 'client', organizationId: roleplay.organizationId },
    });

    if (promptTemplate?.template) {
      systemPrompt = promptTemplate.template;
    } else {
      systemPrompt = `Você é um cliente potencial em uma simulação de vendas.

PRODUTO:
- Nome: {{segment_name}}
- Descrição: {{segment_description}}
- Contexto: {{segment_context}}

PAPEL DO VENDEDOR: {{vendedor_label}}
OBJETIVO DA SIMULAÇÃO: {{objetivo_cliente}}

SEU PERFIL DE CLIENTE:
- Tipo: {{profile_name}} ({{profile_display_name}})
- Estilo de Objeção: {{objection_style}}

REGRAS:
1. Responda SEMPRE em português brasileiro
2. Use linguagem de WhatsApp: mensagens curtas, informais, com emojis ocasionais
3. Seja realista - faça objeções naturais baseadas no seu perfil
4. NÃO revele que é uma IA ou simulação
5. Mantenha consistência com o perfil durante toda a conversa
6. Responda de forma concisa (máximo 3-4 frases por mensagem)
7. Adapte suas respostas ao objetivo da simulação descrito acima`;
    }

    systemPrompt = systemPrompt
      .replace(/\{\{segment_name\}\}/g, segment?.name || '')
      .replace(/\{\{segment_description\}\}/g, segment?.description || '')
      .replace(/\{\{segment_context\}\}/g, segment?.promptContext || '')
      .replace(/\{\{profile_name\}\}/g, profile?.name || '')
      .replace(/\{\{profile_display_name\}\}/g, profile?.displayName || '')
      .replace(/\{\{objection_style\}\}/g, profile?.objectionStyle || '')
      .replace(/\{\{vendedor_label\}\}/g, objContext.vendedorLabel)
      .replace(/\{\{objetivo_cliente\}\}/g, objContext.objetivoCliente)
      .replace(/\$\{segment\.name\}/g, segment?.name || '')
      .replace(/\$\{segment\.description\}/g, segment?.description || '')
      .replace(/\$\{segment\.prompt_context\}/g, segment?.promptContext || '')
      .replace(/\$\{profile\.name\}/g, profile?.name || '')
      .replace(/\$\{profile\.display_name\}/g, profile?.displayName || '')
      .replace(/\$\{profile\.objection_style\}/g, profile?.objectionStyle || '');

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of messageHistory) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    messages.push({ role: 'user', content: message });

    const aiData = await callAi({ messages });
    const aiMessage = aiData.choices[0]?.message?.content || 'Desculpe, não entendi. Pode repetir?';

    let tip: string | null = null;
    if (isGuidedMode && message.length > 10) {
      try {
        const coachingPrompt = `Você é um coach de vendas experiente. Analise BREVEMENTE a última mensagem do vendedor e dê UMA dica construtiva de melhoria.

MENSAGEM DO VENDEDOR:
"${message}"

CONTEXTO:
- Produto: ${segment?.name || 'Geral'}
- Perfil do cliente: ${profile?.displayName || 'Cliente'} (${profile?.objectionStyle || 'padrão'})
- Papel do vendedor: ${objContext.vendedorLabel}

REGRAS:
1. Seja MUITO conciso (máximo 2 frases)
2. Foque em UMA única melhoria
3. Seja positivo e encorajador
4. Use linguagem simples
5. Dê exemplo prático quando possível`;

        const coachingData = await callAiLite([{ role: 'user', content: coachingPrompt }]);
        tip = coachingData.choices[0]?.message?.content || null;
      } catch {
        // Don't fail if coaching tip fails
      }
    }

    await prisma.message.create({
      data: { roleplayId, sender: 'user', content: message, turnNumber },
    });

    await prisma.message.create({
      data: { roleplayId, sender: 'ai', content: aiMessage, turnNumber: turnNumber + 1 },
    });

    await prisma.roleplay.update({
      where: { id: roleplayId },
      data: { messageCount: turnNumber + 2 },
    });

    res.json({ message: aiMessage, turnNumber: turnNumber + 1, tip });
  } catch (err) {
    if (err instanceof AiError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}
