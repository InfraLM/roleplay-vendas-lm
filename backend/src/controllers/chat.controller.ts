import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { callAi, callAiLite, AiError } from '../services/ai.service';

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { roleplayId, message, turnNumber } = req.body;

    if (!roleplayId || !message || turnNumber === undefined) {
      throw new AppError(400, 'Dados incompletos');
    }

    if (message.length > 2000) {
      throw new AppError(400, 'Mensagem muito longa (máx 2000 caracteres)');
    }

    // Verify user owns this roleplay
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

    // Fetch message history
    const messageHistory = await prisma.message.findMany({
      where: { roleplayId },
      orderBy: { turnNumber: 'asc' },
      select: { sender: true, content: true },
    });

    // Fetch org prompt template or use fallback
    let systemPrompt = '';
    const promptTemplate = await prisma.promptTemplate.findFirst({
      where: { type: 'client', organizationId: roleplay.organizationId },
    });

    if (promptTemplate?.template) {
      systemPrompt = promptTemplate.template;
    } else {
      systemPrompt = `Você é um cliente potencial em uma simulação de vendas.

CONTEXTO DO SEGMENTO:
- Segmento: {{segment_name}}
- Descrição: {{segment_description}}
- Contexto: {{segment_context}}

SEU PERFIL DE CLIENTE:
- Tipo: {{profile_name}} ({{profile_display_name}})
- Estilo de Objeção: {{objection_style}}

REGRAS:
1. Responda SEMPRE em português brasileiro
2. Use linguagem de WhatsApp: mensagens curtas, informais, com emojis ocasionais
3. Seja realista - faça objeções naturais baseadas no seu perfil
4. NÃO revele que é uma IA ou simulação
5. Mantenha consistência com o perfil durante toda a conversa
6. Responda de forma concisa (máximo 3-4 frases por mensagem)`;
    }

    // Replace variables
    systemPrompt = systemPrompt
      .replace(/\{\{segment_name\}\}/g, segment?.name || '')
      .replace(/\{\{segment_description\}\}/g, segment?.description || '')
      .replace(/\{\{segment_context\}\}/g, segment?.promptContext || '')
      .replace(/\{\{profile_name\}\}/g, profile?.name || '')
      .replace(/\{\{profile_display_name\}\}/g, profile?.displayName || '')
      .replace(/\{\{objection_style\}\}/g, profile?.objectionStyle || '')
      .replace(/\$\{segment\.name\}/g, segment?.name || '')
      .replace(/\$\{segment\.description\}/g, segment?.description || '')
      .replace(/\$\{segment\.prompt_context\}/g, segment?.promptContext || '')
      .replace(/\$\{profile\.name\}/g, profile?.name || '')
      .replace(/\$\{profile\.display_name\}/g, profile?.displayName || '')
      .replace(/\$\{profile\.objection_style\}/g, profile?.objectionStyle || '');

    // Build messages array
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

    // Call AI
    const aiData = await callAi({ messages });
    const aiMessage = aiData.choices[0]?.message?.content || 'Desculpe, não entendi. Pode repetir?';

    // Generate coaching tip if guided mode
    let tip: string | null = null;
    if (isGuidedMode && message.length > 10) {
      try {
        const coachingPrompt = `Você é um coach de vendas experiente. Analise BREVEMENTE a última mensagem do vendedor e dê UMA dica construtiva de melhoria.

MENSAGEM DO VENDEDOR:
"${message}"

CONTEXTO:
- Segmento: ${segment?.name || 'Geral'}
- Perfil do cliente: ${profile?.displayName || 'Cliente'} (${profile?.objectionStyle || 'padrão'})

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

    // Save user message
    await prisma.message.create({
      data: { roleplayId, sender: 'user', content: message, turnNumber },
    });

    // Save AI message
    await prisma.message.create({
      data: { roleplayId, sender: 'ai', content: aiMessage, turnNumber: turnNumber + 1 },
    });

    // Update roleplay message count
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
