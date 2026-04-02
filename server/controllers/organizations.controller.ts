import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    // Organization creation is disabled - org is pre-configured
    throw new AppError(403, 'Criação de organizações está desabilitada. Contate o administrador.');

    const userId = req.user!.userId;
    const { name } = req.body;

    if (!name) throw new AppError(400, 'Nome da organização é obrigatório');

    // Check if user already has an organization
    const existingProfile = await prisma.profile.findUnique({ where: { userId } });
    if (existingProfile?.organizationId) {
      throw new AppError(400, 'Usuário já pertence a uma organização');
    }

    const org = await prisma.organization.create({
      data: { name, adminUserId: userId },
    });

    // Update profile with organization
    await prisma.profile.update({
      where: { userId },
      data: { organizationId: org.id },
    });

    // Update role to admin
    await prisma.userRoleRecord.update({
      where: { userId },
      data: { role: 'admin' },
    });

    // Create default prompt templates
    await prisma.promptTemplate.createMany({
      data: [
        {
          organizationId: org.id,
          type: 'client',
          template: `Você é um cliente potencial em uma simulação de vendas.

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
6. Responda de forma concisa (máximo 3-4 frases por mensagem)`,
          variables: ['segment_name', 'segment_description', 'segment_context', 'profile_name', 'profile_display_name', 'objection_style'],
        },
        {
          organizationId: org.id,
          type: 'evaluation',
          template: `Você é um AVALIADOR RIGOROSO de vendedores. Analise a conversa abaixo com critério profissional.

CONTEXTO:
- Segmento: {{segment_name}}
- Perfil do Cliente: {{profile_display_name}}
- Estilo de Objeção: {{objection_style}}

TRANSCRIÇÃO:
{{transcript}}

Avalie nos critérios: RAPPORT, ESCUTA ATIVA, CLAREZA, PERSUASÃO, OBJEÇÕES, FECHAMENTO (0-100 cada).

IMPORTANTE: Responda APENAS com JSON válido.`,
          variables: ['segment_name', 'profile_display_name', 'objection_style', 'transcript'],
        },
      ],
    });

    res.status(201).json(org);
  } catch (err) { next(err); }
}

export async function getMine(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile?.organizationId) {
      return res.json(null);
    }
    const org = await prisma.organization.findUnique({ where: { id: profile.organizationId } });
    res.json(org);
  } catch (err) { next(err); }
}
