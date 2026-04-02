import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { callAi, AiError } from '../services/ai.service';
import { normalizeScore, getRadarStatus } from '../utils/scoreNormalizer';
import { generateVoucherCode } from '../utils/voucherCode';

const VOUCHER_THRESHOLD = 75;

const evaluationTool = {
  type: 'function' as const,
  function: {
    name: 'evaluate_sales_performance',
    description: 'Avalia a performance do vendedor no roleplay',
    parameters: {
      type: 'object',
      properties: {
        scores: {
          type: 'object',
          properties: {
            rapport: { type: 'number', minimum: 0, maximum: 100 },
            escuta: { type: 'number', minimum: 0, maximum: 100 },
            clareza: { type: 'number', minimum: 0, maximum: 100 },
            persuasao: { type: 'number', minimum: 0, maximum: 100 },
            objecoes: { type: 'number', minimum: 0, maximum: 100 },
            fechamento: { type: 'number', minimum: 0, maximum: 100 },
          },
          required: ['rapport', 'escuta', 'clareza', 'persuasao', 'objecoes', 'fechamento'],
        },
        feedback_competencias: {
          type: 'object',
          properties: {
            rapport: { type: 'string' },
            escuta: { type: 'string' },
            clareza: { type: 'string' },
            persuasao: { type: 'string' },
            objecoes: { type: 'string' },
            fechamento: { type: 'string' },
          },
          required: ['rapport', 'escuta', 'clareza', 'persuasao', 'objecoes', 'fechamento'],
        },
        score_overall: { type: 'number', minimum: 0, maximum: 100 },
        close_probability: { type: 'number', minimum: 0, maximum: 100 },
        pontos_fortes: { type: 'array', items: { type: 'string' } },
        areas_melhoria: { type: 'array', items: { type: 'string' } },
        feedback_geral: { type: 'string' },
        proximos_passos: { type: 'array', items: { type: 'string' } },
      },
      required: ['scores', 'feedback_competencias', 'score_overall', 'close_probability', 'pontos_fortes', 'areas_melhoria', 'feedback_geral', 'proximos_passos'],
    },
  },
};

export async function evaluate(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { roleplayId } = req.params;

    const roleplay = await prisma.roleplay.findFirst({
      where: { id: roleplayId, userId },
      include: { segment: true, clientProfile: true },
    });

    if (!roleplay) throw new AppError(404, 'Roleplay não encontrado');

    const messages = await prisma.message.findMany({
      where: { roleplayId },
      orderBy: { turnNumber: 'asc' },
    });

    if (messages.length < 4) {
      throw new AppError(400, 'Conversa muito curta para avaliação. Mínimo de 4 mensagens.');
    }

    const transcript = messages
      .map((m) => `[${m.sender === 'user' ? 'VENDEDOR' : 'CLIENTE'}]: ${m.content}`)
      .join('\n');

    // Fetch evaluation prompt template
    let evaluationPrompt = '';
    const promptTemplate = await prisma.promptTemplate.findFirst({
      where: { type: 'evaluation', organizationId: roleplay.organizationId },
    });

    if (promptTemplate?.template) {
      evaluationPrompt = promptTemplate.template;
    } else {
      evaluationPrompt = `Você é um AVALIADOR RIGOROSO de vendedores. Analise a conversa abaixo com critério profissional.

CONTEXTO:
- Produto: {{segment_name}}
- Perfil do Cliente: {{profile_display_name}}
- Estilo de Objeção: {{objection_style}}
- Objetivo da Venda: {{sales_objective_label}}

TRANSCRIÇÃO:
{{transcript}}

## CRITÉRIOS DE AVALIAÇÃO (0-100 cada)
RAPPORT, ESCUTA ATIVA, CLAREZA, PERSUASÃO, OBJEÇÕES, FECHAMENTO

## REGRAS DE PONTUAÇÃO
- SEJA RIGOROSO! Vendedores medíocres devem receber notas medíocres (40-60).
- Notas acima de 80 são APENAS para performance EXCEPCIONAL.
- Avalie de acordo com o OBJETIVO: se é qualificação (SDR), valorize a capacidade de agendar reunião e qualificar. Se é fechamento (Closer), valorize negociação e fechamento.

IMPORTANTE: Responda APENAS com JSON válido.`;
    }

    const segment = roleplay.segment;
    const salesObjLabels: Record<string, string> = {
      qualificacao: 'Qualificação / Agendamento de reunião (SDR)',
      fechamento: 'Fechamento de venda (Closer)',
      completo: 'Venda completa (qualificação + fechamento)',
    };
    const profile = roleplay.clientProfile;

    evaluationPrompt = evaluationPrompt
      .replace(/\{\{segment_name\}\}/g, segment?.name || '')
      .replace(/\{\{profile_name\}\}/g, profile?.name || '')
      .replace(/\{\{profile_display_name\}\}/g, profile?.displayName || '')
      .replace(/\{\{objection_style\}\}/g, profile?.objectionStyle || '')
      .replace(/\{\{transcript\}\}/g, transcript)
      .replace(/\{\{sales_objective_label\}\}/g, salesObjLabels[segment?.salesObjective || 'completo'] || salesObjLabels.completo);

    // Call AI with tool calling
    const aiData = await callAi({
      messages: [
        { role: 'system', content: 'Você é um avaliador especializado em técnicas de vendas. Sempre responda com JSON válido.' },
        { role: 'user', content: evaluationPrompt },
      ],
      tools: [evaluationTool],
      toolChoice: { type: 'function', function: { name: 'evaluate_sales_performance' } },
    });

    // Parse evaluation
    let evaluation: any;
    try {
      const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        evaluation = JSON.parse(toolCall.function.arguments);
      } else {
        const aiContent = aiData.choices[0]?.message?.content || '';
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          evaluation = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('JSON não encontrado na resposta');
        }
      }
    } catch {
      evaluation = {
        scores: { rapport: 70, escuta: 70, clareza: 70, persuasao: 70, objecoes: 70, fechamento: 70 },
        feedback_competencias: {
          rapport: 'Avaliação não disponível.', escuta: 'Avaliação não disponível.',
          clareza: 'Avaliação não disponível.', persuasao: 'Avaliação não disponível.',
          objecoes: 'Avaliação não disponível.', fechamento: 'Avaliação não disponível.',
        },
        score_overall: 70, close_probability: 50,
        pontos_fortes: ['Participação na simulação'],
        areas_melhoria: ['Continuar praticando'],
        feedback_geral: 'Avaliação não pôde ser processada completamente. Continue praticando!',
        proximos_passos: ['Fazer mais simulações'],
      };
    }

    // Normalize scores
    evaluation.score_overall = normalizeScore(evaluation.score_overall);
    evaluation.close_probability = normalizeScore(evaluation.close_probability);
    if (evaluation.scores) {
      evaluation.scores = {
        rapport: normalizeScore(evaluation.scores.rapport || 0),
        escuta: normalizeScore(evaluation.scores.escuta || 0),
        clareza: normalizeScore(evaluation.scores.clareza || 0),
        persuasao: normalizeScore(evaluation.scores.persuasao || 0),
        objecoes: normalizeScore(evaluation.scores.objecoes || 0),
        fechamento: normalizeScore(evaluation.scores.fechamento || 0),
      };
    }

    const radarStatus = getRadarStatus(evaluation.score_overall);

    const htmlReport = `<div class="report"><h1>Avaliação de Performance</h1><p>Score Geral: ${evaluation.score_overall}/100</p><p>Probabilidade de Fechamento: ${evaluation.close_probability}%</p><h2>Feedback</h2><p>${evaluation.feedback_geral}</p></div>`;

    // Save report (upsert)
    const report = await prisma.report.upsert({
      where: { roleplayId },
      update: {
        scoreOverall: evaluation.score_overall,
        closeProbability: evaluation.close_probability,
        scores: evaluation.scores,
        radar: radarStatus,
        htmlReport,
        feedbackGeral: evaluation.feedback_geral,
        pontosFortes: evaluation.pontos_fortes,
        areasMelhoria: evaluation.areas_melhoria,
        proximosPassos: evaluation.proximos_passos,
        feedbackCompetencias: evaluation.feedback_competencias || {},
      },
      create: {
        roleplayId,
        organizationId: roleplay.organizationId,
        scoreOverall: evaluation.score_overall,
        closeProbability: evaluation.close_probability,
        scores: evaluation.scores,
        radar: radarStatus,
        htmlReport,
        feedbackGeral: evaluation.feedback_geral,
        pontosFortes: evaluation.pontos_fortes,
        areasMelhoria: evaluation.areas_melhoria,
        proximosPassos: evaluation.proximos_passos,
        feedbackCompetencias: evaluation.feedback_competencias || {},
      },
    });

    // Update roleplay status
    await prisma.roleplay.update({
      where: { id: roleplayId },
      data: { status: 'evaluated', finishedAt: new Date() },
    });

    // Generate voucher if score >= threshold
    let voucher = null;
    if (evaluation.score_overall >= VOUCHER_THRESHOLD) {
      const code = generateVoucherCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      const voucherData = await prisma.voucher.create({
        data: {
          userId,
          roleplayId,
          code,
          status: 'issued',
          expiresAt,
          metadata: {
            score_overall: evaluation.score_overall,
            segment_name: segment?.name,
            profile_name: profile?.displayName,
            earned_at: new Date().toISOString(),
          },
        },
      });
      voucher = { id: voucherData.id, code: voucherData.code, expires_at: voucherData.expiresAt };
    }

    res.json({
      success: true,
      report: {
        id: report.id,
        score_overall: evaluation.score_overall,
        close_probability: evaluation.close_probability,
        scores: evaluation.scores,
        radar: radarStatus,
        pontos_fortes: evaluation.pontos_fortes,
        areas_melhoria: evaluation.areas_melhoria,
        feedback_geral: evaluation.feedback_geral,
        proximos_passos: evaluation.proximos_passos,
        feedback_competencias: evaluation.feedback_competencias,
      },
      voucher,
    });
  } catch (err) {
    if (err instanceof AiError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
}
